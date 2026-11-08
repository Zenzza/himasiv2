/**
 * Layanan Pengiriman Email Autentikasi Pengurus HIMASI ISB Atma Luhur
 * Menggunakan Google Apps Script Webhook Relay Resmi
 * 
 * Menggantikan SMTP email personal untuk:
 * 1. Undangan Pengurus / Admin Baru (Invite User)
 * 2. Pemulihan & Atur Ulang Kata Sandi (Password Recovery / Reset)
 * 3. Verifikasi Pendaftaran & Tautan Masuk (Signup / Magiclink)
 * 
 * Desain: The Signature Split-Card (Homepage Homology)
 * Menyelaraskan identitas visual portal web himasiv2:
 * Gradien Midnight Navy (#00296E -> #00173d), Ambient Cyan Accent (#38BDF8 / #0094E0),
 * Floating Credential Pill Card, Soft Rounded 28px Container, dan Security Notice Card.
 */

export type AuthEmailActionType =
  | "invite"
  | "recovery"
  | "signup"
  | "magiclink"
  | "email_change"
  | string;

export interface SendAuthEmailParams {
  to: string;
  actionType: AuthEmailActionType;
  actionLink: string;
  fullName?: string;
  role?: string;
}

export interface SendAuthEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface ActionMeta {
  badgeLabel: string;
  title: string;
  subtitle: string;
  greetingHeader: string;
  mainMessage: string;
  ctaText: string;
  securityNotice: string;
  subject: string;
}

function getActionMeta(actionType: AuthEmailActionType, fullName?: string): ActionMeta {
  const nameGreeting = fullName ? fullName.trim() : "Pengurus HIMASI";

  switch (actionType) {
    case "invite":
      return {
        badgeLabel: "UNDANGAN PENGURUS BARU",
        title: "Aktivasi Akun Portal Pengurus HIMASI",
        subtitle: "Selamat bergabung di kepengurusan Kabinet REKSABUDAYA HIMASI ISB Atma Luhur.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Anda telah ditambahkan sebagai pengurus di sistem portal manajemen terpadu HIMASI ISB Atma Luhur. Silakan klik tombol di bawah untuk mengaktifkan akun Anda dan membuat kata sandi pertama Anda.",
        ctaText: "Aktivasi Akun & Buat Kata Sandi →",
        securityNotice:
          "Tautan aktivasi ini bersifat rahasia, berlaku selama 24 jam, dan hanya dapat digunakan 1 kali. Jangan bagikan tautan ini kepada siapa pun.",
        subject: "[HIMASI] Undangan Aktivasi Akun Portal Pengurus",
      };

    case "recovery":
      return {
        badgeLabel: "KEAMANAN & PEMULIHAN AKUN",
        title: "Permintaan Atur Ulang Kata Sandi",
        subtitle: "Akses pemulihan akun portal resmi pengurus HIMASI ISB Atma Luhur.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Kami menerima permintaan untuk mengatur ulang kata sandi akun portal pengurus Anda. Jika Anda yang mengajukan permintaan ini, silakan klik tombol di bawah untuk membuat kata sandi baru.",
        ctaText: "Atur Ulang Kata Sandi Sekarang →",
        securityNotice:
          "Tautan pemulihan ini berlaku selama 24 jam. Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini dengan aman. Kata sandi lama Anda tidak akan berubah.",
        subject: "[HIMASI] Permintaan Atur Ulang Kata Sandi Akun",
      };

    case "signup":
      return {
        badgeLabel: "KONFIRMASI PENDAFTARAN",
        title: "Verifikasi Alamat Email Anda",
        subtitle: "Konfirmasi pendaftaran akun sistem informasi HIMASI ISB Atma Luhur.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Terima kasih telah mendaftar di sistem informasi HIMASI ISB Atma Luhur. Silakan verifikasi alamat email Anda untuk mulai menggunakan layanan portal.",
        ctaText: "Konfirmasi Email Sekarang →",
        securityNotice:
          "Tautan verifikasi ini berlaku selama 24 jam. Jangan berikan tautan ini kepada pihak yang tidak berwenang.",
        subject: "[HIMASI] Konfirmasi Pendaftaran Akun",
      };

    case "magiclink":
      return {
        badgeLabel: "AUTENTIKASI SEKALI KLIK",
        title: "Tautan Masuk Portal Pengurus",
        subtitle: "Akses cepat masuk ke Dashboard HIMASI tanpa memasukkan kata sandi.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Gunakan tautan di bawah ini untuk langsung masuk ke sesi portal pengurus HIMASI ISB Atma Luhur.",
        ctaText: "Masuk ke Dashboard Pengurus →",
        securityNotice:
          "Tautan masuk ini hanya dapat digunakan satu kali dan akan kedaluwarsa secara otomatis dalam beberapa menit.",
        subject: "[HIMASI] Tautan Masuk Portal Pengurus",
      };

    case "email_change":
      return {
        badgeLabel: "PERUBAHAN EMAIL AKUN",
        title: "Konfirmasi Pembaruan Alamat Email",
        subtitle: "Pembaruan alamat email resmi akun portal pengurus HIMASI.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Kami mendeteksi permintaan pembaruan alamat email pada akun pengurus Anda. Silakan klik tombol di bawah untuk mengonfirmasi perubahan alamat email baru ini.",
        ctaText: "Konfirmasi Alamat Email Baru →",
        securityNotice:
          "Jika Anda tidak pernah mengajukan perubahan ini, segera hubungi Super Admin HIMASI untuk mengamankan akun Anda.",
        subject: "[HIMASI] Konfirmasi Perubahan Alamat Email Akun",
      };

    default:
      return {
        badgeLabel: "NOTIFIKASI SISTEM",
        title: "Verifikasi Keamanan Akun HIMASI",
        subtitle: "Tindakan autentikasi resmi portal HIMASI ISB Atma Luhur.",
        greetingHeader: `Halo ${nameGreeting},`,
        mainMessage:
          "Terdapat tindakan autentikasi yang memerlukan konfirmasi Anda. Silakan lanjutkan dengan mengklik tautan resmi di bawah ini.",
        ctaText: "Lanjutkan Tindakan →",
        securityNotice:
          "Demi keamanan, pastikan Anda hanya membuka tautan resmi yang diterbitkan oleh domain himasi-isb.org.",
        subject: "[HIMASI] Verifikasi Tindakan Akun",
      };
  }
}

/**
 * Membuat template email HTML responsif bermerek resmi HIMASI ISB Atma Luhur
 * untuk tindakan autentikasi (Invite & Password Recovery).
 */
export function generateAuthEmailHtml(params: SendAuthEmailParams): string {
  const meta = getActionMeta(params.actionType, params.fullName);
  const sanitizedTo = params.to.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sanitizedLink = params.actionLink.replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${meta.title} - HIMASI ISB Atma Luhur</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A; line-height: 1.6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  
  <!-- Outer Wrapper (Light Clean Slate Backdrop) -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Document Sheet (The Signature Split-Card, max-width 580px, rounded-28px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 20px 45px -10px rgba(0, 41, 110, 0.08); overflow: hidden;">
          
          <!-- GRADIENT BRANDING CARD HEADER (Identik dengan form-aspirasi & login beranda) -->
          <tr>
            <td style="background-color: #00296E; background-image: linear-gradient(135deg, #00296E 0%, #002257 55%, #00173d 100%); padding: 36px 32px 30px 32px; text-align: left;">

              <!-- Header Headline -->
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.3;">
                ${meta.title}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #CBD5E1; line-height: 1.5; font-weight: 400;">
                ${meta.subtitle}
              </p>

              <!-- Floating Recipient Pill Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 22px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 12px 18px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td valign="middle">
                          <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94A3B8; letter-spacing: 1px;">
                            Akun Penerima
                          </div>
                          <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 14px; font-weight: 700; color: #38BDF8; letter-spacing: 0.5px; margin-top: 2px;">
                            ${sanitizedTo}
                          </div>
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
            <td style="padding: 30px 32px 24px 32px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; color: #0F172A;">
                ${meta.greetingHeader}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13.5px; color: #475569; line-height: 1.65;">
                ${meta.mainMessage}
              </p>

              <!-- Call To Action Button (Prominent Midnight Navy Pill) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${sanitizedLink}" target="_blank" style="display: inline-block; background-color: #00296E; background-image: linear-gradient(135deg, #00296E 0%, #001f54 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(0, 41, 110, 0.25); letter-spacing: 0.2px;">
                      ${meta.ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Advisory Card (Soft Amber Card) -->
              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 18px; padding: 14px 18px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size: 16px; width: 24px; vertical-align: top; padding-right: 8px;">
                      &#9888;&#65039;
                    </td>
                    <td style="font-size: 11.5px; color: #92400E; line-height: 1.55; vertical-align: middle;">
                      <strong>Penting:</strong> ${meta.securityNotice}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Fallback Direct URL Box -->
              <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 16px; padding: 12px 16px; margin-bottom: 8px;">
                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Tautan Alternatif (Jika tombol tidak dapat diklik):
                </div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 11px; color: #0284C7; word-break: break-all; line-height: 1.5;">
                  <a href="${sanitizedLink}" target="_blank" style="color: #0284C7; text-decoration: underline;">${sanitizedLink}</a>
                </div>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; color: #64748B; font-size: 11px;">
              <div style="font-weight: 700; color: #00296E; font-size: 12px;">
                Himpunan Mahasiswa Sistem Informasi (HIMASI)
              </div>
              <div style="margin-bottom: 8px;">
                Institut Sains dan Bisnis (ISB) Atma Luhur Pangkalpinang
              </div>
              <div style="font-size: 10px; color: #94A3B8;">
                Email ini dikirimkan secara otomatis oleh sistem autentikasi resmi HIMASI.<br>Mohon jangan membalas langsung ke alamat ini.
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
 * Mengirimkan email autentikasi (Invite / Reset Password) ke alamat tujuan
 * via Google Apps Script Webhook Relay Resmi HIMASI
 */
export async function sendAuthEmail(
  params: SendAuthEmailParams
): Promise<SendAuthEmailResult> {
  const webhookUrl = process.env.HIMASI_EMAIL_WEBHOOK_URL;
  const secretToken = process.env.HIMASI_EMAIL_SECRET_TOKEN;

  if (!webhookUrl || !secretToken) {
    const errorMsg =
      "Konfigurasi email webhook belum lengkap (HIMASI_EMAIL_WEBHOOK_URL / HIMASI_EMAIL_SECRET_TOKEN belum diatur).";
    console.warn(`[auth-mailer] ${errorMsg}`);
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

  if (!params.actionLink) {
    return {
      success: false,
      error: "Tautan tindakan (actionLink) tidak boleh kosong.",
    };
  }

  const meta = getActionMeta(params.actionType, params.fullName);
  const subject = meta.subject;
  const htmlBody = generateAuthEmailHtml(params);

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

    const result = (await response.json()) as {
      success?: boolean;
      message?: string;
      error?: string;
    };

    if (result.success) {
      return {
        success: true,
        message: result.message || `Email autentikasi berhasil dikirim ke ${params.to}`,
      };
    }

    return {
      success: false,
      error: result.error || "Gagal mengirim email autentikasi melalui webhook Google",
    };
  } catch (err: unknown) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error("[auth-mailer] Error saat memanggil webhook email:", err);
    return {
      success: false,
      error: `Koneksi ke server email gagal: ${errorDetail}`,
    };
  }
}

