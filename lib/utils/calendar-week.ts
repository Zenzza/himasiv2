/**
 * Utilitas Kalkulasi Calendar Week (CW) & Format Tanggal
 * Basis Kalender: Minggu dimulai hari Minggu (Sunday-based), selaras dengan acuan operasional Medkominfo.
 */

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

/**
 * Parsing tanggal string (YYYY-MM-DD) atau Date secara aman tanpa risiko pergeseran zona waktu.
 */
export function parseDateSafe(dateInput: Date | string): Date {
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    const parsed = new Date(dateInput);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }
  return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
}

/**
 * Mengubah Date menjadi string baku 'YYYY-MM-DD'.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Mengambil hari Minggu pembuka dari Week 1 untuk tahun tertentu.
 * Week 1 adalah minggu yang memuat tanggal 1 Januari.
 * Karena patokan minggu dimulai hari Minggu, awal Week 1 adalah hari Minggu pada atau sebelum 1 Jan.
 */
function getWeek1Sunday(year: number): Date {
  const jan1 = new Date(year, 0, 1, 0, 0, 0, 0);
  const dayOfWeek = jan1.getDay(); // 0 = Sunday, 1 = Monday, ...
  return new Date(year, 0, 1 - dayOfWeek, 0, 0, 0, 0);
}

/**
 * Menghitung nomor Calendar Week (CW) dari sebuah tanggal (Sunday-based).
 * Contoh:
 * - 2024-05-26 (Sunday) s.d. 2024-06-01 (Saturday) -> CW 22
 * - 2024-06-02 (Sunday) s.d. 2024-06-08 (Saturday) -> CW 23
 */
export function getCalendarWeekNumber(dateInput: Date | string): number {
  const date = parseDateSafe(dateInput);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Hari Minggu dari minggu berjalan
  const currentSunday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - dayOfWeek,
    0, 0, 0, 0
  );

  // Hari Sabtu dari minggu berjalan (akhir minggu)
  const currentSaturday = new Date(
    currentSunday.getFullYear(),
    currentSunday.getMonth(),
    currentSunday.getDate() + 6,
    0, 0, 0, 0
  );

  // Tentukan tahun pemilik minggu
  let targetYear = currentSunday.getFullYear();
  if (currentSaturday.getFullYear() > currentSunday.getFullYear()) {
    targetYear = currentSaturday.getFullYear();
  }

  // Hitung selisih hari dari Minggu pembuka Week 1 tahun target
  const week1Sunday = getWeek1Sunday(targetYear);
  const diffMs = currentSunday.getTime() - week1Sunday.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    const prevWeek1 = getWeek1Sunday(targetYear - 1);
    const prevDiffDays = Math.round((currentSunday.getTime() - prevWeek1.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(prevDiffDays / 7) + 1;
  }

  return Math.floor(diffDays / 7) + 1;
}

/**
 * Mengembalikan array 7 objek Date dimulai dari hari Minggu (Sunday) untuk nomor minggu tertentu.
 */
export function getDaysInWeek(year: number, weekNumber: number): Date[] {
  const week1Sunday = getWeek1Sunday(year);
  const startOfWeek = new Date(
    week1Sunday.getFullYear(),
    week1Sunday.getMonth(),
    week1Sunday.getDate() + (weekNumber - 1) * 7,
    0, 0, 0, 0
  );

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(
      new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + i,
        0, 0, 0, 0
      )
    );
  }
  return days;
}

export interface CalendarWeekDetail {
  cw: number;
  year: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

/**
 * Mengembalikan rincian lengkap Calendar Week (CW) yang menyentuh bulan tertentu,
 * lengkap dengan nomor CW, tahun, dan array 7 objek Date (Sunday s.d. Saturday).
 * Menjamin batas akhir tahun (Desember-Januari) tidak mengalami desinkronisasi.
 */
export function getCalendarWeekDetailsForMonth(
  year: number,
  monthIndex: number
): CalendarWeekDetail[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0, 0, 0, 0);

  // Mulai dari hari Minggu dari minggu pertama yang menyentuh bulan ini
  const startSunday = new Date(
    year,
    monthIndex,
    1 - firstDayOfMonth.getDay(),
    0, 0, 0, 0
  );

  const result: CalendarWeekDetail[] = [];
  const currentSunday = new Date(startSunday);

  while (currentSunday <= lastDayOfMonth) {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(
        new Date(
          currentSunday.getFullYear(),
          currentSunday.getMonth(),
          currentSunday.getDate() + i,
          0, 0, 0, 0
        )
      );
    }
    const cw = getCalendarWeekNumber(currentSunday);
    // Hari Rabu (tengah minggu) menentukan tahun kalender kepemilikan minggu
    const cwYear = days[3].getFullYear();

    result.push({
      cw,
      year: cwYear,
      startDate: days[0],
      endDate: days[6],
      days,
    });

    currentSunday.setDate(currentSunday.getDate() + 7);
  }

  return result;
}

/**
 * Mengembalikan daftar nomor Calendar Week (CW) yang menyentuh bulan tertentu.
 * @param year Tahun kalender
 * @param monthIndex Indeks bulan (0 = Januari, 5 = Juni, 11 = Desember)
 */
export function getCalendarWeeksForMonth(year: number, monthIndex: number): number[] {
  const details = getCalendarWeekDetailsForMonth(year, monthIndex);
  const weeks: number[] = [];
  for (const item of details) {
    if (!weeks.includes(item.cw)) {
      weeks.push(item.cw);
    }
  }
  return weeks;
}

/**
 * Format informasi nama hari, nomor tanggal, dan format fullDate string YYYY-MM-DD
 */
export function formatDayOfWeek(dateInput: Date | string): {
  dayName: DayName;
  dayNumber: number;
  fullDate: string;
} {
  const date = parseDateSafe(dateInput);
  return {
    dayName: DAY_NAMES[date.getDay()],
    dayNumber: date.getDate(),
    fullDate: formatDateToYYYYMMDD(date),
  };
}
