import type {
  VotingStatus,
  DPTImportPreviewItem,
} from "../types/voting";

/**
 * Normalizes input date string into ISO YYYY-MM-DD
 * Supports YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, D/M/YYYY
 */
export function normalizeBirthDate(rawDate: string): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  const maxYear = new Date().getFullYear();

  // Pattern 1: ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year >= 1970 && year <= maxYear && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  // Pattern 2: Indonesian DD/MM/YYYY or DD-MM-YYYY
  const idMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (idMatch) {
    const day = parseInt(idMatch[1], 10);
    const month = parseInt(idMatch[2], 10);
    const year = parseInt(idMatch[3], 10);
    if (year >= 1970 && year <= maxYear && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Auto-formats date input to DD/MM/YYYY with automatic slash insertion
 * Handles forward typing, backspacing, manual slashes, and ISO pasting.
 */
export function formatDateInput(value: string, prevValue: string = ""): string {
  const trimmed = value.trim();

  // If user pasted ISO format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  const isDeleting = prevValue.length > value.length;
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  if (isDeleting) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  if (digits.length < 2) return digits;
  if (digits.length === 2) {
    return value.endsWith("/") ? `${digits}/` : digits;
  }
  if (digits.length < 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length === 4) {
    return value.endsWith("/")
      ? `${digits.slice(0, 2)}/${digits.slice(2)}/`
      : `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Calculates turnout metric safely
 */
export function calculateTurnout(
  totalDPT: number,
  totalSuara: number
): { count: number; percentage: number } {
  if (totalDPT <= 0 || totalSuara <= 0) {
    return { count: 0, percentage: 0 };
  }
  const pct = Math.min(100, Math.round((totalSuara / totalDPT) * 1000) / 10);
  return { count: totalSuara, percentage: pct };
}

/**
 * Blind voting rules: only closed sessions with locked results can be unlocked
 */
export function canUnlockResults(status: VotingStatus, isUnlocked: boolean): boolean {
  return status === "closed" && !isUnlocked;
}

/**
 * Reopening rules: only closed sessions where results haven't been unlocked can be reopened
 */
export function canReopenSession(status: VotingStatus, isUnlocked: boolean): boolean {
  return status === "closed" && !isUnlocked;
}

/**
 * Parse DPT CSV or TSV string into preview items
 */
export function parseDPTBatchCSV(csvText: string): {
  valid: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>;
  invalid: DPTImportPreviewItem[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const valid: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }> = [];
  const invalid: DPTImportPreviewItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line is header
    if (i === 0 && (line.toLowerCase().includes("nim") || line.toLowerCase().includes("nama"))) {
      continue;
    }

    // Delimiter can be comma, semicolon, or tab
    const parts = line.includes("\t")
      ? line.split("\t")
      : line.includes(";")
        ? line.split(";")
        : line.split(",");

    const nim = parts[0]?.trim() || "";
    const nama = parts[1]?.trim() || "";
    const rawDate = parts[2]?.trim() || "";

    const normalizedDate = normalizeBirthDate(rawDate);

    if (!nim || nim.length < 5) {
      invalid.push({
        nim,
        nama_lengkap: nama || "Tanpa Nama",
        tanggal_lahir: "",
        raw_tanggal_lahir: rawDate,
        is_valid: false,
        error_message: "NIM kosong atau tidak valid",
      });
      continue;
    }

    if (!normalizedDate) {
      invalid.push({
        nim,
        nama_lengkap: nama || "Tanpa Nama",
        tanggal_lahir: "",
        raw_tanggal_lahir: rawDate,
        is_valid: false,
        error_message: "Format tanggal lahir tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD)",
      });
      continue;
    }

    valid.push({
      nim,
      nama_lengkap: nama || `Mahasiswa ${nim}`,
      tanggal_lahir: normalizedDate,
    });
  }

  return { valid, invalid };
}

/**
 * Pure validation logic for student 2FA DPT credentials (NIM + Birth Date)
 */
export function validateDPTVoterCredentials<
  T extends { nim: string; tanggal_lahir: string; sudah_memilih: boolean }
>(
  voterList: T[],
  inputNIM: string,
  rawBirthDate: string
): { success: boolean; voter?: T; error?: string } {
  const cleanNIM = inputNIM.trim();
  const normalizedInputDate = normalizeBirthDate(rawBirthDate);

  if (!cleanNIM) {
    return { success: false, error: "NIM wajib diisi." };
  }

  if (!normalizedInputDate) {
    return {
      success: false,
      error: "Format tanggal lahir tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD).",
    };
  }

  const voter = voterList.find(
    (v) => v.nim.trim().toLowerCase() === cleanNIM.toLowerCase()
  );
  if (!voter) {
    return { success: false, error: "NIM tidak terdaftar di DPT pemilihan ini." };
  }

  if (voter.sudah_memilih) {
    return {
      success: false,
      error: "Hak suara untuk NIM ini telah digunakan (sudah memilih).",
    };
  }

  const normalizedVoterDate = normalizeBirthDate(voter.tanggal_lahir);
  if (normalizedVoterDate !== normalizedInputDate) {
    return {
      success: false,
      error: "Tanggal lahir tidak sesuai dengan data DPT terdaftar.",
    };
  }

  return { success: true, voter };
}

/**
 * Generates an official unique voting receipt code (e.g. HIMASI-EVOTE-2026-X8KJ9)
 */
export function generateReceiptCode(year?: number): string {
  const yr = year || new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = "";
  for (let i = 0; i < 5; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HIMASI-EVOTE-${yr}-${hash}`;
}

/**
 * Browser & Node-safe UUID v4 generator
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validates if a string is a standard RFC 4122 UUID v4
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}


