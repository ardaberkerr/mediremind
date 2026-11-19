export interface HealthMilestone {
  id: string;
  minutesRequired: number; // Kaç dakika sonra tamamlanır
  title: string;
  description: string;
  organ: string; // 🫀, 🫁, 🧠, 🩸, 👅
  source: string;
}

export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: "20min",
    minutesRequired: 20,
    title: "Nabız & Tansiyon Düzenlenir",
    description: "Kalp atış hızınız ve kan basıncınız normale dönmeye başlar. El ve ayak sıcaklığınız yükselir.",
    organ: "🫀",
    source: "Dünya Sağlık Örgütü (WHO)",
  },
  {
    id: "8hours",
    minutesRequired: 8 * 60, // 480 dk
    title: "Kandaki Karbonmonoksit Düşer",
    description: "Kandaki zehirli karbonmonoksit seviyesi yarıya iner. Oksijen seviyeniz normale ulaşır.",
    organ: "🩸",
    source: "CDC Sağlık Rehberi",
  },
  {
    id: "24hours",
    minutesRequired: 24 * 60, // 1440 dk
    title: "Kalp Krizi Riski Azalmaya Başlar",
    description: "Vücudunuz nikotinden tamamen arınır. Akciğerler mukus ve sigara kalıntılarını temizlemeye başlar.",
    organ: "🫀",
    source: "Amerikan Kalp Derneği",
  },
  {
    id: "48hours",
    minutesRequired: 48 * 60,
    title: "Tat ve Koku Duyuları Keskinleşir",
    description: "Hasar gören sinir uçları yenilenmeye başlar. Yiyeceklerin tadını ve çevredeki kokuları çok daha berrak alırsınız.",
    organ: "👅",
    source: "NHS Bırakma Kılavuzu",
  },
  {
    id: "72hours",
    minutesRequired: 72 * 60,
    title: "Bronşlar Gevşer & Nefes Kolaylaşır",
    description: "Akciğer hava yolları rahatlar, nefes almak gözle görülür şekilde kolaylaşır. Enerji seviyeniz artar.",
    organ: "🫁",
    source: "WHO",
  },
  {
    id: "2weeks",
    minutesRequired: 14 * 24 * 60,
    title: "Kan Dolaşımı & Yürüyüş Gücü Artar",
    description: "Kan dolaşımınız belirgin şekilde iyileşir. Merdiven çıkarken veya yürürken nefes nefese kalma azalır.",
    organ: "🏃‍♂️",
    source: "CDC",
  },
  {
    id: "1month",
    minutesRequired: 30 * 24 * 60,
    title: "Öksürük ve Hırıltı Biter",
    description: "Akciğerdeki temizleyici silia tüyleri yeniden çalışır. Enfeksiyon riski hızla düşer, sabah öksürükleri kaybolur.",
    organ: "🫁",
    source: "Mayo Clinic",
  },
  {
    id: "3months",
    minutesRequired: 90 * 24 * 60,
    title: "Akciğer Kapasitesi %30 Artar",
    description: "Solunum kapasiteniz yaklaşık %30 oranında artar. Fiziksel performansınız sigaraya başlamadan önceki günlere yaklaşır.",
    organ: "🫁",
    source: "Amerikan Akciğer Derneği",
  },
  {
    id: "1year",
    minutesRequired: 365 * 24 * 60,
    title: "Koroner Kalp Hastalığı Riski %50 Azalır",
    description: "Kalp damar hastalığı ve kalp krizi geçirme riskiniz bir sigara içicisine kıyasla yarı yarıya düşer.",
    organ: "❤️",
    source: "WHO & AHA",
  },
  {
    id: "5years",
    minutesRequired: 5 * 365 * 24 * 60,
    title: "Felç (İnme) Riski Sıfırlanır",
    description: "Beyin kanaması ve felç riskiniz, hiç sigara içmemiş bir insanınkiyle aynı seviyeye geriler.",
    organ: "🧠",
    source: "CDC",
  },
  {
    id: "10years",
    minutesRequired: 10 * 365 * 24 * 60,
    title: "Akciğer Kanseri Riski Yarıya İner",
    description: "Akciğer kanserinden ölüm riskiniz yarıya düşer; ağız, boğaz ve pankreas kanseri riski belirgin şekilde azalır.",
    organ: "🛡️",
    source: "Dünya Kanser Araştırma Fonu",
  },
];

export const MOTIVATION_TIPS = [
  "Bir kriz dalgası ortalama 3 ile 5 dakika sürer. Bu dalga sonsuza kadar sürmeyecek, sadece derin bir nefes alıp su için.",
  "Şu ana kadar vücudunuzu nikotin toksinlerinden arındırdınız. Bir tek nefesten bile uzak durarak tüm bu emeği koruyorsunuz.",
  "Canınız sigara istediğinde ellerinizi meşgul edin: bir bardak soğuk su alın, yürüyüşe çıkın ya da yüzünüzü yıkayın.",
  "Sigarayı bırakmak hayatınıza her gün ortalama 2-3 saatlik net zaman kazandırır.",
  "Unutmayın: 'Sadece 1 dal içsem bir şey olmaz' düşüncesi nikotinin kurduğu en büyük tuzaktır. Siz bu tuzağa düşmeyecek kadar güçlüsünüz.",
  "Bugün tasarruf ettiğiniz parayı kendinize veya sevdiklerinize ödül olarak ayırın.",
];
