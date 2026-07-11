export const SERVICE_TYPES = [
  "Routine Maintenance",
  "Full Custom Build",
  "Engine Rebuild",
  "Electrical Troubleshooting",
  "Performance Tuning",
  "Wreck Repair",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
