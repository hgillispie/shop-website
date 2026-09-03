"use client";

import { useRef, useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { useBookingHandoff } from "@/components/booking/BookingHandoff";
import { track } from "@/lib/analytics-client";

export function HeroStartForm() {
  const { sendToBooking } = useBookingHandoff();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const started = useRef(false);

  function onFirstInput() {
    if (started.current) return;
    started.current = true;
    track("booking_start", { entry: "hero" });
  }

  return (
    <div className="border-t-4 border-flame bg-bone p-6 text-ink sm:p-8">
      <p className="eyebrow text-flame-deep">Start here</p>
      <h2 className="display-caps mt-3 text-4xl">What are you riding?</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">
        One question to start. You&apos;ll finish the rest on the next screen —
        about a minute total.
      </p>

      <form
        className="mt-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const bike = value.trim();
          if (bike.length < 3) {
            setError(true);
            return;
          }
          setError(false);
          track("hero_start_submit");
          sendToBooking(bike);
        }}
      >
        <label htmlFor="heroBike" className="eyebrow mb-2 block text-ink/65">
          Year, make &amp; model
        </label>
        <input
          id="heroBike"
          name="heroBike"
          className="input input-lg w-full border-ink/15 bg-white text-ink placeholder:text-ink/65 focus:border-flame focus:outline-flame"
          placeholder="e.g. 2019 Road Glide"
          value={value}
          onFocus={onFirstInput}
          onChange={(e) => {
            onFirstInput();
            setValue(e.target.value);
            if (error) setError(false);
          }}
        />
        {error && (
          <p className="mt-2 text-sm text-error">
            Enter the year, make, and model.
          </p>
        )}

        <button type="submit" className="btn btn-primary eyebrow mt-4 h-14 w-full gap-2">
          Start my request
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-1 border-t border-ink/10 pt-5 text-sm">
        <span className="text-ink/65">Rather just talk it through?</span>
        <a
          href={siteConfig.phoneHref}
          onClick={() => track("call_click", { location: "hero" })}
          className="flex items-center gap-2 font-semibold text-ink hover:text-flame-deep"
        >
          <Phone className="h-4 w-4 text-flame-deep" aria-hidden="true" />
          {siteConfig.phone}
        </a>
      </div>
    </div>
  );
}
