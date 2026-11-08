import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendAuthEmail, type AuthEmailActionType } from "@/lib/email/auth-mailer";
import { maskEmail } from "@/lib/utils/mask-email";

/**
 * Memverifikasi keabsahan request dari Supabase Auth Hook.
 * Mendukung spesifikasi Standard Webhooks (Svix) dengan awalan secret 'v1,whsec_'
 * serta fallback otorisasi header Bearer.
 */
function verifyWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): boolean {
  try {
    const signatureHeader = headers.get("webhook-signature");
    const msgId = headers.get("webhook-id");
    const timestamp = headers.get("webhook-timestamp");

    // Jika Supabase mengirimkan header Standard Webhooks (webhook-signature, webhook-id, webhook-timestamp)
    if (signatureHeader && msgId && timestamp) {
      const cleanSecret = secret.startsWith("v1,whsec_")
        ? secret.slice(9)
        : secret;
      const key = Buffer.from(cleanSecret, "base64");

      const signedPayload = `${msgId}.${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac("sha256", key)
        .update(signedPayload)
        .digest("base64");

      // signatureHeader berisi daftar signature yang dipisahkan spasi (misal: "v1,abc... v1,xyz...")
      const signatures = signatureHeader.split(" ");
      for (const item of signatures) {
        const parts = item.split(",");
        if (parts.length === 2 && parts[0] === "v1") {
          const sig = parts[1];
          if (
            sig.length === expectedSignature.length &&
            crypto.timingSafeEqual(
              Buffer.from(sig),
              Buffer.from(expectedSignature)
            )
          ) {
            return true;
          }
        }
      }
      return false;
    }

    // Fallback: Memeriksa header otorisasi biasa (Bearer / custom token)
    const authHeader = headers.get("authorization") || "";
    const customSecretHeader =
      headers.get("x-supabase-webhook-secret") ||
      headers.get("x-hook-secret") ||
      "";

    const tokenFromBearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    return tokenFromBearer === secret || customSecretHeader === secret;
  } catch (err) {
    console.error("[api/auth/send-email] Gagal memverifikasi signature webhook:", err);
    return false;
  }
}

/**
 * POST /api/auth/send-email
 * 
 * Endpoint Handler untuk Supabase Auth "Send Email" Hook
 * Menerima payload saat Supabase memicu tindakan autentikasi (Invite User,
 * Password Recovery/Reset, Confirm Signup, Magic Link, atau Email Change),
 * lalu merender email resmi HIMASI dan mengirimkannya via Google Apps Script Webhook Relay.
 */
export async function POST(request: Request) {
  try {
    // 1. Baca Raw Body (Dibutuhkan untuk verifikasi HMAC signature yang presisi)
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json(
        { success: false, error: "Gagal membaca body request." },
        { status: 400 }
      );
    }

    // 2. Validasi Token / Secret Hook (Jika Dikonfigurasi di Environment)
    const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
    if (hookSecret) {
      const isAuthorized = verifyWebhookSignature(rawBody, request.headers, hookSecret);
      if (!isAuthorized) {
        console.warn("[api/auth/send-email] Peringatan: Akses ditolak, secret hook/signature tidak valid.");
        return NextResponse.json(
          { success: false, error: "Akses ditolak: Secret hook atau signature tidak valid." },
          { status: 401 }
        );
      }
    }

    // 3. Parsing JSON Payload
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Format request tidak valid (Harus berformat JSON)." },
        { status: 400 }
      );
    }

    // 4. Ekstraksi Data (Mendukung Supabase Send Email Hook & Direct Dispatch Format)
    const user = body?.user || {};
    const emailData = body?.email_data || {};

    const targetEmail: string = (
      user?.email ||
      body?.to ||
      body?.email ||
      ""
    ).trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Alamat email tujuan tidak valid atau tidak ditemukan dalam payload." },
        { status: 400 }
      );
    }

    const actionType: AuthEmailActionType =
      emailData?.email_action_type || body?.actionType || "invite";

    const fullName: string = (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.nama_lengkap ||
      body?.fullName ||
      ""
    ).trim();

    const role: string = (
      user?.user_metadata?.role ||
      body?.role ||
      ""
    ).trim();

    // 5. Pembentukan Tautan Verifikasi / Tindakan
    let actionLink: string = (body?.actionLink || "").trim();

    if (!actionLink) {
      const supabaseUrl = (
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rtbtgmtxyhljbltroyra.supabase.co"
      ).replace(/\/$/, "");

      const siteUrl = (
        process.env.NEXT_PUBLIC_SITE_URL || "https://himasi-isb.org"
      ).replace(/\/$/, "");

      // Prioritaskan token_hash bawaan GoTrue Supabase
      const token = emailData?.token_hash || emailData?.token || "";
      const defaultRedirect = `${siteUrl}/login`;
      const redirectTo = emailData?.redirect_to || defaultRedirect;

      if (token) {
        actionLink = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(
          token
        )}&type=${encodeURIComponent(actionType)}&redirect_to=${encodeURIComponent(
          redirectTo
        )}`;
      } else {
        actionLink = redirectTo;
      }
    }

    const masked = maskEmail(targetEmail);
    console.log(
      `[api/auth/send-email] Memproses pengiriman email auth: Tipe=${actionType} | Penerima=${masked}`
    );

    // 6. Eksekusi Pengiriman via Google Apps Script Webhook Relay
    const emailResult = await sendAuthEmail({
      to: targetEmail,
      actionType,
      actionLink,
      fullName: fullName || undefined,
      role: role || undefined,
    });

    if (emailResult.success) {
      console.log(
        `[api/auth/send-email] ✓ Berhasil dikirim ke ${masked}: ${emailResult.message}`
      );
      return NextResponse.json({
        success: true,
        message: `Email autentikasi (${actionType}) berhasil dikirim ke ${masked}`,
      });
    } else {
      console.error(
        `[api/auth/send-email] ✗ Gagal dikirim ke ${masked}: ${emailResult.error}`
      );
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Gagal mengirimkan email autentikasi.",
        },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[api/auth/send-email] Error internal:", err);
    return NextResponse.json(
      { success: false, error: `Kesalahan internal server: ${errorMsg}` },
      { status: 500 }
    );
  }
}
