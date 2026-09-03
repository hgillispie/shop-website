---
name: update-project-docs
description: Keep docs/PROJECT_CONTEXT.md, docs/INTEGRATIONS.md, and docs/OPERATIONS.md current. Use after a significant change — a new third-party integration, a schema change, a deploy-process change, a real gotcha discovered the hard way, or a status flip (e.g. proposed -> built, preview -> production). Not needed after routine changes (copy tweaks, styling, small bug fixes). Also use when explicitly asked to sync/update the project docs.
---

# Updating the project context docs

Three files, each kept deliberately light — a fast orientation + pointers to
ask/verify, not an exhaustive reference or a build log:

- `docs/PROJECT_CONTEXT.md` — what this is, stack, branches, routes, data
  model, patterns worth knowing, "ask rather than assume" flags.
- `docs/INTEGRATIONS.md` — per-service quick-facts (Shopify/Resend/Printify/
  Twilio/Neon/Blob) for correctly calling each one.
- `docs/OPERATIONS.md` — deploy steps, env var scoping rule, DNS, known open
  items.

## When updating

1. Read the current version of whichever file(s) are affected before editing.
2. Change only what's actually stale or missing because of the real change
   just made — don't rewrite unrelated sections, and don't pad things out.
3. Keep the existing register: short bullets, present tense, no narrative
   "we tried X then Y then Z" history (that belongs in commit messages, not
   here) unless the *lesson* itself is the useful part (e.g. "vercel env pull
   is unreliable" is worth keeping; the play-by-play of discovering it isn't).
4. If a fact moved from "proposed" to "built," or "preview" to "production,"
   update the status inline rather than leaving both an old and new claim.
5. Total file sizes should stay in the same ballpark as they are now (each
   under ~50 lines) — if an addition would blow past that, it's a sign to
   compress/replace something rather than just append.
6. If you're not sure whether a change is "significant enough" to warrant a
   docs update, ask the user rather than silently skipping it or silently
   updating on every trivial change.
