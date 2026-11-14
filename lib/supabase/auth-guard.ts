import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/aspirasi";

export interface ServerAuthCheckResult {
  authorized: boolean;
  userId?: string;
  email?: string;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Server-side guard untuk memverifikasi bahwa request API berasal dari pengurus
 * yang telah terautentikasi (memiliki sesi login aktif di Supabase).
 *
 * Mekanisme Pemeriksaan:
 * 1. Bearer JWT token diverifikasi melalui layanan autentikasi Supabase (`supabase.auth.getUser(token)`).
 * 2. Shared secret token (`x-secret-token` atau Bearer) dicocokkan dengan `HIMASI_EMAIL_SECRET_TOKEN`
 *    untuk pemanggilan otomatis server-to-server atau skrip internal.
 * 3. Jika kredensial Supabase belum disetel (mode offline, preview, atau unit test),
 *    sistem menggunakan mode simulasi terisolasi agar workflow tidak terputus.
 */
export async function verifyServerAdminAuth(request: Request): Promise<ServerAuthCheckResult> {
  // Jika Supabase environment credentials belum disetel (preview / test runner)
  if (!isSupabaseConfigured()) {
    return {
      authorized: true,
      isSimulated: true,
      userId: "simulated-admin",
      email: "himasi@atmaluhur.ac.id",
    };
  }

  const authHeader = request.headers.get("authorization") || "";
  const tokenFromBearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  const secretToken = process.env.HIMASI_EMAIL_SECRET_TOKEN;
  const customSecretHeader = request.headers.get("x-secret-token") || "";

  // Jalur 1: Shared secret token untuk integrasi internal / relay server
  if (secretToken && (tokenFromBearer === secretToken || customSecretHeader === secretToken)) {
    return {
      authorized: true,
      userId: "system-token",
      email: "system@himasi.web.id",
    };
  }

  // Jalur 2: Verifikasi Bearer JWT Supabase Auth
  if (!tokenFromBearer) {
    return {
      authorized: false,
      error: "Akses ditolak: Token otorisasi tidak ditemukan. Silakan login sebagai pengurus.",
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser(tokenFromBearer);

    if (error || !data?.user) {
      return {
        authorized: false,
        error: "Akses ditolak: Sesi pengurus tidak valid atau telah kedaluwarsa. Silakan login ulang.",
      };
    }

    return {
      authorized: true,
      userId: data.user.id,
      email: data.user.email,
    };
  } catch (err: unknown) {
    console.error("[verifyServerAdminAuth] Error validating auth token:", err);
    return {
      authorized: false,
      error: "Terjadi kesalahan saat memverifikasi kredensial pengurus.",
    };
  }
}
