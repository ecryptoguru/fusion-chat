# Embed Script

Lightweight Vite-built script that injects a floating chat button on any website and opens the hosted widget (iframe) for Fusion Chat.

## Quick Start (HTML)

```html
<script
  src="https://your-cdn.com/embed.js"
  data-organization-id="org_123"
  data-position="bottom-right"
  defer
></script>
```

- `data-organization-id` (required): Organization identifier used by the widget/backend.
- `data-position` (optional): `bottom-right` (default) or `bottom-left`.

## Public API

Available after the script loads via `window.FusionchatWidget`:

```ts
window.FusionchatWidget.show();
window.FusionchatWidget.hide();
window.FusionchatWidget.destroy();
window.FusionchatWidget.init({ organizationId: "org_456", position: "bottom-left" });
```

## Messaging Contract

The script listens to `postMessage` events from the widget (iframe):
- `{ type: 'close' }` — closes the widget container
- `{ type: 'resize', payload: { height: number } }` — adjusts container height

## Configuration

`apps/embed/config.ts` defines:
- `WIDGET_URL` — defaults to `VITE_WIDGET_URL` or `http://localhost:3001`
- `DEFAULT_ORG_ID` — default organization
- `DEFAULT_POSITION` — `bottom-right`

Example `.env` for dev:

```bash
# apps/embed/.env.local
VITE_WIDGET_URL=http://localhost:3001
```

## Development

```bash
pnpm --filter embed dev  # serves on http://localhost:3002
```

Open `apps/embed/demo.html` or `apps/embed/landing.html` and point the `<script>` to your dev server output.

## Build

```bash
pnpm --filter embed build
```

Outputs a production bundle under `apps/embed/dist/`. Publish to your CDN and reference it in your clients.

## Security Notes

- The embed is public; do not include secrets here.
- The widget should validate the `organizationId` and enforce authorization on server-side endpoints as needed.
