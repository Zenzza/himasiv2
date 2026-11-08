/**
 * Layanan Pengiriman Email Notifikasi Aspirasi Mahasiswa/Alumni
 * Menggunakan Google Apps Script Webhook Relay Resmi HIMASI ISB Atma Luhur
 * 
 * Desain: Konsep 1 - The Signature Split-Card (Homepage Homology)
 * Menyelaraskan identitas visual portal web himasiv2 (form-aspirasi.tsx):
 * Gradien Midnight Navy (#00296E), Ambient Cyan Accent (#38BDF8 / #0094E0),
 * Floating Ticket Pill Card, Soft Rounded Cards (rounded-28px/18px),
 * dan Emerald Verified Official Response Card (#059669 / #ECFDF5).
 */

export interface SendAspirasiEmailParams {
  to: string;
  nomorTiket: string;
  angkatan: string;
  pesan: string;
  jawabanAdmin: string;
  dijawabOleh?: string;
  dijawabPada?: string;
}

export interface SendAspirasiEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Membuat template email HTML responsif bermerek resmi HIMASI ISB Atma Luhur
 * berbasis Konsep 1: The Signature Split-Card.
 */
export function generateAspirasiEmailHtml(params: SendAspirasiEmailParams): string {
  const tanggalFormat = params.dijawabPada
    ? new Date(params.dijawabPada).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const responder = params.dijawabOleh || "Pengurus HIMASI ISB Atma Luhur";
  const sanitizedPesan = params.pesan.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sanitizedJawaban = params.jawabanAdmin.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Tanggapan Resmi Aspirasi HIMASI #${params.nomorTiket}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A; line-height: 1.6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  
  <!-- Outer Wrapper (Light Clean Slate Backdrop) -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Document Sheet (The Signature Split-Card, max-width 580px, rounded-28px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 20px 45px -10px rgba(0, 41, 110, 0.08); overflow: hidden;">
          
          <!-- GRADIENT BRANDING CARD HEADER (Identik dengan sisi kiri form-aspirasi beranda) -->
          <tr>
            <td style="background-color: #00296E; background-image: linear-gradient(135deg, #00296E 0%, #002257 55%, #00173d 100%); padding: 36px 32px 30px 32px; text-align: left;">

              <!-- Header Headline -->
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">
                Suaramu Membangun Masa Depan Sistem Informasi
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #CBD5E1; line-height: 1.5; font-weight: 400;">
                Aspirasi Anda telah ditinjau dan diselesaikan secara resmi oleh pengurus HIMASI dengan hasil tindak lanjut berikut.
              </p>

              <!-- Floating Ticket Pill Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 22px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 12px 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td valign="middle">
                          <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94A3B8; letter-spacing: 1px;">
                            Nomor Tiket Aspirasi
                          </div>
                          <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 16px; font-weight: 800; color: #38BDF8; letter-spacing: 1px; margin-top: 2px;">
                            ${params.nomorTiket}
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="display: inline-block; background-color: #059669; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                            &#10003; Selesai
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BODY CONTENT SECTION -->
          <tr>
            <td style="padding: 28px 32px 20px 32px;">
              <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #0F172A;">
                Halo Rekan Mahasiswa / Alumni,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                Terima kasih atas kepedulian Anda terhadap kemajuan program studi. Berikut rincian tanggapan resmi dari pengurus HIMASI atas aspirasi yang telah Anda sampaikan:
              </p>

              <!-- Bubble 1: Pesan Mahasiswa (Soft Slate Card) -->
              <div style="margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Pesan yang Anda Kirimkan (Angkatan ${params.angkatan}):
                </div>
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 18px; border-top-left-radius: 4px; padding: 16px 18px; font-size: 13px; color: #334155; line-height: 1.6; font-style: italic; white-space: pre-wrap;">&ldquo;${sanitizedPesan}&rdquo;</div>
              </div>

              <!-- Bubble 2: Tanggapan Resmi Pengurus (Emerald Verified Card) -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #059669; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Tanggapan Resmi Pengurus HIMASI:
                </div>
                <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 18px; border-top-right-radius: 4px; padding: 18px 20px;">
                  <div style="font-size: 14px; color: #064E3B; line-height: 1.65; font-weight: 500; white-space: pre-wrap;">${sanitizedJawaban}</div>
                  <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #A7F3D0; font-size: 11px; color: #047857;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left" style="font-size: 11px; color: #047857; vertical-align: middle;">
                          <strong>Dijawab oleh:</strong> ${responder}
                        </td>
                        <td align="right" style="font-size: 11px; color: #047857; vertical-align: middle;">
                          ${tanggalFormat}
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Call To Action Website -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="https://himasiv2.vercel.app" style="display: inline-block; background-color: #00296E; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 4px 15px rgba(0, 41, 110, 0.2);">
                      Buka Portal Transparansi HIMASI &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; color: #64748B; font-size: 11px;">
              <div style="font-weight: 700; color: #00296E; font-size: 12px; margin-bottom: 4px;">
                Himpunan Mahasiswa Sistem Informasi (HIMASI)
              </div>
              <div style="margin-bottom: 8px;">
                Institut Sains dan Bisnis (ISB) Atma Luhur Pangkalpinang
              </div>
              <div style="font-size: 10px; color: #94A3B8;">
                Email ini dikirimkan secara otomatis dari portal resmi HIMASI.<br>Mohon jangan membalas langsung email ini.
              </div>
              <div style="margin-top: 12px; font-size: 9px; color: #CBD5E1;">
                &copy; 2026 HIMASI ISB Atma Luhur &bull; All Rights Reserved
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Mengirimkan email tanggapan resmi aspirasi ke alamat email mahasiswa/alumni
 * via Google Apps Script Webhook Relay
 */
export async function sendAspirasiEmail(
  params: SendAspirasiEmailParams
): Promise<SendAspirasiEmailResult> {
  const webhookUrl = process.env.HIMASI_EMAIL_WEBHOOK_URL;
  const secretToken = process.env.HIMASI_EMAIL_SECRET_TOKEN;

  if (!webhookUrl || !secretToken) {
    const errorMsg =
      "Konfigurasi email webhook belum lengkap (HIMASI_EMAIL_WEBHOOK_URL / HIMASI_EMAIL_SECRET_TOKEN belum diatur).";
    console.warn(`[aspirasi-mailer] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }

  if (!params.to || !params.to.includes("@")) {
    return {
      success: false,
      error: `Alamat email tujuan tidak valid: ${params.to}`,
    };
  }

  const subject = `[HIMASI] Tanggapan Resmi Aspirasi #${params.nomorTiket}`;
  const htmlBody = generateAspirasiEmailHtml(params);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: secretToken,
        to: params.to.trim(),
        subject,
        htmlBody,
      }),
      redirect: "follow",
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Webhook Google merespons dengan HTTP ${response.status}: ${text}`,
      };
    }

    const result = (await response.json()) as { success?: boolean; message?: string; error?: string };

    if (result.success) {
      return {
        success: true,
        message: result.message || `Email berhasil dikirim ke ${params.to}`,
      };
    }

    return {
      success: false,
      error: result.error || "Gagal mengirim email melalui webhook Google",
    };
  } catch (err: unknown) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error("[aspirasi-mailer] Error saat memanggil webhook email:", err);
    return {
      success: false,
      error: `Koneksi ke server email gagal: ${errorDetail}`,
    };
  }
}
