# Contributing Guide

Thanks for contributing to Fusion Chat! This guide explains how to set up your environment, coding standards, and the PR process.

## Local Setup

1) Install Node 20+ and pnpm 10+
2) Install deps at repo root:
```bash
pnpm install
```
3) Create `.env.local` files as needed (see `README.md` and `*.env.example`).
4) Run apps/services:
```bash
# backend (Convex)
pnpm --filter @workspace/backend dev
# web app
pnpm --filter web dev
# widget app
pnpm --filter widget dev
# embed script
pnpm --filter embed dev
```

## Monorepo Tooling

- pnpm workspaces
- Turbo tasks (`pnpm dev`, `pnpm build`, `pnpm lint`)
- TypeScript project refs (shared configs under `packages/typescript-config/`)
- ESLint configs under `packages/eslint-config/`

## Coding Standards

- Next.js App Router (`app/` dir). Prefer Server Components; use `"use client"` only where necessary.
- Layouts via `layout.tsx` and nested layouts for shared UI.
- Styling: Tailwind CSS + shadcn/ui. Import `@workspace/ui/globals.css` at app root layout.
- Component structure:
  - Reusable UI in `packages/ui/src/components/`
  - App-specific UI under each app's `components/`
  - Keep components <20 lines when possible; move logic into hooks/utils.
- Forms & validation: React Hook Form + Zod; validate client and server.
- Data fetching & state:
  - Server Components do server-side data fetching (async/await)
  - Client-side use Jotai/React Query (if added) where appropriate
  - Convex hooks for realtime data on client
- TypeScript:
  - `strict` on; no `any`
  - Type params & return values
  - Prefer `readonly` and `as const` where applicable
  - RO-RO (Receive Object, Return Object) for multi-param functions
- Naming & layout:
  - Files/dirs: kebab-case
  - Components & types: PascalCase
  - Variables/functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Hooks in `hooks/` prefixed `use*`

## Commits & PRs

- Conventional Commits preferred:
  - `feat(web): add conversations list`
  - `fix(backend): correct contactSessions index`
  - `docs(embed): add API for programmatic init`
- Keep PRs focused and under ~300 lines when possible.
- Include screenshots for UI changes.
- Add/adjust tests where applicable.

## Linting & Type Checks

```bash
pnpm lint
pnpm --filter web typecheck
pnpm --filter widget typecheck
```

## Security & Secrets

- Never commit secrets or real tokens. Use `.env.local` for local dev, and environment managers (Vercel, Convex) for prod.
- If a secret leaks in git history, rotate it immediately.

## Discussions

- Use GitHub issues for bugs/feature requests.
- Propose large changes in an issue before opening a PR.
