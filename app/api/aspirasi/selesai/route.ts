import { NextResponse } from "next/server";
import { getAspirasiById, selesaikanAspirasi, updateAspirasiEmailStatus } from "@/lib/supabase/aspirasi";
import { maskEmail } from "@/lib/utils/mask-email";
import { sendAspirasiEmail } from "@/lib/email/aspirasi-mailer";

/**
 * POST /api/aspirasi/selesai
 *
 * Menyelesaikan aspirasi mahasiswa/alumni dengan mencatat jawaban resmi pengurus,
 * mengunci status menjadi 'selesai' (immutable), dan memicu pengiriman email
 * resmi via Google Apps Script Webhook (atau simulasi jika belum disetel).
 */
export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "ID aspirasi wajib diisi" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "ID aspirasi wajib diisi" },
        { status: 400 }
      );
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID aspirasi wajib diisi" },
        { status: 400 }
      );
    }

    const jawabanAdminRaw = body.jawaban_admin;
    if (typeof jawabanAdminRaw !== "string" || !jawabanAdminRaw.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Jawaban admin wajib diisi untuk menyelesaikan aspirasi",
        },
        { status: 400 }
      );
    }

    const trimmedJawaban = jawabanAdminRaw.trim();
    const dijawabOleh =
      typeof body.dijawab_oleh === "string" && body.dijawab_oleh.trim()
        ? body.dijawab_oleh.trim()
        : "Pengurus HIMASI";

    // 1. Validasi keberadaan aspirasi
    const existing = await getAspirasiById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Aspirasi tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Validasi status immutability (sudah selesai tidak boleh diubah kembali)
    if (existing.status === "selesai") {
      return NextResponse.json(
        {
          success: false,
          error: "Aspirasi ini sudah berstatus selesai dan telah dikunci permanen",
        },
        { status: 409 }
      );
    }

    const hasLiveWebhook = Boolean(
      process.env.HIMASI_EMAIL_WEBHOOK_URL && process.env.HIMASI_EMAIL_SECRET_TOKEN
    );

    // 3. Jalankan penyelesaian aspirasi di service layer
    let updated = await selesaikanAspirasi(id, {
      jawaban_admin: trimmedJawaban,
      dijawab_oleh: dijawabOleh,
      status_email: hasLiveWebhook ? "pending" : "simulasi_terkirim",
    });

    const maskedTo = maskEmail(updated.email || "");

    // 4. Pengiriman Email Riil atau Simulasi
    if (hasLiveWebhook && updated.email) {
      const emailResult = await sendAspirasiEmail({
        to: updated.email,
        nomorTiket: updated.nomor_tiket,
        angkatan: updated.angkatan,
        pesan: updated.pesan,
        jawabanAdmin: updated.jawaban_admin || trimmedJawaban,
        dijawabOleh: updated.dijawab_oleh || dijawabOleh,
        dijawabPada: updated.dijawab_pada || undefined,
      });

      if (emailResult.success) {
        updated = await updateAspirasiEmailStatus(id, "terkirim");
        console.log(
          `[EMAIL LIVE SENT] Tiket: ${updated.nomor_tiket} | To: ${maskedTo} | Respon: ${emailResult.message}`
        );
        return NextResponse.json({
          success: true,
          data: updated,
          message: `Aspirasi berhasil diselesaikan dan email resmi telah dikirim ke ${maskedTo}`,
        });
      } else {
        updated = await updateAspirasiEmailStatus(id, "gagal");
        console.warn(
          `[EMAIL LIVE FAILED] Tiket: ${updated.nomor_tiket} | To: ${maskedTo} | Error: ${emailResult.error}`
        );
        return NextResponse.json({
          success: true,
          data: updated,
          message: `Aspirasi berhasil diselesaikan, namun pengiriman email mengalami kendala (${emailResult.error}). Anda dapat mengirim ulang nanti melalui dashboard.`,
        });
      }
    } else {
      // Log simulasi pengiriman email ke terminal server
      console.log(
        `[EMAIL SIMULATION] Tiket: ${updated.nomor_tiket} | To: ${maskedTo} | Jawaban: ${updated.jawaban_admin}`
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message:
          "Aspirasi berhasil diselesaikan dan simulasi email tanggapan berhasil dikirim",
      });
    }
  } catch (err: unknown) {
    console.error("[api/aspirasi/selesai] Internal server error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
