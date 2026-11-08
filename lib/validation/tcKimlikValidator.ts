/**
  * T.C. Kimlik Numarası Algoritma Doğrulama Testi
  * 1. 11 hanelidir.
  * 2. İlk hanesi 0 olamaz.
  * 3. 1, 3, 5, 7 ve 9. hanelerin toplamının 7 katı ile 2, 4, 6 ve 8. hanelerin toplamının farkının 10'a bölümünden kalan 10. haneyi vermelidir.
  * 4. İlk 10 hanenin toplamının 10'a bölümünden kalan 11. haneyi vermelidir.
  */
export function validateTcKimlik(tc: string): boolean {
  if (!tc || tc.length !== 11 || !/^\d+$/.test(tc)) {
    return false;
  }
  if (tc[0] === "0") {
    return false;
  }

  const digits = tc.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const digit10 = (oddSum * 7 - evenSum) % 10;
  const first10Sum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const digit11 = first10Sum % 10;

  return digits[9] === ((digit10 % 10 + 10) % 10) && digits[10] === digit11;
}
