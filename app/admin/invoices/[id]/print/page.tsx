import { notFound } from "next/navigation";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { siteConfig } from "@/data/site-config";
import { formatCents } from "@/lib/store/money";
import { jobPartsTotalCents, jobTotalCents } from "@/lib/invoices/totals";
import { formatDateWritten } from "@/lib/invoices/date";
import { PrintButton } from "@/components/admin/PrintButton";

// Deliberately outside app/admin/(dashboard) — this must NOT inherit the
// admin nav chrome, only the bare root layout, so what prints is just the
// document. Still covered by middleware.ts's "/admin/:path*" matcher, so
// it's auth-gated the same as everything else under /admin.
export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getServiceInvoiceById(id);
  if (!invoice) notFound();

  const taxRate = Number(invoice.taxRatePercent);
  const ccFeeRate = Number(invoice.ccFeeRatePercent);
  const taxBase = [
    invoice.taxAppliesToParts ? "parts" : null,
    invoice.taxAppliesToLabor ? "labor" : null,
  ].filter(Boolean);

  return (
    <div className="min-h-full bg-neutral-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.45in; }
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[8.5in] justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="relative mx-auto max-w-[8.5in] overflow-hidden bg-white p-10 text-black shadow-lg print:max-w-none print:p-0 print:shadow-none">
        {/* Background watermark — behind everything else by DOM order alone
            (position: absolute with no z-index doesn't reorder paint order
            relative to later static siblings), sized to roughly the
            customer/vehicle panel width like the original paper form. */}
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-auto w-[70%] max-w-xl opacity-[0.07] grayscale select-none"
        />

        {/* Letterhead */}
        <header className="flex items-start justify-between gap-6 border-b-4 border-black pb-4">
          <div className="flex items-center gap-4">
            {/* Logo is already neutral-toned at the source; grayscale here
                is a defensive second guarantee, not the only safeguard. */}
            <img src="/logo.svg" alt={siteConfig.shopName} className="h-14 w-auto grayscale" />
            <div className="font-mono text-[11px] leading-relaxed">
              <p className="text-sm font-bold tracking-wide">
                {siteConfig.shopName.toUpperCase()}
              </p>
              <p>{siteConfig.address}</p>
              <p>{siteConfig.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-[0.25em]">SERVICE ORDER</h1>
            <table className="mt-2 ml-auto font-mono text-[11px]">
              <tbody>
                <tr>
                  <td className="pr-3 text-right text-neutral-500">R.O. NUMBER</td>
                  <td className="border-b border-black pl-2 font-semibold">
                    {invoice.invoiceNumber}
                  </td>
                </tr>
                <tr>
                  <td className="pr-3 text-right text-neutral-500">DATE WRITTEN</td>
                  <td className="border-b border-black pl-2">{formatDateWritten(invoice.dateWritten)}</td>
                </tr>
                <tr>
                  <td className="pr-3 text-right text-neutral-500">SERVICE ADVISOR</td>
                  <td className="border-b border-black pl-2">{invoice.serviceAdvisor || " "}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* Customer / Vehicle info */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <InfoPanel title="Customer information">
            <FieldLine label="Name" value={invoice.customerName} />
            <FieldLine label="Address" value={invoice.customerAddress} />
            <FieldLine label="City / State / ZIP" value={invoice.customerCityStateZip} />
            <FieldLine label="Phone" value={invoice.customerPhone} />
            <FieldLine label="Email" value={invoice.customerEmail} />
          </InfoPanel>
          <InfoPanel title="Vehicle information">
            <FieldLine
              label="Year / Make / Model"
              value={[invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
                .filter(Boolean)
                .join(" ")}
            />
            <FieldLine label="Color" value={invoice.vehicleColor} />
            <FieldLine label="VIN" value={invoice.vehicleVin} />
            <FieldLine label="License plate" value={invoice.licensePlate} />
            <FieldLine label="Mileage in" value={invoice.mileageIn} />
          </InfoPanel>
        </div>

        {/* Description of Service */}
        <div className="mt-4 border border-black">
          <div className="bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white">
            DESCRIPTION OF SERVICE
          </div>
          {invoice.jobs.length === 0 && (
            <p className="p-4 text-sm text-neutral-500">No jobs added to this invoice yet.</p>
          )}
          {invoice.jobs.map((job, index) => {
            const partsTotal = jobPartsTotalCents(job);
            const total = jobTotalCents(job);
            return (
              <div key={job.id} className={index > 0 ? "border-t-2 border-black" : ""}>
                <div className="flex items-center justify-between bg-neutral-800 px-3 py-1.5 text-xs font-bold text-white">
                  <span>JOB {index + 1}</span>
                  <span className="font-mono font-normal">
                    TECH INITIALS: {job.techInitials || "______"}
                  </span>
                </div>
                <div className="space-y-3 p-3 text-sm">
                  <LabeledText
                    label="Customer's description of problem"
                    value={job.customerDescription}
                  />
                  <LabeledText label="Technician findings / cause" value={job.technicianFindings} />
                  <LabeledText
                    label="Correction / work performed"
                    value={job.correctionPerformed}
                  />

                  <div className="grid grid-cols-[1fr_11rem] gap-4 border-t border-neutral-300 pt-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        Parts
                      </p>
                      {job.parts.length > 0 ? (
                        <table className="mt-1 w-full font-mono text-xs">
                          <thead>
                            <tr className="border-b border-neutral-300 text-left text-neutral-500">
                              <th className="py-0.5 font-normal">Description</th>
                              <th className="w-10 py-0.5 text-right font-normal">Qty</th>
                              <th className="w-16 py-0.5 text-right font-normal">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {job.parts.map((part) => (
                              <tr key={part.id} className="border-b border-dotted border-neutral-300">
                                <td className="py-1">{part.description}</td>
                                <td className="py-1 text-right">{part.qty}</td>
                                <td className="py-1 text-right tabular-nums">
                                  {formatCents(part.qty * part.unitPriceCents)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-400">No parts on this job.</p>
                      )}
                      {job.parts.length > 0 && (
                        <p className="mt-1 text-right text-xs font-semibold tabular-nums">
                          Parts subtotal: {formatCents(partsTotal)}
                        </p>
                      )}
                    </div>

                    <div className="border border-neutral-400 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        Labor — flat rate
                      </p>
                      <p className="mt-1 text-right font-mono text-sm">
                        {formatCents(job.laborCents)}
                      </p>
                      <p className="mt-2 border-t border-neutral-400 pt-1 text-right text-xs font-bold">
                        JOB TOTAL {formatCents(total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <table className="w-64 font-mono text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-neutral-600">PARTS TOTAL</td>
                <td className="py-1 text-right tabular-nums">
                  {formatCents(invoice.partsTotalCents)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-neutral-600">LABOR TOTAL</td>
                <td className="py-1 text-right tabular-nums">
                  {formatCents(invoice.laborTotalCents)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-neutral-600">
                  SALES TAX{taxRate > 0 ? ` (${taxRate}%${taxBase.length ? ` on ${taxBase.join(" + ")}` : ""})` : ""}
                </td>
                <td className="py-1 text-right tabular-nums">{formatCents(invoice.taxCents)}</td>
              </tr>
              {invoice.ccFeeEnabled && (
                <tr>
                  <td className="py-1 text-neutral-600">CC PROCESSING FEE ({ccFeeRate}%)</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatCents(invoice.ccFeeCents)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-black text-base font-bold">
                <td className="py-1.5">TOTAL DUE</td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatCents(invoice.totalDueCents)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature / pickup */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-[11px]">
          <div className="border-t border-black pt-1 text-neutral-600">
            CUSTOMER SIGNATURE — VEHICLE PICKUP
          </div>
          <div className="border-t border-black pt-1 text-neutral-600">DATE</div>
          <div className="border-t border-black pt-1 text-neutral-600">
            ODOMETER OUT{invoice.odometerOut ? `: ${invoice.odometerOut}` : ""}
          </div>
        </div>

        <p className="mt-8 border-t border-black pt-2 text-center font-mono text-[9px] tracking-wide text-neutral-500 uppercase">
          {siteConfig.shopName} · Motorcycle Repair &amp; Performance · {siteConfig.address} ·
          Customer Copy — Retain For Your Records
        </p>
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-black">
      <div className="bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white">
        {title.toUpperCase()}
      </div>
      <div className="space-y-1.5 p-3">{children}</div>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-neutral-300 pb-1 text-sm">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span className="flex-1 text-right">{value || " "}</span>
    </div>
  );
}

function LabeledText({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="min-h-[1.25em] whitespace-pre-wrap">{value || " "}</p>
    </div>
  );
}
