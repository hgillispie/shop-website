# Operations — Swafford Speed

Deploy mechanics + known gotchas. Read before deploying or changing infrastructure. Companions: [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md), [`INTEGRATIONS.md`](./INTEGRATIONS.md) (third-party service quick-facts).

## Deploying
1. `git push origin main` (or preview branch) — Vercel's GitHub integration *usually* auto-deploys, but **has failed to fire before with no clear cause**. After every push: `vercel ls --scope hgillispies-projects` and confirm a new deployment actually started. If not: `vercel deploy --prod --scope hgillispies-projects --yes` (prod) or without `--prod` (preview).
2. A raw `vercel deploy` does **not** auto-attach the stable branch alias — after any manual deploy, `vercel alias set <new-deployment-url> <stable-alias>`.
3. **Verify by curling actual page content, not just HTTP status.** A 200 with an empty-state fallback looks identical to a 200 with real data from outside — this is exactly how a missing-env-var bug shipped to production once.

## Environment variables — the big gotcha
**Vercel scopes env vars separately per environment** (Production vs. Preview-per-branch) — they do not share. The entire Shopify env var set was once added only to a preview branch's scope; the first production deploy silently shipped with an empty store. When adding anything env-related that production needs: add it to **both** scopes, then redeploy (env var changes don't retroactively apply to an already-built deployment).

`vercel env pull` and `vercel env ls` are **not trustworthy** for confirming a value actually works — both have returned empty/misleading results for values later confirmed correct by testing the live deployed route directly. Verify by exercising the real code path, not the CLI's own reflection of its config.

Full var list: `.env.example` (names only, grouped by service — no values, safe to read).

**Preview env vars can be pinned to a single git branch.** The whole Preview-scope set (Shopify/DB/Resend/admin) was pinned to `gitBranch=feature/shopify-migration`, so previews of *any other branch* booted with no env at all — `/store` fell back to its empty-state and DB writes silently no-op'd (looks identical to "no products"). Fix: clear each var's Git Branch so Preview vars apply to all preview branches (dashboard → Settings → Environment Variables, or API `PATCH` each preview env entry's `gitBranch` → `null`), then redeploy — env changes never apply to an already-built deployment.

## DNS
Registrar is GoDaddy. Vercel's actual required records (confirmed via `vercel domains inspect`, not the generic docs pattern): `A @ → 76.76.21.21`, `A www → 76.76.21.21`. GoDaddy's own "auto-connect to Shopify" feature will silently overwrite these if ever triggered again, and disconnecting from Shopify does **not** revert it — must fix the A-records by hand.

## Known open items
- Twilio credentials and the admin password hash are unrotated, per the owner's own explicit deferral (not an oversight — don't rotate without being asked).
- `middleware.ts` uses a convention Next 16 marks deprecated in favor of `proxy` — not yet migrated, low urgency.
- Old Shopify webhook subscriptions still point at a stale preview URL alongside the current production one (harmless redundancy, not cleaned up).
- `docs/crm-roadmap.md` is a researched, proposed plan — confirm with the owner before assuming any phase of it is approved or built.
- Cloud Agent secrets must be **Personal**-scoped to reach the agent VM (an Environment-scoped secret won't inject on a run with no saved environment). The `VERCEL_TOKEN` in use is a team/project token — it works against the REST API (`?teamId=`) but the `vercel` CLI rejects it (`whoami` → "User not found"); use the REST API for env/deploy management, or a personal access token if you need the CLI.
