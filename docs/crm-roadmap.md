# CRM & Board Roadmap

**Status: proposed, not yet approved or built.** This document captures research and a phased plan discussed on 2026-08-14. Nothing below is implemented — check with the owner and re-read the current `lib/db/schema.ts` / admin code before assuming any of it is still accurate or still wanted.

## Context

The shop currently runs a hand-rolled admin: a `customers` table, an appointment-`requests` inbox, a Kanban `jobs` board, and support `tickets` (see the root `AGENTS.md`/`CLAUDE.md` for the general project setup). It works, but two concerns prompted this doc:

1. **Clutter at scale.** The Board and CRM are simple lists today. As job volume grows, there's no built-in mechanism to keep the day-to-day view focused on what's actually active versus everything that's ever happened.
2. **Manual customer creation is a real friction point.** Asking a one-person shop to stop and create a formal Customer record every time a job comes in isn't realistic — it needs to happen automatically, with the human only pulled in when there's genuine ambiguity.

A third, related want: the owner gets a lot of customer texts on his personal/work phone, outside the formal booking flow, and wants a low-friction way to turn one of those into a ticket/appointment from his phone — no dedicated mobile app.

## Research: buy vs. build

**Verdict: extend the existing system. Do not migrate to a paid shop-management platform.** Not a close call at this shop's size.

| Tool | Price (1–2 person shop) | Customer/vehicle matching |
|---|---|---|
| ShopMonkey | $215–239/mo (3 seats incl.) | Adding a customer to an order checks name/email/phone and prompts "may already exist" — human picks or dismisses. VIN decode built in. |
| Tekmetric | $199–439/mo, unlimited users | Global search across records; VIN decode via PartsTech integration. Search-driven, not a proactive match prompt. |
| AutoLeap | $179–409/mo, unlimited users | Search-first customer lookup on a new repair order; picking a match auto-syncs saved vehicle + contact info. |
| Mitchell 1 Manager SE | ~$500/mo bundle (unpublished per-seat) | Manual "Find Customer" search by phone/name/VIN — oldest, most human-driven pattern of the group. |
| Shop-Ware | $279–999/mo | Full CRM module gated to the top ($999/mo) tier. |
| RO Writer | $199/mo flat (Essentials) | Native VIN lookup + vehicle history. |
| Torque360 | $90–200/mo | Cheapest credible full-featured floor; CRM bundled from the Starter tier. |
| ARI / AutoFluent | Unpublished | Explicitly marketed at single-user shops. |

Reasoning:
- **Cost mismatch.** $2,000–6,000+/year for capabilities (multi-bay tech scheduling, parts-vendor ordering integrations, tech-to-writer digital-vehicle-inspection handoffs) that a true one-person, one-bay shop has no use for — there's no second tech to hand a DVI to, no second bay to schedule around.
- **Sunk-cost mismatch.** Migrating means abandoning a working, already-debugged custom booking flow, admin auth, Kanban board, and invoice generator to land on, at best, the same matching pattern described below — which is fully reproducible in-house.
- **The "clutter at scale" worry is a filtering problem, not a platform problem** for a true solo operator. The paid tools solve clutter caused by multi-tech scheduling contention; a one-person shop's volume is mechanically bounded by one person's hours. The real risk is *visual* clutter, addressed in Phase 1 below.
- **Revisit if:** a second mechanic or bay creates real scheduling contention, or there's a need for tech-facing DVI workflows or live parts-catalog ordering at volume. None of that is true today.

## The customer/vehicle auto-matching mechanism

This is a named, formalized pattern (Salesforce and HubSpot both document versions of it), and **half of it already exists in this codebase**: `lib/crm.ts`'s `findOrCreateCustomer()` (called from `/api/appointments/route.ts` on every real submission) already does exact-match lookup on normalized phone or email and silently links-or-creates.

The gap isn't the matching logic — it's that the decision is currently invisible, and there's no fallback for the ambiguous case. The consistent shape across every source checked:

1. **Normalize phone on write** (strip to digits, or E.164) — the single most common real-world failure point for otherwise-correct exact-match logic is inconsistent phone formatting.
2. **Treat normalized phone as the primary match key.**
3. On a new submission, query by exact normalized-phone match:
   - **Zero matches** → create a new customer (or hold as an unlinked lead, matching how `appointmentRequests.customerId` is already nullable).
   - **Exactly one match** → run a fuzzy/normalized name comparison as a *confirmation signal*, not a second gate:
     - High similarity → auto-link, with a **visible, reversible** "matched to existing customer X" indicator — never silent.
     - Low similarity (same phone, notably different name — shared shop phone, family member, reused number) → this is the real ambiguity case. Surface both records side-by-side for a one-click human decision ("alert, don't block" — never refuse the save).
   - **Multiple matches** (rare — a ported/reused number) → same human-confirm UI with more candidates.
4. **Never auto-merge two already-existing customer records.** Auto-linking a *new submission* to one existing record and merging two records that both already exist are different operations with different automation bars — every source treats the latter as strictly human-triggered.

## Proposed plan

### Phase 1 — Board stays focused on current + upcoming
Keep Backlog / In Progress / Waiting-on-Customer fully visible always. Collapse the Complete column to a rolling recent window (e.g. last 14 days) by default, with a link through to full history instead of Complete growing forever. Low-risk, cosmetic-only change to the existing Kanban board.

### Phase 2 — Make matching visible, add the confirmation signal
- Surface "Matched to existing customer: [name]" vs. "New customer created" wherever a request or job is shown (request detail, job detail, Board card).
- Add the fuzzy-name comparison described above; route low-confidence matches (phone matches, name doesn't) into a small review queue instead of the current fully-silent behavior.
- **Optional, larger step (flag separately — touches more of the schema):** a proper `vehicles` table (linked to `customers`; year/make/model/VIN/color) so a bike's history follows it across visits and invoices instead of being re-typed as free text (`bikeYearMakeModel`) every time.

### Phase 3 — Mobile quick-capture for the owner
- **Phase A (cheap, same-day, no new integrations):** a mobile-optimized "quick add" page under the existing admin login — fast enough to use one-handed straight from a text notification, creates a customer/ticket/job directly.
- **Phase B (bigger lift, genuinely novel — no real product precedent found for this exact idea):** upload or forward a screenshot of a text thread; a vision-capable model drafts a ticket (customer name/phone/problem summary, where visible in the image). The owner reviews and confirms before anything is actually created — **never auto-saved without review**, since extraction will sometimes be wrong. Needs a place to store the image, mirroring the existing appointment-photo-upload pattern (`lib/storage.ts` / Vercel Blob) — not yet wired up for this use.
  - Real, shipped precedent exists for *adjacent* ideas — missed-call auto-text scoped to existing customers (Housecall Pro), webchat that continues as a real SMS thread (Podium/Birdeye), a lead object explicitly decoupled from the full customer record until confirmed (ServiceTitan), phone-matched inbound-SMS-to-CRM forwarding (OpenPhone/AutoForwardText), email-to-ticket forwarding (Zendesk/Freshdesk) — but nothing that parses a forwarded screenshot specifically. The underlying tech (vision-model OCR + structured extraction) is proven elsewhere (e.g. Expensify SmartScan does the same trick for receipts); the combination for conversations is not.

## Open questions (not yet decided)

- Exact rolling window for Phase 1's Complete column (14 days was a first suggestion, not a firm number).
- Whether Phase 2's `vehicles` table is worth doing now or deferred until it's clearly needed.
- Whether Phase 3B is worth the build cost given it's unproven elsewhere, versus shipping Phase 3A alone and reassessing.
- Where the fuzzy-name review queue should live in the admin UI (a new page, or folded into the existing Requests inbox).

## Sources

- ShopMonkey: [pricing](https://www.shopmonkey.io/pricing), [duplicate-match behavior](http://help.shopmonkey.io/en/articles/2766623-how-do-i-add-customers-to-orders)
- Tekmetric: [pricing](https://www.tekmetric.com/pricing), [FAQs](https://support.tekmetric.com/hc/en-us/articles/34977202334615-Tekmetric-FAQs)
- AutoLeap: [pricing](https://autoleap.com/pricing/), [customer module](https://autoleap.com/blog/track-customers-through-customer-module/)
- Mitchell 1 Manager SE: [Find Customer](https://buymitchell1.net/managerhelp/Findcustomer.htm), [Capterra pricing](https://www.capterra.com/p/145351/Manager-SE/)
- Shop-Ware: [packages/pricing](https://shop-ware.com/packages/)
- RO Writer: [pricing](https://info.rowriter.com/pricing/)
- Torque360: [pricing](https://www.torque360.co/pricing/)
- ARI/AutoFluent: [features](https://ari.app/features/)
- Housecall Pro: [missed-call text-back](https://help.housecallpro.com/en/articles/6750234-voice-settings-overview)
- Podium: [webchat](https://www.podium.com/product/website-contact-forms)
- Birdeye: [webchat](https://support.birdeye.com/webchat-installation/1205415-what-is-webchat-and-how-can-it-help-my-business)
- ServiceTitan: [capture a lead from a booking](https://help.servicetitan.com/how-to/capture-a-lead-from-a-booking)
- OpenPhone: [shared calling](https://www.openphone.com/product/calling/shared-calling)
- AutoForwardText: [SMS/WhatsApp-to-CRM forwarding](https://www.autoforwardtext.com/blog/how-to-automatically-forward-sms-and-whatsapp-messages-to-your-crm/)
- Zendesk: [email forwarding to tickets](https://support.zendesk.com/hc/en-us/articles/4408886828698-Forwarding-incoming-email-from-your-existing-email-address-to-Zendesk-Support)
- Freshdesk: [email-to-ticket](https://support.freshdesk.com/support/solutions/articles/37541-converting-your-support-email-into-freshdesk-tickets)
- Expensify: [SmartScan](https://use.expensify.com/blog/how-to-upload-receipt)
- HubSpot: [deduplication](https://knowledge.hubspot.com/crm-setup/deduplication-of-contacts-companies-deals-tickets)
- Salesforce: [fuzzy-match deduplication](https://www.salesforceben.com/what-are-fuzzy-matches-in-salesforce-deduplication/), [duplicate rules](https://www.salesforceben.com/salesforce-duplicate-rules/)
