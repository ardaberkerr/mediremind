"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white font-sans">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-rose-900/50 flex items-center justify-center text-3xl text-rose-400">
          ⚠️
        </div>
        <h2 className="text-xl font-bold mb-2">Kritik Bir Hata Oluştu</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          {error?.message || "Sistemde beklenmedik bir sorun oluştu."}
        </p>
        <Button
          onClick={() => reset()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl"
        >
          Yeniden Dene
        </Button>
      </body>
    </html>
  );
}
