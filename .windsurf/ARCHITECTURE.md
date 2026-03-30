# Antigravity Kit Architecture

> Comprehensive AI Agent Capability Expansion Toolkit

---

## 📋 Overview

Antigravity Kit is a modular system consisting of:

- **26 Specialist Agents** - Role-based AI personas
- **42 Skills** - Domain-specific knowledge modules
- **14 Workflows** - Slash command procedures

---

## 🏗️ Directory Structure

```plaintext
.windsurf/
├── ARCHITECTURE.md          # This file
├── agents/                  # 26 Specialist Agents
├── skills/                  # 42 Skills
├── workflows/               # 14 Slash Commands
├── rules/                   # Global Rules
└── scripts/                 # Master Validation Scripts
```

---

## 🤖 Agents (26)

Specialist AI personas for different domains.

| Agent                    | Focus                      | Skills Used                                              |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `orchestrator`           | Multi-agent coordination   | parallel-agents, behavioral-modes                        |
| `project-planner`        | Discovery, task planning   | brainstorming, plan-writing, architecture                |
| `frontend-specialist`    | Web UI/UX                  | nextjs-react-expert, web-design-guidelines, tailwind-patterns, frontend-design |
| `backend-specialist`     | API, business logic        | api-patterns, nodejs-best-practices, database-design, llm-patterns, data-pipeline-patterns |
| `ai-engineer`            | LLM systems, RAG, evals    | llm-patterns, testing-patterns, python-patterns          |
| `data-engineer`          | ETL/ELT, streaming         | data-pipeline-patterns, database-design                  |
| `marketing-strategist`   | Growth and social strategy | growth-marketing, social-media-patterns, seo-fundamentals |
| `database-architect`     | Schema, SQL                | database-design                                          |
| `mobile-developer`       | iOS, Android, RN           | mobile-design                                            |
| `devops-engineer`        | CI/CD, Docker              | deployment-procedures, docker-expert                     |
| `security-auditor`       | Security compliance        | vulnerability-scanner, red-team-tactics                  |
| `penetration-tester`     | Offensive security         | red-team-tactics                                         |
| `test-engineer`          | Testing strategies         | testing-patterns, tdd-workflow, webapp-testing           |
| `debugger`               | Root cause analysis        | systematic-debugging                                     |
| `performance-optimizer`  | Speed, Web Vitals          | performance-profiling                                    |
| `seo-specialist`         | Ranking, visibility        | seo-fundamentals, geo-fundamentals                       |
| `documentation-writer`   | Manuals, docs              | documentation-templates                                  |
| `product-manager`        | Requirements, user stories | plan-writing, brainstorming                              |
| `product-owner`          | Strategy, backlog, MVP     | plan-writing, brainstorming                              |
| `qa-automation-engineer` | E2E testing, CI pipelines  | webapp-testing, testing-patterns                         |
| `code-archaeologist`     | Legacy code, refactoring   | clean-code, code-review-checklist, systematic-debugging  |
| `explorer-agent`         | Codebase analysis          | -                                                        |
| `sre-engineer`           | SLOs, observability, toil  | deployment-procedures, server-management, systematic-debugging |
| `database-optimizer`     | Query perf, N+1, indexing  | database-design, data-pipeline-patterns                  |
| `autonomous-optimization-architect` | LLM cost routing | llm-patterns, typescript-expert, python-patterns    |
| `compliance-auditor`     | SOC 2, GDPR, ISO 27001     | vulnerability-scanner, documentation-templates           |

---

## 🧩 Skills (42)

Modular knowledge domains that agents can load on-demand. based on task context.

### Frontend & UI

| Skill                   | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `nextjs-react-expert`   | React & Next.js performance optimization, patterns, server components |
| `web-design-guidelines` | Web UI audit - 100+ rules for accessibility, UX, performance          |
| `tailwind-patterns`     | Tailwind CSS v4 utilities                                             |
| `frontend-design`       | UI/UX patterns, design systems                                        |

### Backend & API

| Skill                   | Description                              |
| ----------------------- | ---------------------------------------- |
| `api-patterns`          | REST, GraphQL, tRPC                      |
| `llm-patterns`          | RAG, prompt systems, model routing       |
| `nodejs-best-practices` | Node.js async, modules, production ops   |
| `python-patterns`       | Python standards, FastAPI                |
| `rust-pro`              | Rust systems programming, async patterns |

### Database

| Skill                    | Description                  |
| ------------------------ | ---------------------------- |
| `database-design`        | Schema design, optimization  |
| `data-pipeline-patterns` | ETL/ELT, streaming, quality  |

### TypeScript/JavaScript

| Skill               | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `typescript-expert` | Type modeling, runtime boundaries, maintainable safety |

### Cloud & Infrastructure

| Skill                   | Description               |
| ----------------------- | ------------------------- |
| `docker-expert`         | Containerization, Compose, runtime separation |
| `deployment-procedures` | CI/CD, deploy workflows   |
| `server-management`     | Infrastructure management |

### Testing & Quality

| Skill                   | Description              |
| ----------------------- | ------------------------ |
| `testing-patterns`      | Jest, Vitest, strategies |
| `webapp-testing`        | E2E, Playwright          |
| `tdd-workflow`          | Test-driven development  |
| `code-review-checklist` | Code review standards    |
| `lint-and-validate`     | Linting, validation      |

### Security

| Skill                   | Description              |
| ----------------------- | ------------------------ |
| `vulnerability-scanner` | Security auditing, OWASP |
| `red-team-tactics`      | Offensive security       |

### Architecture & Planning

| Skill           | Description                |
| --------------- | -------------------------- |
| `app-builder`   | Full-stack app scaffolding |
| `architecture`  | System design patterns     |
| `plan-writing`  | Task planning, breakdown   |
| `brainstorming` | Socratic questioning       |

### Mobile

| Skill           | Description           |
| --------------- | --------------------- |
| `mobile-design` | Mobile UI/UX patterns |

### SEO & Growth

| Skill              | Description                   |
| ------------------ | ----------------------------- |
| `seo-fundamentals`      | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals`      | GenAI optimization            |
| `growth-marketing`      | Experimentation and funnel optimization |
| `social-media-patterns` | Platform-native social strategy |

### Shell/CLI

| Skill                | Description               |
| -------------------- | ------------------------- |
| `bash-linux`         | Linux commands, scripting |
| `powershell-windows` | Windows PowerShell        |

### Other

| Skill                     | Description               |
| ------------------------- | ------------------------- |
| `clean-code`              | Coding standards (Global)             |
| `behavioral-modes`        | Agent personas                        |
| `parallel-agents`         | Multi-agent patterns                  |
| `intelligent-routing`     | Auto agent selection and task routing |
| `mcp-builder`             | Model Context Protocol                |
| `documentation-templates` | Doc formats                           |
| `i18n-localization`       | Internationalization                  |
| `performance-profiling`   | Web Vitals, optimization              |
| `systematic-debugging`    | Troubleshooting                       |

---

## 🔄 Workflows (14)

Slash command procedures. Invoke with `/command`.

| Command          | Description              |
| ---------------- | ------------------------ |
| `/brainstorm`    | Socratic discovery       |
| `/audit-ai`      | Audit AI and LLM systems |
| `/create`        | Create new features      |
| `/debug`         | Debug issues             |
| `/deploy`        | Deploy application       |
| `/enhance`       | Improve existing code    |
| `/growth`        | Growth strategy planning |
| `/orchestrate`   | Multi-agent coordination |
| `/plan`          | Task breakdown           |
| `/preview`       | Preview changes          |
| `/review`        | Multi-domain code review |
| `/status`        | Check project status     |
| `/test`          | Run tests                |
| `/ui-ux-pro-max` | Design with 50 styles    |

---

## 🎯 Skill Loading Protocol

```plaintext
User Request → Skill Description Match → Load SKILL.md
                                            ↓
                                    Read references/
                                            ↓
                                    Read scripts/
```

### Skill Structure

```plaintext
skill-name/
├── SKILL.md           # (Required) Metadata & instructions
├── scripts/           # (Optional) Python/Bash scripts
├── references/        # (Optional) Templates, docs
└── assets/            # (Optional) Images, logos
```

### Enhanced Skills (with scripts/references)

| Skill               | Files | Coverage                            |
| ------------------- | ----- | ----------------------------------- |
| `ui-ux-pro-max`     | 27    | 50 styles, 21 palettes, 50 fonts    |
| `app-builder`       | 20    | Full-stack scaffolding              |

---

## � Scripts (2)

Master validation scripts that orchestrate skill-level scripts.

### Master Scripts

| Script          | Purpose                                 | When to Use              |
| --------------- | --------------------------------------- | ------------------------ |
| `checklist.py`  | Priority-based validation (Core checks) | Development, pre-commit  |
| `verify_all.py` | Comprehensive verification (All checks) | Pre-deployment, releases |

### Usage

```bash
# Quick validation during development
python .windsurf/scripts/checklist.py .

# Full verification before deployment
python .windsurf/scripts/verify_all.py . --url http://localhost:3000
```

### What They Check

**checklist.py** (Core checks):

- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

**verify_all.py** (Full suite):

- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

For details, see [scripts/README.md](scripts/README.md)

---

## 📊 Statistics

| Metric              | Value                         |
| ------------------- | ----------------------------- |
| **Total Agents**    | 25                            |
| **Total Skills**    | 44                            |
| **Total Workflows** | 15                            |
| **Total Scripts**   | 2 (master) + 18 (skill-level) |
| **Coverage**        | ~90% web/mobile development   |

---

## 🔗 Quick Reference

| Need     | Agent                 | Skills                                |
| -------- | --------------------- | ------------------------------------- |
| Web App  | `frontend-specialist` | nextjs-react-expert, frontend-design  |
| API      | `backend-specialist`  | api-patterns, nodejs-best-practices   |
| AI/LLM   | `ai-engineer`         | llm-patterns, testing-patterns        |
| Data Pipelines | `data-engineer`   | data-pipeline-patterns, database-design |
| Mobile   | `mobile-developer`    | mobile-design                         |
| Database | `database-architect`  | database-design                       |
| Security | `security-auditor`    | vulnerability-scanner                 |
| Growth   | `marketing-strategist` | growth-marketing, social-media-patterns |
| Testing  | `test-engineer`       | testing-patterns, webapp-testing      |
| Debug    | `debugger`            | systematic-debugging                  |
| Plan     | `project-planner`     | brainstorming, plan-writing           |
| Reliability | `sre-engineer`     | deployment-procedures, systematic-debugging |
| DB Performance | `database-optimizer` | database-design                    |
| LLM Cost | `autonomous-optimization-architect` | llm-patterns, python-patterns |
| Compliance | `compliance-auditor` | vulnerability-scanner               |
