"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { PhotoUpload } from "@/components/booking/PhotoUpload";
import { SuccessState } from "@/components/booking/SuccessState";
import { useBookingHandoff } from "@/components/booking/BookingHandoff";
import { track } from "@/lib/analytics-client";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";
import { cn } from "@/lib/utils";

// Contact details are asked last on purpose: opening with the easy,
// non-personal question is what gets the form started at all.
const STEPS = [
  {
    label: "The bike",
    heading: "What are you riding?",
    fields: ["bikeYearMakeModel"],
  },
  {
    label: "The job",
    heading: "What needs doing?",
    fields: ["details"],
  },
  {
    label: "Your details",
    heading: "Where do we reach you?",
    fields: ["name", "phone", "email"],
  },
] as const satisfies readonly {
  label: string;
  heading: string;
  fields: readonly (keyof AppointmentFormValues)[];
}[];

const fieldClass =
  "w-full border-ink/15 bg-white text-ink placeholder:text-ink/65 focus:border-flame focus:outline-flame";
const labelClass = "eyebrow mb-2 block text-ink/65";

export function IntakeForm() {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { bike } = useBookingHandoff();
  const startedRef = useRef(false);
  const handedOffRef = useRef("");

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setValue,
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

  const isLastStep = step === STEPS.length - 1;

  // The hero already asked step one, so land the visitor on "the job".
  useEffect(() => {
    if (!bike || handedOffRef.current === bike) return;
    handedOffRef.current = bike;
    startedRef.current = true;
    setValue("bikeYearMakeModel", bike, { shouldValidate: true });
    setStep(1);
  }, [bike, setValue]);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("booking_start", { entry: "form" });
  }

  async function goNext() {
    markStarted();
    const valid = await trigger([...STEPS[step].fields]);
    if (!valid) {
      track("booking_error", { step: STEPS[step].label, kind: "validation" });
      return;
    }
    const next = Math.min(step + 1, STEPS.length - 1);
    track("booking_step", { from: STEPS[step].label, to: STEPS[next].label });
    setStep(next);
  }

  async function onSubmit(values: AppointmentFormValues) {
    setSubmitError(null);
    try {
      track("booking_submit", { photoCount: photos.length });
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

      track("booking_complete");
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      track("booking_error", { kind: "submit", message });
      setSubmitError(message);
    }
  }

  if (submitted) {
    return (
      <SuccessState
        onReset={() => {
          setSubmitted(false);
          setPhotos([]);
          setStep(0);
          reset();
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" || isLastStep) return;
        if (e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        void goNext();
      }}
      noValidate
    >
      <ol className="flex gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.label} className="flex-1">
            <div
              className={cn(
                "h-1 w-full transition-colors",
                i <= step ? "bg-flame" : "bg-ink/12",
              )}
            />
            <span
              className={cn(
                "eyebrow mt-2.5 block text-[0.65rem] transition-colors",
                // Both states stay readable; the flame bar above carries the
                // active/pending distinction instead of text opacity.
                i <= step ? "text-ink" : "text-ink/65",
              )}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <p className="display-caps mt-8 text-3xl text-ink sm:text-4xl">
        {STEPS[step].heading}
      </p>

      <div className="mt-7 space-y-6">
        {step === 0 && (
          <div>
            <label htmlFor="bikeYearMakeModel" className={labelClass}>
              Year, make &amp; model
            </label>
            <input
              id="bikeYearMakeModel"
              autoFocus
              className={cn("input input-lg", fieldClass)}
              placeholder="e.g. 1978 Harley-Davidson Shovelhead"
              {...register("bikeYearMakeModel")}
            />
            {errors.bikeYearMakeModel && (
              <p className="mt-2 text-sm text-error">
                {errors.bikeYearMakeModel.message}
              </p>
            )}
            <p className="mt-3 text-sm text-ink/65">
              Not sure of the exact model? A rough description is fine.
            </p>
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <label htmlFor="details" className={labelClass}>
                The details
              </label>
              <textarea
                id="details"
                rows={5}
                autoFocus
                className={cn("textarea", fieldClass)}
                placeholder="Describe the problem or project goals. The more detail, the better."
                {...register("details")}
              />
              {errors.details && (
                <p className="mt-2 text-sm text-error">{errors.details.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="preferredDropoffDate" className={labelClass}>
                Preferred drop-off date{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="preferredDropoffDate"
                type="date"
                className={cn("input", fieldClass)}
                {...register("preferredDropoffDate")}
              />
            </div>

            <div>
              <span className={labelClass}>
                Photos{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </span>
              <PhotoUpload files={photos} onChange={setPhotos} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  autoFocus
                  autoComplete="name"
                  className={cn("input", fieldClass)}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-error">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={cn("input", fieldClass)}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-error">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={cn("input", fieldClass)}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-error">{errors.email.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {submitError && (
        <p className="mt-6 border-l-3 border-error bg-error/5 px-4 py-3 text-sm text-error">
          {submitError}
        </p>
      )}

      <div className="mt-9 flex items-center gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              track("booking_back", { from: STEPS[step].label });
              setStep((s) => s - 1);
            }}
            className="btn btn-ghost eyebrow gap-2 text-ink/65 hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary eyebrow ml-auto h-14 px-8"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Send request
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="btn btn-primary eyebrow ml-auto h-14 gap-2 px-8"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="mt-5 text-xs text-ink/65">
        Your details go straight to the shop. Submitting a request doesn&apos;t
        book a slot yet — you&apos;ll get a reply to confirm.
      </p>
    </form>
  );
}
