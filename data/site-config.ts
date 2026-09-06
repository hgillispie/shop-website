export const siteConfig = {
  shopName: "Swafford Speed",
  tagline: "Harley customs, choppers, and V-twin repair — Upstate SC.",
  phone: "864-666-9451",
  phoneHref: "tel:+18646669451",
  email: "swaffordspeed@gmail.com",
  city: "Taylors, SC",
  // Only claims already signed off by the owner and live on the site — no
  // review counts, ratings, or job numbers.
  heroPoints: [
    "Chopper, club-style, and custom builds",
    "Harley performance, suspension, and brakes",
    "V-twin service and repair",
    "Wiring, sound, and lighting",
  ],
  credentials: [
    { value: "20 yrs", label: "Dealership-trained — now an independent shop" },
    { value: "Pan → M8", label: "Panhead through Milwaukee-Eight" },
    { value: "In-house", label: "Tuning, fabrication, and build work" },
    { value: "1 at a time", label: "Your bike isn't sharing the lift" },
  ],
  // Real drop-off address — sent only in the private approval email/SMS,
  // never rendered on a public page (owner doesn't want walk-ins).
  address: "529 E Darby Road, Taylors, SC 29687",
  // Handles, not titles — Shopify handles survive a rename and these two have
  // already drifted: `evo-pocket-tee` now shows as "Swafford Speed V-Twin
  // Pocket Tee", and `flash-pocket-tee` shows as "Bagger Pocket Tee".
  featured: {
    hero: "evo-pocket-tee",
    banner: "flash-pocket-tee",
  },
  // Root-relative so these work correctly from any route, not just "/".
  // The long-form content moved to /about, so those anchors point there now.
  navLinks: [
    { label: "Store", href: "/store" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/about#faq" },
    { label: "Book", href: "/#book" },
  ],
} as const;
