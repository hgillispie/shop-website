-- Incremental Quote → Approve → Invoice columns.
-- This repo previously used `drizzle-kit push` (no migration history), so
-- 0000 is the first SQL file and is additive against the live schema — not
-- a from-scratch CREATE of every table. The matching snapshot in meta/
-- is the full current schema so later `drizzle-kit generate` diffs stay small.
CREATE TYPE "public"."invoice_document_stage" AS ENUM('quote', 'approved', 'invoice');
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "document_stage" "invoice_document_stage" DEFAULT 'quote' NOT NULL;
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "approve_token_hash" text;
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "approved_at" timestamp;
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD COLUMN "approved_via" text;
--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_approve_token_hash_unique" UNIQUE("approve_token_hash");
--> statement-breakpoint
UPDATE "service_invoices" SET "document_stage" = 'invoice' WHERE "payment_status" IN ('invoice_sent', 'paid');
