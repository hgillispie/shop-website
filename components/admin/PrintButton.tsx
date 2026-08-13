"use client";

import { Button } from "@/components/ui/button";

// Deliberately not auto-triggered on load — the owner should see the
// rendered invoice before the print dialog takes over. Hidden on the
// printed output itself via the print: variant.
export function PrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="print:hidden">
      Print
    </Button>
  );
}
