# AI Audit Report — AMI 2.0
**Date:** 2026-03-30  
**Auditor:** Cascade AI Engineer  
**Scope:** Full AI pipeline — 16 agents, RAG, prompt safety, cost guardrails, circuit breaker, structured outputs, observability

---

## Scope

| Subsystem | Files Audited |
|---|---|
| Agent execution pipeline | `convex/agents/base.ts`, `instances.ts`, `queries.ts`, `mutations.ts` |
| RAG architecture | `convex/rag/productKnowledge.ts` |
| Prompt injection & PII | `convex/lib/piiGuard.ts`, `agents/tools.ts` |
| Model routing & fallback | `convex/agents/base.ts`, `circuitBreaker.ts` |
| Cost / rate limiting | `convex/lib/orchestrator.ts`, `rateLimit.ts`, `lib/pricing.ts`, `billing.ts` |
| Workflow orchestration | `convex/agents/workflows.ts` |
| Structured outputs | `convex/agents/instances.ts` (agent instructions) |
| Observability | `convex/analytics/securityAudit.ts`, `activityFeed.ts`, `queries.ts` |

---

## System Map

```
User request
  → HTTP webhook / Convex action
    → PII scan (piiGuard.ts) ✅
    → Brand context injection (workspaces.ts) ✅
    → Cost ceiling check (base.ts: DAILY + PER_RUN) ✅
    → Circuit breaker check (circuitBreaker.ts) ✅
    → Agent.generate() / generateText() / generateObject()
      → Tool calls: searchBrandMemory → RAG (injection scan ✅, grounding check ✅)
      → Tool calls: auditContent → Brand Guardian agent
      → Tool calls: updateStatus → DB write
    → Output quality eval (evaluateOutputQuality) ✅
    → saveDraft quality gate (stub + min-length) ✅
    → Security audit log (securityAuditLog table) ✅
    → activityFeed event ✅
```

**Agent Tiers:** 5 tiers / 16 agents / 3 models (gpt-5.4, gpt-5.4-mini, gpt-5.4-nano)  
**RAG tables:** `brandKnowledge`, `marketingKnowledge` (Azure text-embedding-3-small, 1536d)  
**Crons:** 14 scheduled jobs (content, social, competitor, cleanup, health scores)

---

## Findings

### 🔴 BLOCKER — 1 finding

---

#### B-1: Low RAG grounding confidence returns results to model without quarantine

**File:** `convex/rag/productKnowledge.ts:100-114`  
**Issue:** When `avgSimilarity < LOW_GROUNDING_THRESHOLD (0.45)`, the system logs a warning and persists an audit event — but still **returns the low-confidence chunks to the calling agent**. The model receives weakly grounded context and is highly likely to hallucinate on top of it. The threshold of 0.45 is also far below typical acceptable retrieval quality (0.65–0.75).

```typescript
// Current: warning fires but cleanDocuments still returned
if (checkGrounding && avgSimilarity < LOW_GROUNDING_THRESHOLD) {
  console.warn(`[RAG-1] Low grounding confidence: ${avgSimilarity.toFixed(3)}`);
  void ctx.runMutation(internal.analytics.securityAudit.recordSecurityEventInternal, {...});
}
// ... returns cleanDocuments anyway
```

**Fix:**
1. Raise `LOW_GROUNDING_THRESHOLD` from `0.45` → `0.62`.
2. Add a `HARD_REJECT_THRESHOLD = 0.40` — below which return `[]` with a `grounding: "insufficient"` flag rather than low-confidence context.
3. Pass the `grounding` flag to the agent so it can respond with "insufficient knowledge base data" rather than hallucinating.

---

### 🟠 HIGH — 5 findings

---

#### H-1: External Reddit content not injection-scanned before agent ingestion

**File:** `convex/growth/reddit.ts`  
**Issue:** Reddit post titles, `selftext`, and author data fetched from the Reddit API are passed directly into agent prompts (as `coreMessage` or context strings) without running through `scanForInjection`. An adversary posting crafted content in a monitored subreddit (e.g., `r/IndiaInvestments`) can execute a prompt injection attack against the Social Community Manager or Growth Strategist agents.

The RAG injection scanner (`scanForInjection`) exists and is applied to **brand knowledge documents** — but there's no call to it on external Reddit data.

**Fix:** Before passing any `RedditPost.title`, `selftext`, or `author` into agent prompts in `reddit.ts`, call:
```typescript
import { scanForInjection } from "../rag/productKnowledge";
const check = scanForInjection(`${post.title}\n${post.selftext ?? ""}`);
if (!check.clean) {
  void ctx.runMutation(internal.analytics.securityAudit.recordSecurityEventInternal, {
    type: "injection_attempt", severity: "high",
    details: `Reddit injection pattern "${check.pattern}" in post ${post.id}`,
    metadata: { postId: post.id, subreddit }
  });
  continue; // skip this post
}
```

---

#### H-2: Trust score `outputQualityScore` is a hardcoded constant, not real data

**File:** `convex/analytics/securityAudit.ts:recalculateAllTrustScores`  
**Issue:** The trust score system presents quality and compliance scores as real observability data, but both are synthetic constants:

```typescript
const outputQualityScore = 95;  // ← always 95, for every agent, always
const complianceScore = 98;      // ← always 98
```

The UI (Governance/Security dashboard) displays these as live agent trust metrics. This is misleading — quality regressions will never surface here. Only `reliabilityScore` (from failure rate) is real.

**Fix:** Pipe `evaluateOutputQuality` results into the trust score update. In `finishAgentRun` (or in the output quality check path in `base.ts`), include the quality score in run `metadata`. Then `recalculateAllTrustScores` should average `metadata.qualityScore` across recent runs per agent.

---

#### H-3: `assertWorkflowCostBudget` is global — not scoped per workspace

**File:** `convex/lib/orchestrator.ts:assertWorkflowCostBudget`  
**Issue:** In a multi-tenant system, the workflow cost check queries **all agent runs** globally:

```typescript
const runs = await ctx.runQuery(internal.agents.mutations.getRunsSince, { since });
// getRunsSince: queries agentRuns by startedAt globally — no workspaceId filter
const spend = runs.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
if (spend >= WORKFLOW_COST_CEILING_USD) throw new Error(...);
```

Workspace A's heavy usage blocks Workspace B's workflows. Conversely, one workspace's $10 ceiling is meaningless when shared across all tenants.

**Fix:** Pass `workspaceId` to `assertWorkflowCostBudget` and `getRunsSince`. Filter runs by `workspaceId` before summing. The `agentRuns` table needs a `by_workspace_started_at` composite index.

---

#### H-4: Image generation batch has no cost ceiling

**File:** `convex/agents/workflows.ts` (image batch calls throughout)  
**Issue:** `generateLaunchVisualBatch` is called in `weeklyContentCycleWorkflow`, `campaignLaunchWorkflow`, and `emergencyRegimePlaybook` with no per-batch spend guard. At $0.076/image (4K tier), a batch of 100 images = $7.60. The `PER_RUN_COST_CEILING_USD = 5.0` does not cover image generation (which happens outside `executeAgentAction`).

**Fix:** Add an `assertImageBatchBudget(count, quality)` check before calling `generateLaunchVisualBatch`. Use `calculateImageCost` from `pricing.ts` to estimate batch cost pre-flight and throw if it would exceed the per-run ceiling.

---

#### H-5: `emergencyRegimePlaybook` explicitly bypasses all cost guards

**File:** `convex/agents/workflows.ts:emergencyRegimePlaybook`  
**Issue:**
```typescript
// No cost guard here — emergency playbooks must always run regardless of spend
```
While the intent is uptime-critical, this creates an unbounded spend path. The webhook endpoint that triggers this is auth-gated by API key in `http.ts`, but if that key leaks or the webhook is replayed, an attacker can trigger unlimited AI spend with no ceiling.

**Fix:** Add a soft ceiling (e.g., `$25` per emergency trigger) rather than no ceiling at all. Log a `[BUDGET-OVERRIDE]` security audit event every time the emergency playbook runs so bypasses are durable and reviewable.

---

### 🟡 MEDIUM — 7 findings

---

#### M-1: Structured output relies on prompt instructions only — no schema enforcement

**Agents affected:** `competitorIntelligence`, `emailMarketingSpecialist`, `distributionEngine`

**Issue:** Three agents are instructed via free-text system prompt to return specific JSON structures:

- `competitorIntelligence`: "Output must be a valid JSON object matching the CompetitorReport interface exactly"
- `emailMarketingSpecialist`: "Return output as a valid JSON object with fields: subject, preheader, htmlBody"
- `distributionEngine`: "Return a single UTC ISO 8601 timestamp and one-sentence justification"

These agents use `agent.generate()` (text mode), not `generateObject()` with a Zod schema. When the model adds preamble, explanation, or malformed JSON, downstream parsing silently fails or crashes.

**Fix:** Switch these three agents to `executeAgentObjectAction` with a Zod schema. The AI SDK retries automatically on schema validation failure (up to 3 times). Example:
```typescript
const schema = z.object({
  subject: z.string(),
  preheader: z.string(),
  htmlBody: z.string(),
});
const result = await executeAgentObjectAction(ctx, emailMarketingSpecialist, prompt, schema);
```

---

#### M-2: `REASONING_EFFORT_MAP` defined but not verifiably passed to Azure provider

**File:** `convex/agents/base.ts:REASONING_EFFORT_MAP`, `convex/lib/azureProvider.ts`  
**Issue:** `getReasoningEffort(agentName)` returns levels from `"none"` to `"high"` for all 16 agents, but the Azure provider shim (`azureProvider.ts`) uses `openAIProviderOptions(options)` which reads from `options.providerOptions?.openai`. If `reasoning_effort` is not explicitly threaded through `providerOptions`, the reasoning effort map has no effect and all agents use the model's default effort — wasting cost on low-tier agents (e.g., `emailMarketingSpecialist` should be `"none"`) or under-computing on strategic agents.

**Fix:** In `executeAgentAction`, pass reasoning effort via providerOptions:
```typescript
providerOptions: {
  openai: { reasoning_effort: getReasoningEffort(agent.options.name) }
}
```
Then verify the Azure shim reads and forwards this field in `openAIProviderOptions`.

---

#### M-3: Circuit breaker opens per-model globally — not per-workspace

**File:** `convex/agents/circuitBreaker.ts`  
**Issue:** `modelId` is the circuit key (e.g., `"gpt-5.4"`). In multi-tenant operation, if one workspace's agents hammer GPT-5.4 and hit the 5-failure threshold, the circuit opens for **all workspaces**. A badly behaved tenant disrupts everyone.

**Fix:** Key the circuit on `${workspaceId}:${modelId}` or use a global circuit for genuine infrastructure failures (which is correct) but add **per-workspace** soft rate limiting before hitting the circuit threshold.

---

#### M-4: `searchLinkedInSimulated` can present hallucinated data as real LinkedIn profiles

**File:** `convex/agents/tools.ts:searchLinkedInSimulated`  
**Issue:** The tool generates simulated LinkedIn profiles (fake data). The `linkedinDiscovery` agent is instructed: "Use searchLinkedInSimulated if the real scraper is down." Nothing in the agent instruction, the tool definition, or the output marks simulated results as synthetic. Outreach generated from simulated profiles may reference non-existent people, companies, or roles.

**Fix:** The tool's output should include a `simulated: true` marker. The `linkedinDiscovery` agent instruction should be updated: "When using searchLinkedInSimulated, prefix all output with `[SIMULATED DATA — NOT FOR OUTREACH]`". Do not allow `linkedinOutreachAgent` to consume simulated discovery output.

---

#### M-5: Rate limit cleanup uses full table scan — no timestamp index

**File:** `convex/lib/rateLimit.ts:_deleteOldRateLimitEntries`  
**Issue:**
```typescript
const oldEntries = await ctx.db
  .query("rateLimits")
  .filter((q) => q.lt(q.field("timestamp"), cutoff))
  .take(1000);
```
`.filter()` is a post-read in-memory filter — it reads the entire `rateLimits` table before discarding non-matching rows. As the table grows (auth attempts accumulate), this daily cron becomes increasingly expensive.

**Fix:** Add a `by_timestamp` index to the `rateLimits` table in `schema.ts` and rewrite:
```typescript
const oldEntries = await ctx.db
  .query("rateLimits")
  .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
  .take(1000);
```

---

#### M-6: `recalculateAllTrustScores` N+1 query pattern

**File:** `convex/analytics/securityAudit.ts:recalculateAllTrustScores`  
**Issue:** The mutation fetches up to 1000 runs, groups by agent, then for each unique agent issues `ctx.db.query("agentTrustScores").withIndex("by_agent", ...).unique()` — one DB read per agent inside a loop. With 16 agents this is 16 sequential reads inside a single mutation.

**Fix:** Pre-fetch all existing trust scores in one query before the loop:
```typescript
const allScores = await ctx.db.query("agentTrustScores").take(100);
const scoreMap = new Map(allScores.map(s => [s.agentName, s]));
// then use scoreMap.get(agentName) inside the loop
```

---

#### M-7: `getSecurityDashboard` full table scan on `securityAuditLog`

**File:** `convex/analytics/securityAudit.ts:getSecurityDashboard`  
**Issue:**
```typescript
const recentEvents = await ctx.db
  .query("securityAuditLog")
  .filter((q) => q.gt(q.field("timestamp"), last24h))
  .take(1000);
```
Same issue as M-5: full table scan with in-memory timestamp filter. In production with thousands of security events this degrades linearly.

**Fix:** Add `by_timestamp` index to `securityAuditLog` in `schema.ts`.

---

### 🟢 LOW — 6 findings

---

#### L-1: No source citation in RAG output — claims are untraceable

**File:** `convex/rag/productKnowledge.ts:searchBrandKnowledge`  
**Issue:** Documents are returned as content strings with no `sourceDoc`, `category`, or `title` attached to retrieved chunks. Agent outputs that cite DSE formulas or ARCS methodology can't be traced back to a specific whitepaper section for human review.

**Fix:** Return `{ content, _id, category, title }` from `getBatchById` and include `[Source: {title}]` markers in the context injected into the prompt.

---

#### L-2: RAG injection patterns don't cover base64 or token-smuggling bypass

**File:** `convex/rag/productKnowledge.ts:INJECTION_PATTERNS`  
**Issue:** `normalizeForScanning` handles Unicode homoglyphs and spaced-out letters (`i.g.n.o.r.e`) well. But base64-encoded instructions (`aWdub3JlIHByZXZpb3VzIGluc3RydWN0aW9ucw==`) and null-byte/zero-width smuggling between individual characters are not detected.

**Fix:** Add two patterns:
```typescript
// Base64 blocks that decode to injection keywords
{ regex: /[A-Za-z0-9+/]{40,}={0,2}/g, check: (m) => isInjectionAfterDecode(m) }
// Null-byte smuggling (zero-width between letters already handled, but add \x00)
.replace(/\x00/g, "")
```

---

#### L-3: No workflow-level correlation ID in logs

**File:** `convex/lib/orchestrator.ts:createWorkflowContext`, `convex/agents/base.ts`  
**Issue:** `workflowId` and `threadId` are created per workflow and passed to agents, but they are not consistently included in `console.warn`/`console.error` log lines inside `executeAgentAction`. When multiple workflows run concurrently, log lines from different workflows interleave with no way to group them.

**Fix:** Pass `workflowId` through to `executeAgentAction` and include it in all log prefixes: `[AGENT:${agentName}][WF:${workflowId}]`.

---

#### L-4: `wipeAllWorkspaceData` has no soft-delete or pre-wipe snapshot

**File:** `convex/agents/mutations.ts:wipeAllWorkspaceData`  
**Issue:** Admin-triggered wipe immediately and permanently deletes all rows from all 38 workspace tables with no backup, no confirmation token (beyond the string literal), and no rollback path. One admin mistake causes complete unrecoverable data loss.

**Fix:** Before deletion, write a `dataWipeAuditLog` entry with counts per table and a `wiped_by` field. Consider a two-phase confirmation (issue a time-limited token, require a second mutation call with that token within 60s).

---

#### L-5: No p95/p99 latency tracking — only averages

**File:** `convex/analytics/queries.ts:getPerformanceData`  
**Issue:** `avgLatencyMs` is averaged across all runs per agent. One 55-second run (near the 60s `MAX_LATENCY_MS` ceiling) inflates the average but doesn't surface in any percentile metric. Tail latency is invisible.

**Fix:** Store latency in `agentRuns.latencyMs` on `finishAgentRun`. Then compute p95 from the sorted distribution in `getPerformanceData`:
```typescript
const sorted = bucket.map(r => r.latencyMs ?? 0).sort((a,b) => a-b);
const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
```

---

#### L-6: No chunk deduplication or freshness TTL in brand knowledge

**File:** `convex/rag/productKnowledge.ts`  
**Issue:** `brandKnowledge` documents have no `updatedAt` TTL check. If the whitepaper is updated and new chunks are ingested, old stale chunks remain in the vector index and can be retrieved alongside new ones — producing contradictory context.

**Fix:** Add an `updatedAt` and `version` field to `brandKnowledge`. In `searchBrandKnowledge`, filter out documents where `version < currentWhitepaperVersion`. Alternatively, use a batch re-index mutation that marks old chunks as `archived: true` before ingesting updated ones.

---

## Guardrails — Present / Missing

| Guardrail | Status | Notes |
|---|---|---|
| PII redaction before LLM calls | ✅ Present | `scanAndRedactPii` in `executeAgentAction` |
| Prompt injection scan (RAG) | ✅ Present | `scanForInjection` on brand knowledge |
| Prompt injection scan (external web) | ❌ Missing | Reddit content not scanned — **H-1** |
| Output quality evaluation | ✅ Present | `evaluateOutputQuality` post-generation |
| Circuit breaker (per-model) | ✅ Present | 5-failure threshold, 60s cooldown, probe mutex |
| Daily cost ceiling | ✅ Present | `$50.00` checked in `executeAgentAction` |
| Per-run cost ceiling | ✅ Present | `$5.00` checked in `executeAgentAction` |
| Workflow cost ceiling | ✅ Present | `$10.00` in `assertWorkflowCostBudget` |
| Image generation cost ceiling | ❌ Missing | No pre-flight budget check — **H-4** |
| Per-workspace cost isolation | ❌ Missing | Global spend counter — **H-3** |
| Structured output schema validation | ❌ Partial | 3 agents use text mode, not `generateObject` — **M-1** |
| RAG grounding hard-reject | ❌ Missing | Warns but still returns low-confidence context — **B-1** |
| Auth rate limiting (sign-in) | ✅ Present | DB-backed, 5 attempts/15 min |
| Auth rate limiting (sign-up) | ✅ Present | 3 attempts/hour |
| Security audit log | ✅ Present | Durable `securityAuditLog` table |
| Agent trust score | ⚠️ Partial | Reliability is real; quality/compliance are hardcoded — **H-2** |
| Reasoning effort per agent | ⚠️ Unverified | Map defined but pass-through unconfirmed — **M-2** |

---

## Recommended Fixes (Priority Order)

| # | Severity | Action | File |
|---|---|---|---|
| 1 | 🔴 BLOCKER | Raise grounding threshold to 0.62; hard-reject below 0.40 | `rag/productKnowledge.ts` |
| 2 | 🟠 HIGH | Run `scanForInjection` on Reddit titles + selftext before agent injection | `growth/reddit.ts` |
| 3 | 🟠 HIGH | Wire real `evaluateOutputQuality` scores into `recalculateAllTrustScores` | `analytics/securityAudit.ts` |
| 4 | 🟠 HIGH | Scope `assertWorkflowCostBudget` + `getRunsSince` by `workspaceId` | `lib/orchestrator.ts`, `agents/mutations.ts` |
| 5 | 🟠 HIGH | Add `assertImageBatchBudget` pre-flight check before image generation | `agents/workflows.ts` |
| 6 | 🟠 HIGH | Add soft ceiling + audit event to `emergencyRegimePlaybook` | `agents/workflows.ts` |
| 7 | 🟡 MEDIUM | Switch 3 agents to `generateObject` + Zod schema | `agents/instances.ts`, `base.ts` |
| 8 | 🟡 MEDIUM | Verify and thread `reasoning_effort` through `azureProvider.ts` | `lib/azureProvider.ts`, `agents/base.ts` |
| 9 | 🟡 MEDIUM | Mark `searchLinkedInSimulated` outputs as simulated; block from outreach | `agents/tools.ts`, `instances.ts` |
| 10 | 🟡 MEDIUM | Add `by_timestamp` index to `rateLimits` + `securityAuditLog` | `convex/schema.ts` |
| 11 | 🟡 MEDIUM | Fix N+1 in `recalculateAllTrustScores` (pre-fetch all scores) | `analytics/securityAudit.ts` |
| 12 | 🟢 LOW | Add RAG source citation (`title`, `category`) to retrieved chunks | `rag/productKnowledge.ts` |
| 13 | 🟢 LOW | Thread `workflowId` through all log lines in `executeAgentAction` | `agents/base.ts`, `lib/orchestrator.ts` |
| 14 | 🟢 LOW | Add p95 latency to `getPerformanceData` | `analytics/queries.ts` |
| 15 | 🟢 LOW | Add chunk `version` TTL for brand knowledge freshness | `rag/productKnowledge.ts`, `schema.ts` |
| 16 | 🟢 LOW | Add two-phase confirmation + pre-wipe snapshot to `wipeAllWorkspaceData` | `agents/mutations.ts` |
