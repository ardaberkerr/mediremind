/* components/MedicationForm.tsx */
"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema } from "@/lib/validation/schemas";
import { createMedication } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MedicationFormValues = z.infer<typeof medicationSchema>;

export default function MedicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: { name: "", dosage: "", reminderTime: "", notes: "" },
  });

  async function onSubmit(values: MedicationFormValues) {
    setIsSubmitting(true);
    try {
      await createMedication(values);
      form.reset();
    } catch (e) {
      console.error(e);
      alert("İlaç eklenemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İlaç Adı</FormLabel>
              <FormControl>
                <Input placeholder="Aspirin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doz (mg, tablet…)</FormLabel>
              <FormControl>
                <Input placeholder="500 mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reminderTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hatırlatma Saati</FormLabel>
              <FormControl>
                <Input type="time" {...field} className="w-32" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar (isteğe bağlı)</FormLabel>
              <FormControl>
                <Textarea placeholder="Açıklama..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </form>
    </Form>
  );
}
