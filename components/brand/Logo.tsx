import { siteConfig } from "@/data/site-config";
import { cn } from "@/lib/utils";

export const LOGO_SRC =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F27bc6fa018c0481485885f93442186bf?format=webp&width=400";

export function LogoMark({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      width={132}
      height={200}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-10 w-auto select-none", className)}
    />
  );
}

export function Logo({
  className,
  markClassName,
  priority,
}: {
  className?: string;
  markClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} priority={priority} />
      <span className="display-slant text-xl leading-[0.85] text-bone">
        Swafford
        <span className="block text-flame">Speed</span>
      </span>
      <span className="sr-only">{siteConfig.shopName}</span>
    </span>
  );
}
