import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-3xl text-amber-500">
        🔍
      </div>
      <h2 className="text-2xl font-bold mb-2">404 - Sayfa Bulunamadı</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link href="/">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl">
          Ana Sayfaya Git
        </Button>
      </Link>
    </div>
  );
}
