import { Badge } from "@/components/ui/badge";
import type { AdminDocumentStage } from "@/lib/invoices/document-stage";

const STAGE_BADGE: Record<
  AdminDocumentStage,
  { label: string; variant: "muted" | "outline" | "accent" }
> = {
  quote: { label: "Quote", variant: "muted" },
  approved: { label: "Approved", variant: "outline" },
  invoice: { label: "Invoice", variant: "outline" },
  paid: { label: "Paid", variant: "accent" },
};

export function DocumentStageBadge({ stage }: { stage: AdminDocumentStage }) {
  const cfg = STAGE_BADGE[stage];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
