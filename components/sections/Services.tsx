import { capabilities } from "@/data/services";
import { Reveal } from "@/components/Reveal";

export function Services() {
  return (
    <section
      id="services"
      className="scroll-mt-16 bg-[#b3812f] py-24"
      style={{ marginTop: "-2px" }}
    >
      <div
        className="mx-auto max-w-6xl bg-cover bg-center bg-no-repeat px-6"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F6d9a2d5891244cf292384e4b183aba66')",
          backgroundColor: "#b3812f",
        }}
      >
        <Reveal className="max-w-2xl">
          <p
            className="mb-4 overflow-hidden rounded text-center text-base font-medium uppercase tracking-[0.3em]"
            style={{
              backgroundColor: "rgba(0, 0, 0, 1)",
              borderWidth: "1px",
              borderColor: "rgba(110, 110, 31, 1)",
              borderStyle: "inset",
              color: "#b3812f",
            }}
          >
            Services offered
          </p>
        </Reveal>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability.title} className="bg-background p-8">
              <h3 className="text-lg font-semibold">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {capability.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F9b40fe6b114a414b84925ca6d38bb07f"
            alt="Harley-Davidson restoration work area"
            className="h-[320px] w-full object-cover sm:h-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
