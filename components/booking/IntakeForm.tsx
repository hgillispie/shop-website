"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PhotoUpload } from "@/components/booking/PhotoUpload";
import { SuccessState } from "@/components/booking/SuccessState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";

const fieldClassName =
  "rounded-none border-brand-ink/20 bg-white text-base text-brand-ink placeholder:text-brand-ink/35 focus:border-brand-rust focus:ring-brand-rust/20";
const labelClassName =
  "mb-1.5 text-[11px] font-bold normal-case tracking-[0.1em] text-brand-ink/70";
const errorClassName = "mt-1 text-xs font-medium text-brand-rust";

export function IntakeForm() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      bikeYearMakeModel: "",
      details: "",
      preferredDropoffDate: "",
    },
  });

  async function onSubmit(values: AppointmentFormValues) {
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("phone", values.phone);
      formData.append("email", values.email);
      formData.append("bikeYearMakeModel", values.bikeYearMakeModel);
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
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name" className={labelClassName}>Full name</Label>
        <Input
          id="name"
          {...register("name")}
          autoComplete="name"
          className={fieldClassName}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && <p id="name-error" className={errorClassName}>{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone" className={labelClassName}>Phone number</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            autoComplete="tel"
            inputMode="tel"
            className={fieldClassName}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && <p id="phone-error" className={errorClassName}>{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email" className={labelClassName}>Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            autoComplete="email"
            inputMode="email"
            className={fieldClassName}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <p id="email-error" className={errorClassName}>{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="bikeYearMakeModel" className={labelClassName}>Year, make &amp; model</Label>
        <Input
          id="bikeYearMakeModel"
          placeholder="e.g. 2018 Harley-Davidson Street Glide"
          {...register("bikeYearMakeModel")}
          className={fieldClassName}
          aria-invalid={Boolean(errors.bikeYearMakeModel)}
          aria-describedby={errors.bikeYearMakeModel ? "bike-error" : undefined}
        />
        {errors.bikeYearMakeModel && (
          <p id="bike-error" className={errorClassName}>{errors.bikeYearMakeModel.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="details" className={labelClassName}>What do you want to fix, change, or improve?</Label>
        <Textarea
          id="details"
          placeholder="Tell us what is happening, what you want to change, and how you ride."
          {...register("details")}
          className={`${fieldClassName} min-h-28 resize-y`}
          aria-invalid={Boolean(errors.details)}
          aria-describedby={errors.details ? "details-error" : undefined}
        />
        {errors.details && <p id="details-error" className={errorClassName}>{errors.details.message}</p>}
      </div>

      <Disclosure>
        {({ open }) => (
          <div className="border-y border-brand-ink/15">
            <DisclosureButton className="flex w-full items-center justify-between gap-4 py-3 text-left text-xs font-bold uppercase tracking-[0.11em] text-brand-ink/65 transition-colors hover:text-brand-rust">
              Add a preferred date or photos
              <span className="flex items-center gap-2 text-[10px] font-medium tracking-normal text-brand-ink/40">
                Optional
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="space-y-4 pb-4 transition duration-200 ease-out data-closed:-translate-y-1 data-closed:opacity-0"
            >
              <div>
                <Label htmlFor="preferredDropoffDate" className={labelClassName}>Preferred drop-off date</Label>
                <Input
                  id="preferredDropoffDate"
                  type="date"
                  {...register("preferredDropoffDate")}
                  className={fieldClassName}
                />
                <p className="mt-1 text-[11px] text-brand-ink/45">We will confirm availability before scheduling.</p>
              </div>
              <div>
                <Label className={labelClassName}>Photos</Label>
                <PhotoUpload files={photos} onChange={setPhotos} />
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {submitError && (
        <p role="alert" className="border-l-4 border-brand-rust bg-brand-rust/10 px-4 py-3 text-sm font-medium text-brand-rust">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-none bg-brand-orange text-sm font-bold uppercase tracking-[0.13em] text-brand-ink hover:bg-brand-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-rust"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Sending request" : "Send my appointment request"}
      </Button>
    </form>
  );
}
