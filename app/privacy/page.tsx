import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Gizlilik Politikası - MediRemind",
  description: "MediRemind uygulaması kişisel veri ve gizlilik politikası",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link href="/" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline mb-2 inline-block">
            ← Ana Sayfaya Dön
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black">Gizlilik Politikası (Privacy Policy)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Son Güncelleme: 8 Kasım 2026</p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Giriş ve Kapsam</h2>
          <p>
            MediRemind ("Uygulama"), kullanıcıların ilaç kullanım saatlerini takip etmelerine, hatırlatma SMS ve mobil bildirimleri almalarına yardımcı olmak amacıyla geliştirilmiştir. Kullanıcılarımızın gizliliği bizim için en önemli önceliktir.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Toplanan Bilgiler</h2>
          <p>Uygulamamızın çalışabilmesi için aşağıdaki temel bilgiler kullanıcı onayıyla işlenir:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>İletişim Bilgileri:</strong> İlaç hatırlatma SMS'lerinin ulaştırılabilmesi için telefon numarası ve isteğe bağlı e-posta adresi.</li>
            <li><strong>İlaç ve Sağlık Takip Bilgileri:</strong> İlaç adı, dozu, kullanım saati ve isteğe bağlı kişisel notlar.</li>
            <li><strong>Cihaz ve Bildirim Bilgileri:</strong> Arka planda ilaç vakti geldiğinde uyarı verebilmek amacıyla Push Bildirim belirteçleri (Token).</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Bilgilerin Kullanım Amacı</h2>
          <p>Toplanan kişisel veriler sadece şu amaçlarla kullanılır:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Kullanıcının belirlediği zamanlarda ilaç alma hatırlatmalarını SMS ve mobil bildirim olarak göndermek.</li>
            <li>Kullanıcı hesabı oluşturmak ve oturum güvenliğini sağlamak.</li>
            <li>Uygulama işlevselliğini geliştirmek ve hata raporlarını analiz etmek.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Veri Güvenliği ve Paylaşım</h2>
          <p>
            Verileriniz asla üçüncü taraflarla reklam veya pazarlama amacıyla paylaşılmaz ya da satılmaz. Şifreleriniz sistemlerimizde tek yönlü güvenli şifreleme algoritmaları (bcrypt) ile saklanmaktadır.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Veri Silme ve Kullanıcı Hakları</h2>
          <p>
            Kullanıcılar diledikleri zaman hesaplarını ve kayıtlı ilaç geçmişlerini silme talebinde bulunabilirler. Hesabınız silindiğinde tüm verileriniz kalıcı olarak imha edilir.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">6. İletişim</h2>
          <p>
            Gizlilik politikamızla ilgili herhangi bir sorunuz için bize <strong>support@mediremind.com</strong> adresi üzerinden ulaşabilirsiniz.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
              Anladım, Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
