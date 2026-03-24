import { mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_OTP_ATTEMPTS = 5;

export const createOtpSession = mutation({
  args: {
    login_email: v.string(),
    delivery_email: v.string(),
    otp_code: v.string(),
    otp_hash: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessionId = await ctx.db.insert("auth_otps", {
      login_email: args.login_email,
      delivery_email: args.delivery_email,
      otp_code: args.otp_code,
      otp_hash: args.otp_hash,
      expires_at: args.expires_at,
      created_at: now,
      used: false,
      attempts: 0,
    });

    return {
      sessionId,
      expiresAt: args.expires_at,
      otpCode: args.otp_code,
    };
  },
});

export const getOrCreateOtpSession = mutation({
  args: {
    login_email: v.string(),
    delivery_email: v.string(),
    otp_code: v.string(),
    otp_hash: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing active OTP for this email
    const existing = await ctx.db
      .query("auth_otps")
      .withIndex("by_login_email", (q) => q.eq("login_email", args.login_email))
      .collect();

    for (const session of existing) {
      // Only reuse sessions that have otp_code field (new records)
      if (!session.used && session.expires_at > now && session.otp_code) {
        // Found active, non-expired OTP with code - return it
        return {
          sessionId: session._id,
          expiresAt: session.expires_at,
          otpCode: session.otp_code,
          isExisting: true,
        };
      }
    }

    // No valid existing OTP found, create new one
    const sessionId = await ctx.db.insert("auth_otps", {
      login_email: args.login_email,
      delivery_email: args.delivery_email,
      otp_code: args.otp_code,
      otp_hash: args.otp_hash,
      expires_at: args.expires_at,
      created_at: now,
      used: false,
      attempts: 0,
    });

    return {
      sessionId,
      expiresAt: args.expires_at,
      otpCode: args.otp_code,
      isExisting: false,
    };
  },
});

export const invalidateActiveOtpSessions = mutation({
  args: {
    login_email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("auth_otps")
      .withIndex("by_login_email", (q) => q.eq("login_email", args.login_email))
      .collect();

    let invalidated = 0;
    for (const session of sessions) {
      if (!session.used && session.expires_at > now) {
        await ctx.db.patch(session._id, {
          used: true,
          used_at: now,
        });
        invalidated += 1;
      }
    }

    return { invalidated };
  },
});

export const verifyOtpSession = mutation({
  args: {
    session_id: v.id("auth_otps"),
    login_email: v.string(),
    otp_hash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const otpDoc = await ctx.db.get(args.session_id);

    if (!otpDoc) {
      return { verified: false, reason: "session_not_found" as const };
    }

    if (otpDoc.login_email !== args.login_email) {
      return { verified: false, reason: "invalid_session" as const };
    }

    if (otpDoc.used) {
      return { verified: false, reason: "already_used" as const };
    }

    if (now > otpDoc.expires_at) {
      await ctx.db.patch(args.session_id, {
        used: true,
        used_at: now,
      });
      return { verified: false, reason: "expired" as const };
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      return { verified: false, reason: "too_many_attempts" as const };
    }

    if (otpDoc.otp_hash !== args.otp_hash) {
      const nextAttempts = otpDoc.attempts + 1;
      await ctx.db.patch(args.session_id, { attempts: nextAttempts });
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        return { verified: false, reason: "too_many_attempts" as const };
      }
      return { verified: false, reason: "invalid_otp" as const };
    }

    await ctx.db.patch(args.session_id, {
      used: true,
      used_at: now,
      attempts: otpDoc.attempts + 1,
    });

    return {
      verified: true,
      reason: "verified" as const,
    };
  },
});

export const cleanupExpiredOtps = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threshold = now - 24 * 60 * 60 * 1000;

    const expired = await ctx.db
      .query("auth_otps")
      .withIndex("by_expires_at", (q) => q.lt("expires_at", threshold))
      .collect();

    for (const otp of expired) {
      await ctx.db.delete(otp._id);
    }

    return { deleted: expired.length };
  },
});
