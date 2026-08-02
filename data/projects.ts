export type Project = {
  slug: string;
  title: string;
  engine: string;
  request: string;
  breakdown: string[];
  imageVariant: "vintage" | "touring" | "bobber";
  beforeImage?: string;
};

// Placeholder project write-ups. Swap in real client work — request quote,
// technical notes, and before/after photos — once available.
export const projects: Project[] = [
  {
    slug: "panhead-electrical-rebuild",
    title: "1962 Panhead — Full Electrical Rebuild",
    engine: "Panhead",
    request:
      "Owner reported intermittent charging failure and a wiring harness that had been patched repeatedly over sixty years of ownership.",
    breakdown: [
      "Traced charging system fault to a failed generator and degraded cutout relay.",
      "Stripped the original harness and rebuilt it point-to-point with correctly rated cloth-braided wire.",
      "Rebuilt the generator and replaced all terminal connections with soldered, weather-sealed ends.",
    ],
    imageVariant: "vintage",
    beforeImage:
      "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F06ea6170669045b4b7e373d5c9752b89",
  },
  {
    slug: "m8-touring-performance",
    title: "2021 Milwaukee-Eight Touring — Performance Tune",
    engine: "Milwaukee-Eight",
    request:
      "Owner wanted more low-end torque for highway passing without sacrificing reliability or emissions compliance.",
    breakdown: [
      "Installed a high-flow intake and exhaust matched to a custom ECU tune.",
      "Dyno-verified fuel and ignition mapping across the full RPM range.",
      "Serviced clutch and primary drive to handle the added torque cleanly.",
    ],
    imageVariant: "touring",
    beforeImage: "https://placehold.co/800x600/1a1a1a/999999?text=Before+Photo",
  },
  {
    slug: "big-twin-custom-bobber",
    title: "Big Twin — Custom Chopper Build",
    engine: "Big Twin",
    request:
      "Custom build request: strip a stock Shovelhead down to a minimalist bobber with a fabricated subframe.",
    breakdown: [
      "Fabricated a bolt-on rear subframe and relocated the electronics into a hand-built underseat tray.",
      "Rewired the bike on a minimalist harness with a hidden battery box and solid-state relay panel.",
      "Replaced and tuned carburetor & exhaust for the new configuration.",
    ],
    imageVariant: "bobber",
    beforeImage:
      "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Fa5c51da12a4049489fb0f1740e5f1784",
  },
];
