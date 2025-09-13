# Backend (Convex)

Convex backend powering authentication, data storage, realtime, and integrations (AI, VAPI, AWS) for Fusion Chat.

## Prerequisites

- Convex CLI: `npm i -g convex`
- Node 20+, pnpm 10+

## Environment Variables (`packages/backend/.env.local`)

```bash
# Local dev deployment used by `convex dev`
CONVEX_DEPLOYMENT=dev:your-deployment
CONVEX_URL=https://<your-project>.convex.cloud

# Clerk JWT issuer and backend secret
CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk>.clerk.accounts.dev
CLERK_SECRET_KEY=

# AI / Integrations (optional depending on used features)
OPENAI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
```

Security: Use Convex/Vercel secret managers in production. Never commit secrets.

## Run Locally

From the repo root or this package dir:

```bash
pnpm --filter @workspace/backend dev
```

The first run will guide you through Convex project setup. Once running, point apps to your Convex deployment URL with `NEXT_PUBLIC_CONVEX_URL`.

## Data Model

Schema in `convex/schema.ts`:
- `subscriptions` — by org, status
- `widgetSettings` — org-level widget config, greet message, default suggestions, VAPI settings
- `plugins` — org-level integrations (e.g., VAPI) with secret names
- `conversations` — threads by org and status, linked to `contactSessions`
- `contactSessions` — visitor session metadata and expiry
- `users` — user profiles

Indices are defined for efficient filtering by org, status, thread and session.

## Functions & Structure

- `public/` — public queries/mutations/actions callable from clients (with contact session validation)
- `private/` — privileged functions requiring Clerk-authenticated users (org-bound)
- `system/` — internal helpers used by other functions (`internal.system.*`)
- `auth.config.ts` — auth helpers/config for Convex
- `users.ts` — user-related helpers

Use `convex/README.md` for function authoring patterns and the Convex docs for details.

---

## API Reference

This section summarizes key exported functions and argument schemas. See source files in `convex/public/`, `convex/private/`, and `convex/system/` for full details.

### Public (`convex/public/*`)

- `conversations.getMany({ contactSessionId: Id<"contactSessions">, paginationOpts })` — returns paginated conversations for a contact session, including last message via agent. Validates session.
- `conversations.getOne({ conversationId: Id<"conversations">, contactSessionId: Id<"contactSessions"> })` — returns minimal conversation data; validates session ownership.
- `conversations.create({ organizationId: string, contactSessionId: Id<"contactSessions"> })` — creates conversation + agent thread and seeds greet message based on widget settings.

- `messages.create({ prompt: string, threadId: string, contactSessionId: Id<"contactSessions"> })` [action] — validates session, ensures conversation active, optionally triggers agent tools (`escalate`, `resolve`, `search`) or appends user message.
- `messages.getMany({ threadId: string, paginationOpts, contactSessionId: Id<"contactSessions"> })` — lists messages in a thread via agent storage; validates session.

- `contactSessions.create({ name, email, organizationId, metadata? })` — creates a contact session with expiry.
- `contactSessions.validate({ contactSessionId })` — returns validity and details for a session.

- `organizations.validate({ organizationId })` [action] — validates an org via Clerk.

- `secrets.getVapiSecrets({ organizationId })` [action] — returns public part of VAPI secrets (publicApiKey) for given org by fetching from AWS Secrets Manager via internal plugin lookup.

### Private (`convex/private/*`)

- `widgetSettings.getOne()` — returns current org's widget settings. Requires Clerk identity with `orgId`.
- `widgetSettings.upsert({ greetMessage: string, defaultSuggestions: { suggestion1?, suggestion2?, suggestion3? }, vapiSettings: { assistantId?, phoneNumber? } })` — inserts or updates org's widget settings.

- `plugins.getOne({ service: "vapi" })` — returns plugin record for the current org and service.
- `plugins.remove({ service: "vapi" })` — removes a plugin for the current org.

- `files.*` — upload/delete/list files (see `convex/private/files.ts`).
- `messages.*` — admin-side actions like `enhanceResponse`, `getMany` for threads (see `convex/private/messages.ts`).
- `conversations.*` — admin-side `getOne`, `getMany`, `updateStatus` (see `convex/private/conversations.ts`).
- `secrets.upsert` — store/update service secret references (see `convex/private/secrets.ts`).
- `vapi.*` — assistants and phone numbers fetchers (see `convex/private/vapi.ts`).

### System (`convex/system/*`)

Internal, called via `internal.system.*`:

- `contactSessions.getOne({ contactSessionId })`, `contactSessions.refresh({ contactSessionId })`
- `conversations.getByThreadId({ threadId })`
- `plugins.getByOrganizationIdAndService({ organizationId, service })`
- `secrets.*` — helpers for secret retrieval
- `ai/*` — agent definitions and tools: `escalateConversation`, `resolveConversation`, `search`

---

## API Tables (Return Types)

The following tables summarize argument and return types. Return types are inferred from implementations and may be simplified for docs. Refer to source for full shapes.

#### Public

| Function | Args | Returns |
|---|---|---|
| `conversations.getMany` | `{ contactSessionId: Id<"contactSessions">, paginationOpts }` | `{ page: Array<{ _id: Id<"conversations">, _creationTime: number, status: "unresolved"|"escalated"|"resolved", organizationId: string, threadId: string, lastMessage: MessageDoc|null }>, isDone: boolean, continueCursor?: string }` |
| `conversations.getOne` | `{ conversationId: Id<"conversations">, contactSessionId: Id<"contactSessions"> }` | `{ _id: Id<"conversations">, status: "unresolved"|"escalated"|"resolved", threadId: string }` |
| `conversations.create` | `{ organizationId: string, contactSessionId: Id<"contactSessions"> }` | `Id<"conversations">` |
| `messages.create` (action) | `{ prompt: string, threadId: string, contactSessionId: Id<"contactSessions"> }` | `void` |
| `messages.getMany` | `{ threadId: string, paginationOpts, contactSessionId: Id<"contactSessions"> }` | `{ page: MessageDoc[], isDone: boolean, continueCursor?: string }` |
| `contactSessions.create` | `{ name: string, email: string, organizationId: string, metadata?: ContactMetadata }` | `Id<"contactSessions">` |
| `contactSessions.validate` | `{ contactSessionId: Id<"contactSessions"> }` | `{ valid: true, contactSession: ContactSessionDoc } \| { valid: false, reason: string }` |
| `organizations.validate` (action) | `{ organizationId: string }` | `{ valid: boolean, reason?: string }` |
| `secrets.getVapiSecrets` (action) | `{ organizationId: string }` | `{ publicApiKey: string } \| null` |

Types referenced: `MessageDoc` from `@convex-dev/agent`, `ContactSessionDoc` from Convex table, `ContactMetadata` is the optional object in `contactSessions.create` args.

#### Private

| Function | Args | Returns |
|---|---|---|
| `widgetSettings.getOne` | `{}` | `WidgetSettingsDoc \| null` |
| `widgetSettings.upsert` | `{ greetMessage: string, defaultSuggestions: { suggestion1?: string, suggestion2?: string, suggestion3?: string }, vapiSettings: { assistantId?: string, phoneNumber?: string } }` | `void` |
| `plugins.getOne` | `{ service: "vapi" }` | `PluginDoc \| null` |
| `plugins.remove` | `{ service: "vapi" }` | `void` |
| `files.addFile` (action) | implementation-defined | e.g. `{ fileId: Id<"files"> }` |
| `files.deleteFile` | `{ fileId: Id<"files"> }` | `void` |
| `files.list` (paginated) | `{}` | `{ page: FileDoc[], isDone: boolean, continueCursor?: string }` |
| `messages.getMany` | `{ threadId: string, paginationOpts }` | `{ page: MessageDoc[], isDone: boolean, continueCursor?: string }` |
| `messages.create` | `{ threadId: string, message: string }` | `void` |
| `messages.enhanceResponse` (action) | `{ threadId: string, message: string }` | `{ message: string }` |
| `conversations.getOne` | `{ conversationId: Id<"conversations"> }` | `ConversationDoc` |
| `conversations.getMany` (paginated) | `{ status?: "all"|"unresolved"|"escalated"|"resolved" }` | `{ page: ConversationDoc[], isDone: boolean, continueCursor?: string }` |
| `conversations.updateStatus` | `{ conversationId: Id<"conversations">, status: "unresolved"|"escalated"|"resolved" }` | `void` |
| `secrets.upsert` | `{ service: "vapi", secretName: string }` | `void` |
| `vapi.getAssistants` (action) | `{}` | `{ id: string, name: string }[]` |
| `vapi.getPhoneNumbers` (action) | `{}` | `{ id: string, phoneNumber: string }[]` |

Note: Some private functions are summarized from filenames and usage sites; check `convex/private/*.ts` for exact shapes.

#### System (internal)

| Function | Args | Returns |
|---|---|---|
| `contactSessions.getOne` | `{ contactSessionId: Id<"contactSessions"> }` | `ContactSessionDoc \| null` |
| `contactSessions.refresh` | `{ contactSessionId: Id<"contactSessions"> }` | `void` |
| `conversations.getByThreadId` | `{ threadId: string }` | `ConversationDoc \| null` |
| `plugins.getByOrganizationIdAndService` | `{ organizationId: string, service: "vapi" }` | `PluginDoc \| null` |
| `secrets.*` | helper functions | implementation-defined |
| `ai/tools.*` | varies | helpers used by agents |

---

## Web App → Backend Usage Map

Examples of how `apps/web` calls Convex APIs (via `@workspace/backend/_generated/api`):

- `modules/customization/ui/views/customization-view.tsx`
  - `useQuery(api.private.widgetSettings.getOne)` — read widget settings
  - `useQuery(api.private.plugins.getOne, { service: "vapi" })` — check VAPI plugin
  - `CustomizationForm` uses `useMutation(api.private.widgetSettings.upsert)` to save

- `modules/plugins/ui/views/vapi-view.tsx`
  - `useMutation(api.private.secrets.upsert)` — save VAPI secret reference
  - `useMutation(api.private.plugins.remove)` — disconnect VAPI
  - `useQuery(api.private.plugins.getOne, { service: "vapi" })`

- `modules/plugins/hooks/use-vapi-data.ts`
  - `useAction(api.private.vapi.getAssistants)` / `useAction(api.private.vapi.getPhoneNumbers)` — fetch lists

- `modules/dashboard/ui/views/conversation-id-view.tsx`
  - `useQuery(api.private.conversations.getOne, { conversationId })`
  - `useThreadMessages(api.private.messages.getMany, { threadId })`
  - `useAction(api.private.messages.enhanceResponse)`
  - `useMutation(api.private.messages.create)`
  - `useMutation(api.private.conversations.updateStatus)`

- `modules/files/ui/views/files-view.tsx`
  - `usePaginatedQuery(api.private.files.list, {})`
  - Upload/Delete dialogs use `useAction(api.private.files.addFile)` and `useMutation(api.private.files.deleteFile)`

For client-facing widget interactions, see `convex/public/*` endpoints (used by the iframe app or embed flow).

---

## Integrations

- `@convex-dev/agent` and `@convex-dev/rag` — AI agents and retrieval augmentation
- `@vapi-ai/server-sdk` — telephony/voice assistant integration
- `@ai-sdk/openai` — OpenAI API client
- `@aws-sdk/client-secrets-manager` — secret storage and retrieval

## Deployment

- Push functions with Convex CLI. See: `npx convex -h`.
- Configure production secrets in your hosting environment.
