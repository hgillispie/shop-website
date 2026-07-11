"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/booking/PhotoUpload";
import { SuccessState } from "@/components/booking/SuccessState";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";
import { SERVICE_TYPES } from "@/types/appointment";
import { cn } from "@/lib/utils";

export function IntakeForm() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      bikeYearMakeModel: "",
      serviceTypes: [],
      details: "",
      preferredDropoffDate: "",
    },
  });

  const selectedServices = watch("serviceTypes") ?? [];

  function toggleService(service: (typeof SERVICE_TYPES)[number]) {
    const current = getValues("serviceTypes") ?? [];
    const next = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setValue("serviceTypes", next, { shouldValidate: true });
  }

  async function onSubmit(values: AppointmentFormValues) {
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("phone", values.phone);
      formData.append("email", values.email);
      formData.append("bikeYearMakeModel", values.bikeYearMakeModel);
      formData.append("serviceTypes", JSON.stringify(values.serviceTypes));
      formData.append("details", values.details);
      formData.append("preferredDropoffDate", values.preferredDropoffDate ?? "");
      photos.forEach((photo) => formData.append("photos", photo));

      const response = await fetch("/api/appointments", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (submitted) {
    return (
      <SuccessState
        onReset={() => {
          setSubmitted(false);
          setPhotos([]);
          reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} autoComplete="name" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" {...register("phone")} autoComplete="tel" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} autoComplete="email" />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="bikeYearMakeModel">Year, Make &amp; Model</Label>
        <Input
          id="bikeYearMakeModel"
          placeholder="e.g. 1978 Harley-Davidson Shovelhead"
          {...register("bikeYearMakeModel")}
        />
        {errors.bikeYearMakeModel && (
          <p className="mt-1 text-xs text-red-600">{errors.bikeYearMakeModel.message}</p>
        )}
      </div>

      <div>
        <Label>Service Type</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.map((service) => {
            const active = selectedServices.includes(service);
            return (
              <button
                key={service}
                type="button"
                aria-pressed={active}
                onClick={() => toggleService(service)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground hover:border-accent hover:text-accent",
                )}
              >
                {service}
              </button>
            );
          })}
        </div>
        {errors.serviceTypes && (
          <p className="mt-1 text-xs text-red-600">{errors.serviceTypes.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="preferredDropoffDate">Preferred Drop-off Date (optional)</Label>
        <Input
          id="preferredDropoffDate"
          type="date"
          {...register("preferredDropoffDate")}
        />
      </div>

      <div>
        <Label htmlFor="details">The Details</Label>
        <Textarea
          id="details"
          placeholder="Describe the problem or project goals — the more detail, the better."
          {...register("details")}
        />
        {errors.details && (
          <p className="mt-1 text-xs text-red-600">{errors.details.message}</p>
        )}
      </div>

      <div>
        <Label>Photos</Label>
        <PhotoUpload files={photos} onChange={setPhotos} />
      </div>

      {submitError && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit Appointment Request
      </Button>
    </form>
  );
}
