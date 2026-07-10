type Variant = "vintage" | "touring" | "bobber";
type Tone = "before" | "after";

const variantPaths: Record<Variant, { frame: string; tank: string }> = {
  vintage: {
    frame:
      "M60 150 L110 100 L150 100 L175 70 L230 70 L250 100 L290 100 L330 150",
    tank: "M175 95 Q205 78 235 95 L232 108 L178 108 Z",
  },
  touring: {
    frame:
      "M55 150 L100 95 L160 95 L185 65 L255 65 L275 95 L300 100 L335 150",
    tank: "M180 90 Q215 70 250 90 L246 106 L184 106 Z",
  },
  bobber: {
    frame: "M65 150 L105 105 L145 105 L190 80 L245 80 L265 105 L325 150",
    tank: "M188 78 Q212 66 236 78 L233 96 L191 96 Z",
  },
};

export function BikeIllustration({
  variant,
  tone,
  className,
}: {
  variant: Variant;
  tone: Tone;
  className?: string;
}) {
  const paths = variantPaths[variant];
  const isAfter = tone === "after";

  return (
    <svg
      viewBox="0 0 390 220"
      className={className}
      role="img"
      aria-label={`Placeholder illustration — ${tone} — ${variant} style motorcycle`}
    >
      <rect width="390" height="220" fill={isAfter ? "var(--surface-dark)" : "#e5e4e0"} />
      <g opacity={isAfter ? 0.5 : 0.35}>
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1={i * 48}
            y1="0"
            x2={i * 48}
            y2="220"
            stroke={isAfter ? "#ffffff" : "#171714"}
            strokeOpacity="0.06"
          />
        ))}
      </g>

      <circle
        cx="90"
        cy="160"
        r="42"
        fill="none"
        stroke={isAfter ? "var(--accent)" : "#9a9a94"}
        strokeWidth={isAfter ? 3 : 2}
        strokeDasharray={isAfter ? undefined : "4 5"}
      />
      <circle
        cx="300"
        cy="160"
        r="42"
        fill="none"
        stroke={isAfter ? "var(--accent)" : "#9a9a94"}
        strokeWidth={isAfter ? 3 : 2}
        strokeDasharray={isAfter ? undefined : "4 5"}
      />

      <path
        d={paths.frame}
        fill="none"
        stroke={isAfter ? "#f4f4f2" : "#6b6b66"}
        strokeWidth={isAfter ? 4 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={paths.tank}
        fill={isAfter ? "var(--accent)" : "none"}
        stroke={isAfter ? "var(--accent)" : "#9a9a94"}
        strokeWidth="2"
      />

      <text
        x="20"
        y="30"
        fontSize="11"
        letterSpacing="0.15em"
        fill={isAfter ? "#a1a19b" : "#6b6b66"}
        style={{ textTransform: "uppercase" }}
      >
        {tone === "before" ? "Before — placeholder" : "After — placeholder"}
      </text>
    </svg>
  );
}
