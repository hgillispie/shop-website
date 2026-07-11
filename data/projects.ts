export type Project = {
  slug: string;
  title: string;
  engine: string;
  request: string;
  breakdown: string[];
  imageVariant: "vintage" | "touring" | "bobber";
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
  },
  {
    slug: "big-twin-custom-bobber",
    title: "Big Twin — Custom Bobber Build",
    engine: "Big Twin",
    request:
      "Ground-up custom build request: strip a stock Softail down to a minimalist bobber with a fabricated subframe.",
    breakdown: [
      "Fabricated a bolt-on rear subframe and relocated the electronics into a hand-built underseat tray.",
      "Rewired the bike on a minimalist harness with a hidden battery box and solid-state relay panel.",
      "Rebuilt the carburetor and tuned the exhaust for the new intake configuration.",
    ],
    imageVariant: "bobber",
  },
];
