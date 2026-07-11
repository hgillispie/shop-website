import { z } from "zod";
import { SERVICE_TYPES } from "@/types/appointment";

export const appointmentFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  bikeYearMakeModel: z
    .string()
    .trim()
    .min(3, "Enter the year, make, and model."),
  serviceTypes: z
    .array(z.enum(SERVICE_TYPES))
    .min(1, "Select at least one service."),
  details: z
    .string()
    .trim()
    .min(10, "Give a few more details about the problem or project.")
    .max(2000, "Keep details under 2000 characters."),
  preferredDropoffDate: z.string().trim().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export const PHOTO_LIMITS = {
  maxFiles: 6,
  maxFileSizeBytes: 8 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
};
