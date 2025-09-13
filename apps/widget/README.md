# Widget App

Hosted chat widget rendered inside an iframe, intended to be embedded on external websites via the `apps/embed` script.

## Purpose

- Presents the chat UI to end-users inside an iframe.
- Communicates with the parent page via `postMessage` for window controls (resize, close).
- Receives `organizationId` via query string from the embed script.

## Tech Stack

- Next.js 15 (App Router)
- Shared UI from `@workspace/ui`
- Tailwind CSS + shadcn/ui

## Environment

Typically no secrets are required here. The widget is public-facing and should fetch public config via query string or public endpoints.

If the widget needs Convex or other services, prefer public URLs and do not store secrets in this app.

## Run Locally

```bash
pnpm --filter widget dev  # runs on port 3001 by default
```

## Iframe Integration

- The `apps/embed` script renders an iframe pointing to this app and appends `organizationId` as a query parameter.
- The widget may send messages to its parent:

```ts
window.parent.postMessage({ type: 'close' }, '*');
window.parent.postMessage({ type: 'resize', payload: { height: 560 } }, '*');
```

The parent script (embed) listens to these events to toggle visibility or resize the container.

## File Structure

- `app/layout.tsx` — Root layout; sets fonts and providers.
- `app/page.tsx` — Entry page / widget UI.
- `components/providers.tsx` — App provider setup (client-side only logic).

## Production

- Host the widget under a stable domain (e.g., `https://widget.fusionchat.example`), then set `VITE_WIDGET_URL` in `apps/embed` to this URL during build.
