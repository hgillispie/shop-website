export const siteConfig = {
  shopName: "Swafford Speed",
  tagline: "Harley-Davidson performance, service, and custom work.",
  phone: "(843)-666-9451",
  phoneHref: "tel:+18436669451",
  email: "swaffordspeed@gmail.com",
  city: "Taylors, SC",
  // Only claims already signed off by the owner and live on the site — no
  // review counts, ratings, or job numbers.
  heroPoints: [
    "Engine, suspension, and brake upgrades",
    "Performance exhaust and EFI tuning",
    "Custom builds",
    "Vintage through Milwaukee-Eight",
  ],
  credentials: [
    { value: "20 yrs", label: "Running H-D service departments" },
    { value: "Dealership", label: "Trained technicians" },
    { value: "Pan → M8", label: "Panhead through Milwaukee-Eight" },
    { value: "1 at a time", label: "One bike in the shop, start to finish" },
  ],
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
