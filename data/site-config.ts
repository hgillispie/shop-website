export const siteConfig = {
  shopName: "Swafford Speed",
  builderName: "James Gillispie",
  tagline: "One mechanic, twenty years, no service adviser in between.",
  phone: "(828) 748-7178",
  email: "huntergillispie1@proton.me",
  city: "Taylors, SC",
  // Real drop-off address — sent only in the private approval email/SMS,
  // never rendered on a public page (owner doesn't want walk-ins).
  address: "529 E Darby Road, Taylors, SC 29687",
  navLinks: [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Projects", href: "#projects" },
    { label: "FAQ", href: "#faq" },
    { label: "Book", href: "#book" },
  ],
} as const;
