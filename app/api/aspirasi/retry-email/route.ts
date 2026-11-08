import { NextResponse } from "next/server";
import { getAspirasiById, updateAspirasiEmailStatus } from "@/lib/supabase/aspirasi";
import { sendAspirasiEmail } from "@/lib/email/aspirasi-mailer";
import { maskEmail } from "@/lib/utils/mask-email";

/**
 * POST /api/aspirasi/retry-email
 *
 * Mengirim ulang email tanggapan aspirasi yang sebelumnya berstatus 'gagal'
 * tanpa mengubah jawaban atau status tiket yang sudah terkunci.
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

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID aspirasi wajib diisi" },
        { status: 400 }
      );
    }

    const item = await getAspirasiById(id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Aspirasi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (item.status !== "selesai") {
      return NextResponse.json(
        { success: false, error: "Hanya aspirasi berstatus selesai yang dapat dikirimkan email" },
        { status: 400 }
      );
    }

    const jawabanAdmin = item.jawaban_admin || item.catatan_pengurus || "";
    if (!jawabanAdmin.trim()) {
      return NextResponse.json(
        { success: false, error: "Tanggapan resmi belum diisi pada aspirasi ini" },
        { status: 400 }
      );
    }

    // Set status ke pending sementara
    await updateAspirasiEmailStatus(id, "pending");

    // Kirim email
    const emailResult = await sendAspirasiEmail({
      to: item.email,
      nomorTiket: item.nomor_tiket,
      angkatan: item.angkatan,
      pesan: item.pesan,
      jawabanAdmin: jawabanAdmin.trim(),
      dijawabOleh: item.dijawab_oleh || "Pengurus HIMASI",
      dijawabPada: item.dijawab_pada || undefined,
    });

    const maskedTo = maskEmail(item.email || "");

    if (emailResult.success) {
      const updated = await updateAspirasiEmailStatus(id, "terkirim");
      console.log(
        `[EMAIL SENT] Tiket: ${item.nomor_tiket} | To: ${maskedTo} | Respon: ${emailResult.message}`
      );
      return NextResponse.json({
        success: true,
        data: updated,
        message: `Email resmi berhasil dikirim ulang ke ${maskedTo}`,
      });
    } else {
      const updated = await updateAspirasiEmailStatus(id, "gagal");
      console.warn(
        `[EMAIL FAILED] Tiket: ${item.nomor_tiket} | To: ${maskedTo} | Error: ${emailResult.error}`
      );
      return NextResponse.json({
        success: false,
        data: updated,
        error: emailResult.error || "Gagal mengirim ulang email",
      }, { status: 502 });
    }
  } catch (err: unknown) {
    console.error("[api/aspirasi/retry-email] Internal server error:", err);
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

