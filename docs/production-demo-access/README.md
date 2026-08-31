# Production demo access — admin only

> **Status:** Planned — not implemented yet. Keep this in mind before go-live.

## Idea

For production, remove the public demo login so regular visitors cannot use test accounts. Admin accounts (Frances now; other admins later) keep full demo access — sign in as any demo member (Starter, Pro, Elite, mentor, etc.) to test the full experience before and after launch.

## Planned behavior

| Who | Production access |
| --- | --- |
| Public / regular members | No demo quick-login on `/login`; cannot sign in with `@demo.com` |
| Admin accounts | Full `/admin` access + admin-only demo hub to impersonate demo personas |
| Demo accounts (`@demo.com`) | Impersonation targets only — no direct public login |

## Account split

- **Real admin account** (e.g. Frances’s email) — daily CMS, content, user management; strong password or Google sign-in.
- **Demo member accounts** — kept for tier/track/mentor testing; reachable only via admin impersonation.
- **`admin@demo.com`** — local/staging convenience only; disable or hide in production.

## Implementation checklist (when ready)

- [ ] Hide demo UI on public `/login` in production
- [ ] Block `@demo.com` credential login in production (except admin impersonation API)
- [ ] Gate `/demo` behind `role === ADMIN`
- [ ] Add Admin → Demo Accounts panel (one-click “View as…”)
- [ ] Create Frances’s real admin account in production (manual, not shared demo password)

## Related code

- Demo account definitions: `src/data/demo-accounts.ts`
- Public demo login UI: `src/app/(auth)/login/login-form.tsx`
- Demo hub page: `src/app/demo/page.tsx`
- Admin tier preview: `/dashboard?previewTrack=&previewTier=` (admin-only)
