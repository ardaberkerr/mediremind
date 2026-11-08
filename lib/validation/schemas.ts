import { z } from "zod";

export const medicationSchema = z.object({
  name: z.string().min(1, "İlaç adı gerekli"),
  dosage: z.string().min(1, "Doz gerekli"),
  reminderTime: z.string().min(1, "Hatırlatma saati gerekli"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz (+90...)"),
  notes: z.string().optional(),
});

