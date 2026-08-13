"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ServiceInvoiceJobRow,
  ServiceInvoicePartsLineRow,
  ServiceInvoiceRow,
} from "@/lib/db/schema";
import { computeInvoiceTotals, jobTotalCents } from "@/lib/invoices/totals";
import type { InvoicePrefill } from "@/lib/invoices/prefill";
import { formatCents } from "@/lib/store/money";
import { createInvoice, deleteInvoice, updateInvoice } from "@/app/admin/(dashboard)/invoices/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type ExistingInvoice = ServiceInvoiceRow & {
  jobs: (ServiceInvoiceJobRow & { parts: ServiceInvoicePartsLineRow[] })[];
};

type PartFormState = {
  id?: string;
  description: string;
  qty: string;
  price: string;
};

type JobFormState = {
  id?: string;
  techInitials: string;
  customerDescription: string;
  technicianFindings: string;
  correctionPerformed: string;
  labor: string;
  parts: PartFormState[];
};

function toCents(dollarString: string): number {
  const n = Math.round(parseFloat(dollarString || "0") * 100);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function toQty(qtyString: string): number {
  const n = parseInt(qtyString || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function centsToInput(cents: number): string {
  return cents ? (cents / 100).toFixed(2) : "";
}

function emptyPart(): PartFormState {
  return { description: "", qty: "1", price: "" };
}

function emptyJob(): JobFormState {
  return {
    techInitials: "",
    customerDescription: "",
    technicianFindings: "",
    correctionPerformed: "",
    labor: "",
    parts: [],
  };
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// What the "Load demo" button fills in — two realistic, distinct
// Harley-Davidson repairs (not the same ones used in this feature's own
// manual browser testing), simulating an owner filling the form out by
// hand. Fabricated customer, clearly not a real one.
const DEMO_DATA = {
  serviceAdvisor: "JM",
  customerName: "Ray Odom",
  customerAddress: "212 Millrace Dr",
  customerCityStateZip: "Simpsonville, SC 29680",
  customerPhone: "(864) 555-0198",
  customerEmail: "ray.odom@example.com",
  vehicleYear: "2017",
  vehicleMake: "Harley-Davidson",
  vehicleModel: "Softail",
  vehicleColor: "Black",
  vehicleVin: "1HD1BPL10FB654321",
  licensePlate: "SC XYZ789",
  mileageIn: "38,450",
  taxRatePercent: "6",
  taxAppliesToParts: true,
  taxAppliesToLabor: false,
  ccFeeEnabled: true,
  ccFeeRatePercent: "3",
  jobs: [
    {
      techInitials: "JM",
      customerDescription: "Rear brakes making a grinding, metal-on-metal sound",
      technicianFindings:
        "Rear pads worn past the wear indicator; rotor lightly scored from metal-to-metal contact.",
      correctionPerformed:
        "Replaced rear brake pads and rotor, bled brakes, torqued to spec, road-tested.",
      labor: "145.00",
      parts: [
        { description: "Rear brake pad set", qty: "1", price: "64.99" },
        { description: "Rear brake rotor", qty: "1", price: "89.50" },
      ],
    },
    {
      techInitials: "JM",
      customerDescription: "Hard to start, cranks slow, sometimes won't crank at all",
      technicianFindings:
        "Battery load-tested well below spec; starter draw higher than normal under load.",
      correctionPerformed:
        "Replaced battery, cleaned and re-torqued battery cables and starter relay connections, verified cold-start performance.",
      labor: "85.00",
      parts: [{ description: "AGM battery", qty: "1", price: "189.00" }],
    },
  ],
} satisfies {
  serviceAdvisor: string;
  customerName: string;
  customerAddress: string;
  customerCityStateZip: string;
  customerPhone: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleVin: string;
  licensePlate: string;
  mileageIn: string;
  taxRatePercent: string;
  taxAppliesToParts: boolean;
  taxAppliesToLabor: boolean;
  ccFeeEnabled: boolean;
  ccFeeRatePercent: string;
  jobs: JobFormState[];
};

export function InvoiceForm({
  invoice,
  prefill,
}: {
  invoice?: ExistingInvoice;
  prefill?: InvoicePrefill;
}) {
  const router = useRouter();
  const isEditing = !!invoice;

  const [serviceAdvisor, setServiceAdvisor] = useState(invoice?.serviceAdvisor ?? "");
  const [dateWritten, setDateWritten] = useState(
    invoice ? invoice.dateWritten.toISOString().slice(0, 10) : todayInputValue(),
  );
  const [customerName, setCustomerName] = useState(
    invoice?.customerName ?? prefill?.customerName ?? "",
  );
  const [customerAddress, setCustomerAddress] = useState(
    invoice?.customerAddress ?? prefill?.customerAddress ?? "",
  );
  const [customerCityStateZip, setCustomerCityStateZip] = useState(
    invoice?.customerCityStateZip ?? "",
  );
  const [customerPhone, setCustomerPhone] = useState(
    invoice?.customerPhone ?? prefill?.customerPhone ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState(
    invoice?.customerEmail ?? prefill?.customerEmail ?? "",
  );
  const [vehicleYear, setVehicleYear] = useState(
    invoice?.vehicleYear ?? prefill?.vehicleYear ?? "",
  );
  const [vehicleMake, setVehicleMake] = useState(
    invoice?.vehicleMake ?? prefill?.vehicleMake ?? "",
  );
  const [vehicleModel, setVehicleModel] = useState(
    invoice?.vehicleModel ?? prefill?.vehicleModel ?? "",
  );
  const [vehicleColor, setVehicleColor] = useState(invoice?.vehicleColor ?? "");
  const [vehicleVin, setVehicleVin] = useState(invoice?.vehicleVin ?? "");
  const [licensePlate, setLicensePlate] = useState(invoice?.licensePlate ?? "");
  const [mileageIn, setMileageIn] = useState(invoice?.mileageIn ?? "");
  const [odometerOut, setOdometerOut] = useState(invoice?.odometerOut ?? "");

  const [taxRatePercent, setTaxRatePercent] = useState(invoice?.taxRatePercent ?? "0");
  const [taxAppliesToParts, setTaxAppliesToParts] = useState(invoice?.taxAppliesToParts ?? true);
  const [taxAppliesToLabor, setTaxAppliesToLabor] = useState(invoice?.taxAppliesToLabor ?? false);
  const [ccFeeEnabled, setCcFeeEnabled] = useState(invoice?.ccFeeEnabled ?? false);
  const [ccFeeRatePercent, setCcFeeRatePercent] = useState(invoice?.ccFeeRatePercent ?? "0");

  const [jobs, setJobs] = useState<JobFormState[]>(() => {
    if (invoice && invoice.jobs.length > 0) {
      return invoice.jobs.map((job) => ({
        id: job.id,
        techInitials: job.techInitials ?? "",
        customerDescription: job.customerDescription ?? "",
        technicianFindings: job.technicianFindings ?? "",
        correctionPerformed: job.correctionPerformed ?? "",
        labor: centsToInput(job.laborCents),
        parts: job.parts.map((part) => ({
          id: part.id,
          description: part.description,
          qty: String(part.qty),
          price: centsToInput(part.unitPriceCents),
        })),
      }));
    }
    if (prefill?.jobDescription) {
      return [{ ...emptyJob(), customerDescription: prefill.jobDescription }];
    }
    return [emptyJob()];
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateJob(index: number, patch: Partial<JobFormState>) {
    setJobs((prev) => prev.map((job, i) => (i === index ? { ...job, ...patch } : job)));
  }
  function addJob() {
    setJobs((prev) => [...prev, emptyJob()]);
  }
  function removeJob(index: number) {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  }
  function updatePart(jobIndex: number, partIndex: number, patch: Partial<PartFormState>) {
    setJobs((prev) =>
      prev.map((job, i) =>
        i === jobIndex
          ? {
              ...job,
              parts: job.parts.map((part, pi) => (pi === partIndex ? { ...part, ...patch } : part)),
            }
          : job,
      ),
    );
  }
  function addPart(jobIndex: number) {
    setJobs((prev) =>
      prev.map((job, i) => (i === jobIndex ? { ...job, parts: [...job.parts, emptyPart()] } : job)),
    );
  }
  function removePart(jobIndex: number, partIndex: number) {
    setJobs((prev) =>
      prev.map((job, i) =>
        i === jobIndex ? { ...job, parts: job.parts.filter((_, pi) => pi !== partIndex) } : job,
      ),
    );
  }

  const computedJobs = jobs.map((job) => ({
    laborCents: toCents(job.labor),
    parts: job.parts.map((part) => ({ qty: toQty(part.qty), unitPriceCents: toCents(part.price) })),
  }));
  const totals = computeInvoiceTotals({
    jobs: computedJobs,
    taxRatePercent: parseFloat(taxRatePercent) || 0,
    taxAppliesToParts,
    taxAppliesToLabor,
    ccFeeEnabled,
    ccFeeRatePercent: parseFloat(ccFeeRatePercent) || 0,
  });

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      serviceAdvisor,
      dateWritten,
      customerName,
      customerAddress,
      customerCityStateZip,
      customerPhone,
      customerEmail,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleVin,
      licensePlate,
      mileageIn,
      odometerOut,
      taxRatePercent: parseFloat(taxRatePercent) || 0,
      taxAppliesToParts,
      taxAppliesToLabor,
      ccFeeEnabled,
      ccFeeRatePercent: parseFloat(ccFeeRatePercent) || 0,
      jobs: jobs.map((job) => ({
        id: job.id,
        techInitials: job.techInitials,
        customerDescription: job.customerDescription,
        technicianFindings: job.technicianFindings,
        correctionPerformed: job.correctionPerformed,
        laborCents: toCents(job.labor),
        // Drop fully-blank rows the owner added but never filled in, rather
        // than saving empty parts lines.
        parts: job.parts
          .filter((part) => part.description.trim() || toCents(part.price) > 0)
          .map((part) => ({
            id: part.id,
            description: part.description,
            qty: toQty(part.qty),
            unitPriceCents: toCents(part.price),
          })),
      })),
    };

    try {
      if (isEditing) {
        await updateInvoice(invoice.id, payload);
        router.refresh();
      } else {
        const { id } = await createInvoice(payload);
        router.push(`/admin/invoices/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    // A saved invoice is a real business record, not disposable cart state —
    // a native confirm is a cheap guard against a stray click, without
    // needing a modal primitive this codebase doesn't have yet.
    if (!window.confirm(`Delete invoice #${invoice.invoiceNumber}? This can't be undone.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteInvoice(invoice.id);
      router.push("/admin/invoices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this invoice.");
      setDeleting(false);
    }
  }

  function loadDemoData() {
    setServiceAdvisor(DEMO_DATA.serviceAdvisor);
    setCustomerName(DEMO_DATA.customerName);
    setCustomerAddress(DEMO_DATA.customerAddress);
    setCustomerCityStateZip(DEMO_DATA.customerCityStateZip);
    setCustomerPhone(DEMO_DATA.customerPhone);
    setCustomerEmail(DEMO_DATA.customerEmail);
    setVehicleYear(DEMO_DATA.vehicleYear);
    setVehicleMake(DEMO_DATA.vehicleMake);
    setVehicleModel(DEMO_DATA.vehicleModel);
    setVehicleColor(DEMO_DATA.vehicleColor);
    setVehicleVin(DEMO_DATA.vehicleVin);
    setLicensePlate(DEMO_DATA.licensePlate);
    setMileageIn(DEMO_DATA.mileageIn);
    setTaxRatePercent(DEMO_DATA.taxRatePercent);
    setTaxAppliesToParts(DEMO_DATA.taxAppliesToParts);
    setTaxAppliesToLabor(DEMO_DATA.taxAppliesToLabor);
    setCcFeeEnabled(DEMO_DATA.ccFeeEnabled);
    setCcFeeRatePercent(DEMO_DATA.ccFeeRatePercent);
    setJobs(DEMO_DATA.jobs.map((job) => ({ ...job, parts: job.parts.map((part) => ({ ...part })) })));
  }

  // Only offered on a genuinely blank new invoice — not while editing a
  // real saved one, and not when arriving from a Board job's "Create
  // Invoice" link (that already has real data filled in).
  const showDemoButton = !isEditing && !prefill;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? `Invoice #${invoice.invoiceNumber}` : "New Invoice"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isEditing
              ? `Created ${invoice.createdAt.toLocaleDateString()}`
              : "Fill in what you know now — jobs and parts can be added as work progresses."}
          </p>
        </div>
        {showDemoButton && (
          <Button type="button" variant="outline" onClick={loadDemoData}>
            Load demo
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-3">
            <ButtonLink href={`/admin/invoices/${invoice.id}/print`} variant="outline" target="_blank">
              Print
            </ButtonLink>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </div>

      <section className="rounded-lg border border-border p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="service-advisor">Service advisor</Label>
            <Input
              id="service-advisor"
              value={serviceAdvisor}
              onChange={(e) => setServiceAdvisor(e.target.value)}
              placeholder="Initials or name"
            />
          </div>
          <div>
            <Label htmlFor="date-written">Date written</Label>
            <Input
              id="date-written"
              type="date"
              value={dateWritten}
              onChange={(e) => setDateWritten(e.target.value)}
            />
          </div>
          {isEditing && (
            <div>
              <Label>R.O. number</Label>
              <p className="flex h-12 items-center text-sm text-muted">
                #{invoice.invoiceNumber} (assigned automatically)
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Customer information
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customer-city-state-zip">City / State / ZIP</Label>
              <Input
                id="customer-city-state-zip"
                value={customerCityStateZip}
                onChange={(e) => setCustomerCityStateZip(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Vehicle information
          </h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="vehicle-year">Year</Label>
                <Input
                  id="vehicle-year"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicle-make">Make</Label>
                <Input
                  id="vehicle-make"
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  placeholder="Harley-Davidson"
                />
              </div>
              <div>
                <Label htmlFor="vehicle-model">Model</Label>
                <Input
                  id="vehicle-model"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vehicle-color">Color</Label>
              <Input
                id="vehicle-color"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vehicle-vin">VIN</Label>
              <Input
                id="vehicle-vin"
                value={vehicleVin}
                onChange={(e) => setVehicleVin(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="license-plate">License plate</Label>
                <Input
                  id="license-plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mileage-in">Mileage in</Label>
                <Input
                  id="mileage-in"
                  value={mileageIn}
                  onChange={(e) => setMileageIn(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="odometer-out">Odometer out</Label>
                <Input
                  id="odometer-out"
                  value={odometerOut}
                  onChange={(e) => setOdometerOut(e.target.value)}
                  placeholder="Filled at pickup"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Description of service
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addJob}>
            + Add job
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {jobs.map((job, jobIndex) => {
            const jobTotal = jobTotalCents(computedJobs[jobIndex]);
            return (
              <div key={jobIndex} className="rounded-lg border border-border">
                <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
                  <span className="text-sm font-semibold">Job {jobIndex + 1}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`tech-initials-${jobIndex}`} className="!mb-0">
                        Tech initials
                      </Label>
                      <Input
                        id={`tech-initials-${jobIndex}`}
                        value={job.techInitials}
                        onChange={(e) => updateJob(jobIndex, { techInitials: e.target.value })}
                        className="h-9 w-20"
                      />
                    </div>
                    {jobs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeJob(jobIndex)}
                        className="text-xs text-muted hover:text-red-600"
                      >
                        Remove job
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <Label htmlFor={`customer-description-${jobIndex}`}>
                      Customer&apos;s description of problem
                    </Label>
                    <Textarea
                      id={`customer-description-${jobIndex}`}
                      className="min-h-16"
                      value={job.customerDescription}
                      onChange={(e) => updateJob(jobIndex, { customerDescription: e.target.value })}
                      placeholder="e.g. Bike shuts down when hot"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`technician-findings-${jobIndex}`}>
                      Technician findings / cause
                    </Label>
                    <Textarea
                      id={`technician-findings-${jobIndex}`}
                      className="min-h-16"
                      value={job.technicianFindings}
                      onChange={(e) => updateJob(jobIndex, { technicianFindings: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`correction-${jobIndex}`}>Correction / work performed</Label>
                    <Textarea
                      id={`correction-${jobIndex}`}
                      className="min-h-16"
                      value={job.correctionPerformed}
                      onChange={(e) => updateJob(jobIndex, { correctionPerformed: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="!mb-0">Parts</Label>
                        <button
                          type="button"
                          onClick={() => addPart(jobIndex)}
                          className="text-xs text-accent hover:underline"
                        >
                          + Add part
                        </button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {job.parts.map((part, partIndex) => (
                          <div key={partIndex} className="flex items-center gap-2">
                            <Input
                              value={part.description}
                              onChange={(e) =>
                                updatePart(jobIndex, partIndex, { description: e.target.value })
                              }
                              placeholder="Description"
                              className="h-9 flex-1"
                            />
                            <Input
                              type="number"
                              min="1"
                              value={part.qty}
                              onChange={(e) => updatePart(jobIndex, partIndex, { qty: e.target.value })}
                              className="h-9 w-16"
                            />
                            <div className="relative w-24">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={part.price}
                                onChange={(e) =>
                                  updatePart(jobIndex, partIndex, { price: e.target.value })
                                }
                                placeholder="0.00"
                                className="h-9 pl-6"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePart(jobIndex, partIndex)}
                              className="text-xs text-muted hover:text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {job.parts.length === 0 && (
                          <p className="text-xs text-muted">No parts on this job.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`labor-${jobIndex}`}>Labor — flat rate</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                          $
                        </span>
                        <Input
                          id={`labor-${jobIndex}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={job.labor}
                          onChange={(e) => updateJob(jobIndex, { labor: e.target.value })}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                      <p className="mt-2 text-right text-sm font-medium tabular-nums">
                        Job total: {formatCents(jobTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Tax & fees</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="tax-rate">Sales tax rate</Label>
            <div className="relative">
              <Input
                id="tax-rate"
                type="number"
                step="0.001"
                min="0"
                max="100"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                %
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={taxAppliesToParts}
                  onChange={(e) => setTaxAppliesToParts(e.target.checked)}
                />
                Apply to parts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={taxAppliesToLabor}
                  onChange={(e) => setTaxAppliesToLabor(e.target.checked)}
                />
                Apply to labor
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">
              Set whatever your accountant or the SC DOR tells you applies — this isn&apos;t tax
              advice, just a rate and a base you control per invoice.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={ccFeeEnabled} onChange={(e) => setCcFeeEnabled(e.target.checked)} />
              Add a credit card processing fee
            </label>
            <div className="relative mt-3">
              <Input
                type="number"
                step="0.001"
                min="0"
                max="100"
                value={ccFeeRatePercent}
                onChange={(e) => setCcFeeRatePercent(e.target.value)}
                disabled={!ccFeeEnabled}
                className="pr-8 disabled:opacity-50"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                %
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Charged on the full amount due, including tax — the actual amount that would run
              through the card. Leave unchecked for cash/check jobs.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Parts total</span>
            <span className="tabular-nums">{formatCents(totals.partsTotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Labor total</span>
            <span className="tabular-nums">{formatCents(totals.laborTotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Sales tax</span>
            <span className="tabular-nums">{formatCents(totals.taxCents)}</span>
          </div>
          {ccFeeEnabled && (
            <div className="flex justify-between">
              <span className="text-muted">CC processing fee</span>
              <span className="tabular-nums">{formatCents(totals.ccFeeCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total due</span>
            <span className="tabular-nums">{formatCents(totals.totalDueCents)}</span>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || deleting || !customerName.trim()}
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create invoice"}
        </Button>
        <ButtonLink href="/admin/invoices" variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </div>
  );
}
