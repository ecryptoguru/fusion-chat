# Security Policy

Last updated: 2025-09-13

This document summarizes Fusionchat’s security model, secret handling practices, rotation procedures, and incident response. For a deep technical overview, see `docs/YellowPaper.md` (Security and Threat Model section).

## Scope

- Admin Dashboard: `apps/web/`
- Widget App: `apps/widget/`
- Embed Script: `apps/embed/`
- Backend (Convex): `packages/backend/`
- Shared UI: `packages/ui/`

## Authentication & Authorization

- Admin Users (Dashboard)
  - Clerk is used for identity and auth in `apps/web/`.
  - Edge middleware `apps/web/middleware.ts` protects routes and enforces organization selection.
  - Convex private functions derive `orgId` from `ctx.auth.getUserIdentity()` to scope data by organization.

- Visitors (Widget)
  - Visitors are unauthenticated but tied to an expiring `contactSessions` record (see `packages/backend/convex/schema.ts`).
  - All public endpoints validate that `contactSessionId` exists and is not expired (e.g., `convex/public/conversations.ts`, `convex/public/messages.ts`).

## Secret Handling

- Storage
  - Backend secrets are stored in environment variables (Convex / Vercel project settings) and AWS Secrets Manager.
  - `private.secrets.upsert` schedules `system.secrets.upsert` to persist secrets in AWS Secrets Manager.
  - Client-facing endpoints never return server-only secrets (e.g., `public/secrets.getVapiSecrets` returns only `publicApiKey`).

- Source Control
  - Do not commit `.env` files or real credentials. Sample configuration belongs in `*.env.example` only.
  - If credentials are accidentally committed, rotate immediately and purge history if necessary.

- Access Control
  - Limit admin access to hosting dashboards (Vercel, Convex, AWS) by role.
  - Use MFA and SSO for all administrative accounts.

## Key Rotation Procedures

1. Identify a leaked/suspect key (Clerk, Convex, OpenAI, VAPI, AWS).
2. Rotate the key in the provider dashboard.
3. Update the new value in the appropriate secret manager:
   - Convex environment variables (for backend functions)
   - Vercel environment variables (for web & widget)
   - AWS Secrets Manager entry (for service integrations)
4. Redeploy affected services.
5. Invalidate caches/sessions if required by provider.
6. Audit logs and verify no further misuse.

## Data Protection

- Organization Isolation
  - All org-bound tables include `organizationId` and carry appropriate indexes; private functions enforce `orgId` from Clerk identity.

- PII Minimization
  - `contactSessions.metadata` should only include necessary user agent and browser details.
  - Avoid storing sensitive PII; if needed, document retention and masking.

- Transport Security
  - All public assets and APIs should be served over HTTPS.

## Application Security Practices

- Input Validation
  - Zod is used for form validation in the UI; Convex functions validate arguments with `convex/values` validators.

- Cross-Window Messaging
  - `apps/embed/embed.ts` validates message origins before acting; ensure `EMBED_CONFIG.WIDGET_URL` is correct in production.

- Rate Limiting
  - Consider adding rate limits to sensitive Convex actions (e.g., message creation, file uploads) via counters or queues.

- Logging
  - Avoid logging secrets and PII. Prefer structured logs and log correlation IDs if using external APM.

- Dependencies
  - Keep dependencies updated via regular checks. Address high-severity advisories promptly.

## Incident Response

1. Triage
   - Identify incident scope (service, data, keys). Preserve evidence and logs.
2. Contain
   - Disable compromised credentials, revoke sessions/tokens if applicable.
3. Eradicate
   - Patch vulnerabilities, rotate keys, increase monitoring.
4. Recover
   - Redeploy services. Validate functionality and security posture.
5. Postmortem
   - Document root cause, timeline, and remediation steps. Track action items to completion.

## Reporting a Vulnerability

- Please open a private security report (do not file a public issue). If a private channel is unavailable, obfuscate sensitive details and request a secure contact.
- Provide:
  - Affected components and versions
  - Reproduction steps or proof of concept
  - Expected vs actual behavior
  - Impact assessment and suggested mitigations

## Hardening Checklist (Quick Reference)

- Clerk
  - Enforce MFA for admin accounts
  - Configure allowed callback URLs and origins
- Vercel / Convex / AWS
  - Restrict access by role; enable MFA
  - Store secrets in environment managers (not in git)
- Apps
  - Verify `NEXT_PUBLIC_CONVEX_URL` points to the correct environment
  - Validate postMessage origins
  - Avoid inline secrets and PII in logs
- Backend
  - Validate all arguments in Convex functions
  - Scope data by `orgId` and contact session
  - Add rate limiting for actions

## References

- `docs/YellowPaper.md` — Technical yellow paper (Security model and threat analysis)
- `packages/backend/README.md` — API Reference & Usage Map
- `apps/web/middleware.ts` — Route protection and org selection
- `apps/embed/embed.ts` — Widget loader and origin checks
