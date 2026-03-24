import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const runtime = "nodejs";

const OTP_VALIDITY_MS = 12 * 60 * 60 * 1000;

function createOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function resolveConvexUrl(): string {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  return convexUrl;
}

function getDeliveryEmail(): string {
  const deliveryEmail = process.env.AUTH_OTP_TO_EMAIL?.trim();
  if (!deliveryEmail) throw new Error("Missing AUTH_OTP_TO_EMAIL");
  return deliveryEmail;
}

function isValidAdminCredentials(email: string, password: string): boolean {
  const allowedEmail = process.env.AUTH_LOGIN_EMAIL?.trim();
  if (!allowedEmail) throw new Error("Missing AUTH_LOGIN_EMAIL");
  const allowedPassword = process.env.AUTH_LOGIN_PASSWORD || "Admin@123";
  return email === allowedEmail && password === allowedPassword;
}

function createMailer() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) throw new Error("Missing SMTP_USER or SMTP_PASS for OTP email delivery");

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });
}

function buildOtpEmailHtml(otpCode: string, deliveryEmail: string): string {
  const logoSrc = "https://ekdantdentalclinics.com/ekdant_logo-white.png";
  const digitBoxStyle =
    "display:inline-block;width:52px;height:62px;line-height:62px;" +
    "background:#ffffff;border:1.5px solid rgba(0,119,182,0.18);border-radius:12px;" +
    "font-family:Georgia,serif;font-size:30px;font-weight:700;color:#023E8A;" +
    "text-align:center;box-shadow:0 4px 12px rgba(2,62,138,0.08);margin:0 4px;";

  const digitBoxes = otpCode
    .split("")
    .map((d) => `<span style="${digitBoxStyle}">${d}</span>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Ekdant Admin OTP</title>
</head>
<body style="margin:0;padding:40px 20px;background:#e8f4fd;font-family:Arial,sans-serif;">

  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 16px 48px rgba(2,62,138,0.14);">

    <!-- Top gradient bar -->
    <div style="height:5px;background:linear-gradient(90deg,#00C9A7,#00B4D8,#0077B6);"></div>

    <!-- Header -->
    <div style="background:linear-gradient(150deg,#023E8A 0%,#0077B6 60%,#0096C7 100%);padding:36px 48px;text-align:center;">
      <img
        src="${logoSrc}"
        alt="Ekdant Dental Clinic"
        width="130"
        height="auto"
        style="display:block;margin:0 auto 16px;max-width:130px;height:auto;"
      />
      <p style="margin:0 0 10px;font-size:11px;color:rgba(255,255,255,0.88);letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">
        Secure Access
      </p>
      <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.62);letter-spacing:0.1em;text-transform:uppercase;font-weight:500;">
        Ekdant Dental Clinic
      </p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.1em;text-transform:uppercase;font-weight:500;">
        Admin Portal — Secure Login
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px 48px;">
      <p style="margin:0 0 6px;font-size:12px;color:#6b8299;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">
        One-Time Password
      </p>
      <h2 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a2e44;font-weight:700;">
        Your login OTP is ready
      </h2>

      <p style="margin:0 0 28px;font-size:14.5px;color:#4a6070;line-height:1.7;">
        Someone (hopefully you) requested access to the Ekdant admin dashboard.
        Use the code below to complete your sign-in.
        <strong>Do not share this code with anyone.</strong>
      </p>

      <!-- OTP card -->
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#F0F7FF 0%,#e0f0ff 100%);border:1.5px solid rgba(0,119,182,0.15);border-radius:16px;padding:28px 40px;">
          <p style="margin:0 0 14px;font-size:11px;color:#6b8299;letter-spacing:0.12em;text-transform:uppercase;">Your OTP Code</p>
          <div style="white-space:nowrap;">${digitBoxes}</div>
          <p style="margin:14px 0 0;font-size:12px;color:#6b8299;">
            Valid for <strong style="color:#0077B6;">12 hours</strong>
          </p>
        </div>
      </div>

      <!-- Security warning -->
      <div style="background:#fff8f0;border:1px solid rgba(255,150,50,0.2);border-left:3px solid #f0933a;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#8a5a2a;line-height:1.6;">
          🔒 <strong>Never share this OTP.</strong> Ekdant staff will never ask you for this code.
          If you didn't request this, please ignore this email — your account remains secure.
        </p>
      </div>

      <!-- Divider -->
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,119,182,0.12),transparent);margin:0 0 24px;"></div>

      <p style="margin:0;font-size:13px;color:#6b8299;line-height:1.7;">
        This OTP was sent to <strong>${deliveryEmail}</strong>.
        This is an automated message — please do not reply.
      </p>
    </div>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(90deg,#f7fbff,#f0f7ff);border-top:1px solid rgba(0,119,182,0.08);">
      <tr>
        <td style="padding:18px 48px;font-size:11.5px;color:#afc5d9;">Developed by Nityom Tikhe</td>
        <td style="padding:18px 48px;font-size:11.5px;color:#afc5d9;text-align:right;">© 2026 Ekdant Dental Clinic</td>
      </tr>
    </table>

    <!-- Bottom bar -->
    <div style="height:3px;background:linear-gradient(90deg,#00C9A7,#0077B6);"></div>

  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "").trim();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    if (!isValidAdminCredentials(email, password)) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const otpCode = createOtpCode();
    const expiresAt = Date.now() + OTP_VALIDITY_MS;
    const deliveryEmail = getDeliveryEmail();

    const convex = new ConvexHttpClient(resolveConvexUrl());

    const cleanupOtpFn = "auth:cleanupExpiredOtps" as unknown as Parameters<ConvexHttpClient["mutation"]>[0];
    const getOrCreateOtpFn = "auth:getOrCreateOtpSession" as unknown as Parameters<ConvexHttpClient["mutation"]>[0];

    await convex.mutation(cleanupOtpFn, {});

    const session = (await convex.mutation(getOrCreateOtpFn, {
      login_email: email,
      delivery_email: deliveryEmail,
      otp_code: otpCode,
      otp_hash: hashOtp(otpCode),
      expires_at: expiresAt,
    })) as { sessionId: string; expiresAt: number; otpCode: string; isExisting: boolean };

    const transporter = createMailer();
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "";

    await transporter.sendMail({
      from: senderEmail,
      to: deliveryEmail,
      subject: "Ekdant Admin Login OTP",
      text: `Your 4-digit OTP is ${session.otpCode}. It is valid for 12 hours.`,
      html: buildOtpEmailHtml(session.otpCode, deliveryEmail),
    });

    return NextResponse.json({
      success: true,
      otpSessionId: session?.sessionId,
      expiresAt: session.expiresAt,
      deliveryEmail,
      message: `OTP sent to ${deliveryEmail}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send OTP.";
    return NextResponse.json({ message }, { status: 500 });
  }
}