import { encode } from "uqr";

export function ContactQr({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const { data, size } = encode(url, { ecc: "H", border: 2 });
  const modules = data
    .flatMap((row, y) =>
      row.flatMap((on, x) => (on ? `M${x} ${y}h1v1h-1z` : [])),
    )
    .join("");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code linking to ${url}`}
    >
      <title>QR code for {url}</title>
      <rect width={size} height={size} fill="#ffffff" />
      <path fill="#201E1E" d={modules} />
    </svg>
  );
}
