# @workspace/ui

Shared UI component library used by `apps/web` and `apps/widget`. Built on shadcn/ui, Tailwind CSS, and Radix primitives.

## Exports

- `./globals.css` — Tailwind and theme CSS
- `./components/*` — React components
- `./hooks/*` — Reusable hooks
- `./lib/*` — Utility functions

See `package.json` exports and `src/` for the full inventory.

## Usage (in apps)

Ensure the app `next.config.mjs` has:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
}
export default nextConfig
```

Import components:

```tsx
import { Button } from "@workspace/ui/components/button";
```

Add global CSS in the app root layout:

```ts
import "@workspace/ui/globals.css";
```

## Development

- Tailwind v4 is configured via `postcss.config.mjs` and consumed by apps.
- Keep components small and composable; push complex logic into hooks or utilities.
- Prefer shadcn variants over ad-hoc class strings.

### Linting

```bash
pnpm --filter @workspace/ui lint
```

## Theming

Extend Tailwind theme via `src/styles/globals.css` and app-level configs as needed.

## Publishing

This package is workspace-only and not published externally. Consumers import via the workspace alias `@workspace/ui`.
