export const ENGINE_TYPES = [
  "Panhead",
  "Shovelhead",
  "Evolution",
  "Twin Cam",
  "Milwaukee-Eight",
  "Metric V-Twin",
  "Other",
] as const;

export const SERVICE_TYPES = [
  "Routine Maintenance",
  "Full Custom Build",
  "Engine Rebuild",
  "Electrical Troubleshooting",
  "Performance Tuning",
  "Wreck Repair",
] as const;

export type EngineType = (typeof ENGINE_TYPES)[number];
export type ServiceType = (typeof SERVICE_TYPES)[number];
