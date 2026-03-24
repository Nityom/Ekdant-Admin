import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";

export const runtime = "nodejs";

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function resolveConvexUrl(): string {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  }
  return convexUrl;
}

function isValidAdminEmail(email: string): boolean {
  const allowedEmail = process.env.AUTH_LOGIN_EMAIL?.trim();
  if (!allowedEmail) throw new Error("Missing AUTH_LOGIN_EMAIL");
  return email === allowedEmail;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const otp = String(body?.otp || "").trim();
    const otpSessionId = String(body?.otpSessionId || "").trim();

    if (!email || !otp || !otpSessionId) {
      return NextResponse.json(
        { message: "Email, OTP and otpSessionId are required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(otp)) {
      return NextResponse.json({ message: "OTP must be a 4-digit code." }, { status: 400 });
    }

    if (!isValidAdminEmail(email)) {
      return NextResponse.json({ message: "Invalid login email." }, { status: 401 });
    }

    const convex = new ConvexHttpClient(resolveConvexUrl());
    const verifyOtpFn = "auth:verifyOtpSession" as unknown as Parameters<
      ConvexHttpClient["mutation"]
    >[0];
    const result = (await convex.mutation(verifyOtpFn, {
      session_id: otpSessionId,
      login_email: email,
      otp_hash: hashOtp(otp),
    })) as {
      verified: boolean;
      reason: string;
    };

    if (!result?.verified) {
      if (result?.reason === "expired") {
        return NextResponse.json({ message: "OTP expired" }, { status: 400 });
      }
      if (result?.reason === "too_many_attempts") {
        return NextResponse.json(
          { message: "Too many invalid OTP attempts. Request a new OTP." },
          { status: 400 }
        );
      }
      if (result?.reason === "already_used") {
        return NextResponse.json(
          { message: "This OTP has already been used. Request a new OTP." },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email,
        role: "admin",
      },
      sessionTtlMs: 12 * 60 * 60 * 1000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
