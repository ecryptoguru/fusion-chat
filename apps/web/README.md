# Web App (Admin Dashboard)

Next.js 15 App Router application for managing organizations, conversations, files, plugins, and widget customization. Authenticated with Clerk and using Convex for realtime data.

## Tech Stack

- Next.js 15 (App Router)
- Clerk for authentication
- Convex for data and realtime
- Shared UI from `@workspace/ui`
- Tailwind CSS + shadcn/ui

## Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

Security: Do not commit secrets. Use Vercel/Convex secret managers in production.

## Scripts

```bash
pnpm dev          # Next dev on port 3000
pnpm build        # Next build
pnpm start        # Next start
pnpm lint         # Lint
pnpm typecheck    # TS check
```

## Routing & Middleware

- Edge middleware guards routes and enforces org selection:
  - `apps/web/middleware.ts`
- Redirect `/` → `/conversations` in `apps/web/next.config.mjs`.

## Providers

- Root layout: `apps/web/app/layout.tsx` sets `ClerkProvider`, fonts, and includes `Providers` from `apps/web/components/providers.tsx`.
- Convex client is created in `Providers`, requires `NEXT_PUBLIC_CONVEX_URL`.

## Project Structure

- `app/` — App Router routes with nested layouts
  - `(auth)/` — Sign in/up and org selection
  - `(dashboard)/` — Main dashboard sections: conversations, files, billing, etc.
- `modules/` — Feature modules (`auth`, `customization`, `dashboard`, `files`, `integrations`, `plugins`)
- `components/` — App-specific components and providers
- `hooks/` — App-specific hooks (e.g., `use-mobile.ts`)
- `lib/` — Utilities

## Development Notes

- Use Server Components by default; add `"use client"` as needed.
- UI components from `@workspace/ui` with Tailwind classes and shadcn primitives.
- Validation with Zod + React Hook Form.
- TypeScript strict mode; avoid `any`.

## Troubleshooting

- Missing `NEXT_PUBLIC_CONVEX_URL`: app throws early in `Providers`.
- Clerk redirects: confirm sign-in/up URLs and middleware public routes.
