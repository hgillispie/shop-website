This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Google tags (GA4 + Google Ads)

Public-site tagging is env-driven (no IDs hardcoded). Set these in Vercel for **Production and Preview**, then **redeploy** — new env vars do not apply to an already-built deployment.

| Variable | Value Hunter should set | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-69HS4B6JS1` (already live) | GA4 via `gtag('config', 'G-…')` |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-18434738260` | Google Ads tag via `gtag('config', 'AW-…')` on the same gtag.js loader |
| `NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL` | label only (`XXXX`) or full `AW-18434738260/XXXX` | On successful booking, fires `gtag('event', 'conversion', { send_to })` **in addition to** the existing GA4 `generate_lead` event |

How to get the Book appointment `send_to` label:

1. Google Ads → Goals → Conversions → **Book appointment**.
2. Open tag setup / the event snippet. It looks like `gtag('event', 'conversion', { 'send_to': 'AW-18434738260/XXXX' })`.
3. Paste `XXXX` (or the full `AW-18434738260/XXXX`) into `NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL`.

Without the label, the AW tag still installs (campaign “missing Google tag” should clear after deploy). The conversion stays unverified until the label is set and a real booking submits.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
