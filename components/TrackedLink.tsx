"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { track, type EventName } from "@/lib/analytics-client";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  event: EventName;
  meta?: Record<string, unknown>;
  children: ReactNode;
};

export function TrackedLink({ href, event, meta, children, ...rest }: Props) {
  const onClick = () => track(event, meta);

  // tel:/mailto: aren't routable, so they must stay plain anchors.
  if (/^(tel:|mailto:|https?:)/.test(href)) {
    return (
      <a href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
