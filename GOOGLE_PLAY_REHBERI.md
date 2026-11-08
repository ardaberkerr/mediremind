# MediRemind — Google Play Console Yükleme & Mağaza Listeleme Rehberi

Bu dosya, uygulamanızı **Google Play Console**'a yüklerken ihtiyaç duyacağınız tüm mağaza metinlerini, izin açıklamalarını ve adım adım süreci içerir.

---

## 1. Google Play Mağaza Listeleme Bilgileri

* **Uygulama Adı:** MediRemind - Akıllı İlaç Takibi
* **Kısa Açıklama (En fazla 80 karakter):**
  Zamanında ilaç hatırlatması, otomatik SMS ve mobil alarm bildirimleri.
* **Tam Açıklama (En fazla 4000 karakter):**
  MediRemind, düzenli ilaç kullanan hastalar ve hasta yakınları için geliştirilmiş akıllı bir ilaç takip ve hatırlatma uygulamasıdır.

  Öne Çıkan Özellikler:
  • Akıllı İlaç Hatırlatıcı: İlaç saatleriniz geldiğinde sesli alarm ve bildirimler alın.
  • Otomatik SMS Bildirimi: İnternet bağlantınız olmasa bile kayıtlı numaranıza SMS hatırlatması iletilir.
  • Hasta ve Yakını Takibi: Acil durum kişisi ve iletişim bilgileriyle güvenli takip.
  • Kolay ve Sade Arayüz: Yaşlılar ve tüm kullanıcılar için büyük butonlu, okunabilir Türkçe tasarım.
  • Kapsamlı Kimlik & Sağlık Notları: Kan grubu, alerjiler ve kronik rahatsızlıkları tek ekranda saklayın.
  • Gizlilik ve Güvenlik: Sağlık verileriniz en üst düzey şifreleme standartlarıyla korunur, reklam amaçlı paylaşılmaz.

* **Kategori:** Tıp / Sağlık ve Fitness (Medical)
* **İçerik Derecelendirmesi (IARC):** PEGI 3 / Herkes (Everyone)
* **Gizlilik Politikası URL'i:** `https://<CANLI_ALAN_ADINIZ>/privacy`
* **İletişim E-Postası:** `support@mediremind.com`

---

## 2. Google Play Sağlık Bildirimi (Health Apps Declaration)

Google Play Console'da "Uygulama İçeriği" -> "Sağlık Uygulamaları" formunu doldururken:
* **Uygulama Türü:** Sağlık Yönetimi / İlaç Takip (Medication Management)
* **Klinik Teşhis Yapıyor mu?:** Hayır (Bu uygulama tıbbi teşhis koymaz; yalnızca kullanıcının girdiği ilaç saatlerini hatırlatır).

---

## 3. PWABuilder ile 2 Dakikada `.aab` Paketi Alma

1. Uygulamanızı internete yükleyin (Vercel, Railway, DigitalOcean vb.).
2. [pwabuilder.com](https://www.pwabuilder.com/) adresine gidin ve canlı bağlantınızı girin.
3. PWA Uyumluluk puanı: **100 / 100**
4. **"Package for Android"** butonuna tıklayın:
   * **Package ID:** `com.mediremind.app`
   * **App Name:** `MediRemind`
   * **Launcher Name:** `MediRemind`
   * **Signing Key:** Yeni bir anahtar oluşturun veya mevcut keystore'unuzu seçin.
5. İndirilen paketteki **`.aab`** dosyasını doğrudan Google Play Console'a yükleyin.
6. Paket içindeki SHA-256 parmak izini `public/.well-known/assetlinks.json` dosyasına ekleyin.
