"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uygulama hatası:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-3xl text-rose-500">
        ⚠️
      </div>
      <h2 className="text-xl font-bold mb-2">Bir şeyler ters gitti!</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {error?.message || "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin."}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl"
        >
          Tekrar Dene
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
          className="border-slate-300 dark:border-slate-700 font-bold px-6 py-2 rounded-xl"
        >
          Ana Sayfaya Dön
        </Button>
      </div>
    </div>
  );
}
