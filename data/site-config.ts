export const siteConfig = {
  shopName: "Swafford Speed",
  tagline: "Independent Harley-Davidson mechanics.",
  logoUrl:
    "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F45f71d7b1358472ebf340a8f36ea205f?format=webp&width=800&height=1200",
  phone: "(843)-666-9451",
  email: "huntergillispie1@proton.me",
  city: "Taylors, SC",
  // Real drop-off address — sent only in the private approval email/SMS,
  // never rendered on a public page (owner doesn't want walk-ins).
  address: "529 E Darby Road, Taylors, SC 29687",
  // Root-relative so these work correctly from any route, not just "/" —
  // a bare "#about" only scrolls when already on the homepage.
  navLinks: [
    { label: "About", href: "/#about" },
    { label: "Services", href: "/#services" },
    { label: "FAQ", href: "/#faq" },
    { label: "Store", href: "/store" },
    { label: "Book", href: "/#book" },
  ],
} as const;
