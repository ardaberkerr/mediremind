"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema } from "../lib/validation/schemas";
import { createMedication, showDesktopNotification } from "../lib/api/client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface MedicationFormProps {
  defaultPhone?: string;
  onMedicationAdded?: () => void;
  onSmsTriggered?: (to: string, message: string, provider: string) => void;
}

export default function MedicationForm({
  defaultPhone = "+905551234567",
  onMedicationAdded,
  onSmsTriggered,
}: MedicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      reminderTime: "09:00",
      phone: defaultPhone,
      notes: "",
    },
  });

  async function onSubmit(values: MedicationFormValues) {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      // 1. Call persistent backend API
      const resApi = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          userName: undefined,
        }),
      });
      const dataApi = await resApi.json();

      if (!resApi.ok || !dataApi.success) {
        throw new Error(dataApi.error || "İlaç kaydı oluşturulamadı.");
      }

      const successMsg = `✅ ${values.name} (${values.dosage}) saat ${values.reminderTime} için başarıyla kuruldu. İlaç saati geldiğinde bildirim gönderilecektir.`;

      setFeedback({
        type: "success",
        message: successMsg,
      });

      // İlaç kaydedildiğinde anında bildirim/SMS tetiklenmez.
      // Zamanı geldiğinde arka plandaki Scheduler (Zamanlayıcı) otomatik gönderecektir.

      onMedicationAdded?.();

      form.reset({
        name: "",
        dosage: "",
        reminderTime: "09:00",
        phone: values.phone,
        notes: "",
      });
    } catch (e: any) {
      console.error(e);
      setFeedback({
        type: "error",
        message: `❌ İlaç kaydı başarısız oldu: ${e.message || "Bilinmeyen hata"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm transition-all animate-fadeIn ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg">{feedback.type === "success" ? "🎉" : "⚠️"}</span>
              <div className="flex-1">
                <p className="font-semibold leading-relaxed">{feedback.message}</p>
                {feedback.details && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-mono">{feedback.details}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Row 1: İlaç Adı & Dozaj */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  İlaç Adı <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Örn: Parol, Aspirin, Glukofen"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dozaj / Miktar <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Örn: 500 mg, 1 Tablet, 2 Puf"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Telefon Numarası & Saat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  SMS Gönderilecek Telefon <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+905551234567"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm font-mono"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reminderTime"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hatırlatma Saati <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Notlar */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kullanım Talimatı / Önemli Not (İsteğe Bağlı)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Örn: Yemekten 30 dakika sonra bol su ile alınacaktır."
                  rows={2}
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1 text-center sm:text-left">
            ✨ Form kaydedildiğinde anında SMS bildirimi tetiklenir.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 order-1 sm:order-2 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>İşleniyor & SMS Gönderiliyor...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>İlacı Kaydet & SMS Gönder</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
