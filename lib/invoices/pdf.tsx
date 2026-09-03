import fs from "node:fs";
import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { siteConfig } from "@/data/site-config";
import { formatDateWritten } from "@/lib/invoices/date";
import { jobPartsTotalCents, jobTotalCents } from "@/lib/invoices/totals";
import type { ServiceInvoiceWithJobs } from "@/lib/db/queries";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Same PNG as the branded HTML email (lib/email.ts) — react-pdf's <Image>
// takes a raw Buffer directly, so unlike the email case there's no need to
// base64-encode it first; that requirement was specific to HTML email
// clients, not PDF rendering.
let cachedLogo: Buffer | null = null;
function getLogoBuffer(): Buffer | null {
  if (cachedLogo) return cachedLogo;
  try {
    cachedLogo = fs.readFileSync(path.join(process.cwd(), "public", "logo-email.png"));
    return cachedLogo;
  } catch (error) {
    console.error("[invoices/pdf] failed to read logo:", error);
    return null;
  }
}

// Helvetica/Helvetica-Bold are among the 14 standard PDF base fonts —
// react-pdf ships these pre-registered, so this needs no Font.register call
// (and no font file to fetch/bundle in a serverless function).
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2.5,
    borderBottomColor: "#000000",
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 46, height: 46, objectFit: "contain" },
  shopName: { fontSize: 10, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  shopLine: { fontSize: 8, color: "#555555", marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  metaTable: { marginTop: 6 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2, gap: 8 },
  metaLabel: { fontSize: 8, color: "#777777" },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  panelsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  panel: { flex: 1, borderWidth: 1, borderColor: "#000000" },
  panelTitle: {
    backgroundColor: "#000000",
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    padding: 5,
  },
  panelBody: { padding: 8 },
  fieldLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingBottom: 2,
    marginTop: 4,
  },
  fieldLabel: { fontSize: 7, color: "#777777", letterSpacing: 0.3 },
  fieldValue: { fontSize: 8.5 },

  jobsBlock: { marginTop: 12, borderWidth: 1, borderColor: "#000000" },
  jobsHeader: {
    backgroundColor: "#000000",
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    padding: 5,
  },
  noJobs: { padding: 8, fontSize: 8, color: "#777777" },
  jobBlockDivider: { borderTopWidth: 1.5, borderTopColor: "#000000" },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#3a3a3a",
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    padding: 5,
  },
  jobBody: { padding: 8 },
  labelText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#777777",
    letterSpacing: 0.3,
  },
  bodyText: { fontSize: 8.5, marginTop: 2, lineHeight: 1.3 },
  jobSection: { marginTop: 6 },
  jobColumns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 6,
  },
  partsCol: { flex: 1 },
  partRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
    paddingVertical: 1.5,
    gap: 8,
  },
  partDesc: { fontSize: 8, flex: 1 },
  partAmount: { fontSize: 8 },
  noParts: { fontSize: 7.5, color: "#999999", marginTop: 2 },
  partsSubtotal: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 2,
  },
  laborCol: { width: 120, borderWidth: 0.5, borderColor: "#999999", padding: 6 },
  laborAmount: { fontSize: 9, textAlign: "right", marginTop: 2 },
  jobTotal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#999999",
    paddingTop: 3,
  },

  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsTable: { width: 200 },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { fontSize: 8.5, color: "#444444" },
  totalsValue: { fontSize: 8.5 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#000000",
    marginTop: 4,
    paddingTop: 5,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 7,
    color: "#777777",
    letterSpacing: 0.4,
  },
});

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.fieldLine}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

// Mirrors app/admin/invoices/[id]/print/page.tsx's layout (same panels,
// same JOB N blocks, same totals shape) so the emailed PDF and the
// in-shop printed copy read as the same document — just built with
// react-pdf's View/Text/StyleSheet instead of div/Tailwind, since this
// renders server-side to a Buffer rather than to the DOM.
function InvoiceDocument({ invoice }: { invoice: ServiceInvoiceWithJobs }) {
  const logo = getLogoBuffer();
  const taxRate = Number(invoice.taxRatePercent);
  const ccFeeRate = Number(invoice.ccFeeRatePercent);
  const vehicle = [invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
    .filter(Boolean)
    .join(" ");

  return (
    <Document title={`Invoice ${invoice.invoiceNumber} — ${siteConfig.shopName}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logo ? <Image src={logo} style={styles.logo} /> : null}
            <View>
              <Text style={styles.shopName}>{siteConfig.shopName.toUpperCase()}</Text>
              <Text style={styles.shopLine}>{siteConfig.address}</Text>
              <Text style={styles.shopLine}>{siteConfig.phone}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>INVOICE</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>R.O. NUMBER</Text>
                <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>DATE WRITTEN</Text>
                <Text style={styles.metaValue}>{formatDateWritten(invoice.dateWritten)}</Text>
              </View>
              {invoice.serviceAdvisor ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>SERVICE ADVISOR</Text>
                  <Text style={styles.metaValue}>{invoice.serviceAdvisor}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.panelsRow}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>CUSTOMER INFORMATION</Text>
            <View style={styles.panelBody}>
              <FieldLine label="Name" value={invoice.customerName} />
              <FieldLine label="Address" value={invoice.customerAddress} />
              <FieldLine label="City / State / ZIP" value={invoice.customerCityStateZip} />
              <FieldLine label="Phone" value={invoice.customerPhone} />
              <FieldLine label="Email" value={invoice.customerEmail} />
            </View>
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>VEHICLE INFORMATION</Text>
            <View style={styles.panelBody}>
              <FieldLine label="Year / Make / Model" value={vehicle} />
              <FieldLine label="Color" value={invoice.vehicleColor} />
              <FieldLine label="VIN" value={invoice.vehicleVin} />
              <FieldLine label="License plate" value={invoice.licensePlate} />
              <FieldLine label="Mileage in" value={invoice.mileageIn} />
            </View>
          </View>
        </View>

        <View style={styles.jobsBlock}>
          <Text style={styles.jobsHeader}>DESCRIPTION OF SERVICE</Text>
          {invoice.jobs.length === 0 ? (
            <Text style={styles.noJobs}>No jobs added to this invoice.</Text>
          ) : (
            invoice.jobs.map((job, index) => {
              const partsTotal = jobPartsTotalCents(job);
              const total = jobTotalCents(job);
              return (
                <View key={job.id} style={index > 0 ? styles.jobBlockDivider : undefined}>
                  <View style={styles.jobHeader}>
                    <Text>JOB {index + 1}</Text>
                    <Text>TECH: {job.techInitials || "—"}</Text>
                  </View>
                  <View style={styles.jobBody}>
                    <View>
                      <Text style={styles.labelText}>CUSTOMER&rsquo;S DESCRIPTION OF PROBLEM</Text>
                      <Text style={styles.bodyText}>{job.customerDescription || "—"}</Text>
                    </View>
                    {job.technicianFindings ? (
                      <View style={styles.jobSection}>
                        <Text style={styles.labelText}>TECHNICIAN FINDINGS / CAUSE</Text>
                        <Text style={styles.bodyText}>{job.technicianFindings}</Text>
                      </View>
                    ) : null}
                    {job.correctionPerformed ? (
                      <View style={styles.jobSection}>
                        <Text style={styles.labelText}>CORRECTION / WORK PERFORMED</Text>
                        <Text style={styles.bodyText}>{job.correctionPerformed}</Text>
                      </View>
                    ) : null}

                    <View style={styles.jobColumns}>
                      <View style={styles.partsCol}>
                        <Text style={styles.labelText}>PARTS</Text>
                        {job.parts.length > 0 ? (
                          job.parts.map((part) => (
                            <View key={part.id} style={styles.partRow}>
                              <Text style={styles.partDesc}>
                                {part.qty} &times; {part.description || "Part"}
                              </Text>
                              <Text style={styles.partAmount}>
                                {money(part.qty * part.unitPriceCents)}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noParts}>No parts on this job.</Text>
                        )}
                        {job.parts.length > 0 ? (
                          <Text style={styles.partsSubtotal}>
                            Parts subtotal: {money(partsTotal)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.laborCol}>
                        <Text style={styles.labelText}>LABOR — FLAT RATE</Text>
                        <Text style={styles.laborAmount}>{money(job.laborCents)}</Text>
                        <Text style={styles.jobTotal}>JOB TOTAL {money(total)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Parts total</Text>
              <Text style={styles.totalsValue}>{money(invoice.partsTotalCents)}</Text>
            </View>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Labor total</Text>
              <Text style={styles.totalsValue}>{money(invoice.laborTotalCents)}</Text>
            </View>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>
                Sales tax{taxRate > 0 ? ` (${taxRate}%)` : ""}
              </Text>
              <Text style={styles.totalsValue}>{money(invoice.taxCents)}</Text>
            </View>
            {invoice.ccFeeEnabled ? (
              <View style={styles.totalsLine}>
                <Text style={styles.totalsLabel}>Card processing fee ({ccFeeRate}%)</Text>
                <Text style={styles.totalsValue}>{money(invoice.ccFeeCents)}</Text>
              </View>
            ) : null}
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Total due</Text>
              <Text style={styles.grandTotalValue}>{money(invoice.totalDueCents)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          {siteConfig.shopName.toUpperCase()} — MOTORCYCLE REPAIR &amp; PERFORMANCE —{" "}
          {siteConfig.address}
        </Text>
      </Page>
    </Document>
  );
}

// The one exported entry point — everything above is an implementation
// detail. Server Actions call this, get a Buffer back, and hand it
// straight to Resend as an email attachment (see sendInvoiceCopyEmail in
// lib/email.ts) — no temp file, no stream plumbing.
export async function renderInvoicePdf(invoice: ServiceInvoiceWithJobs): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
