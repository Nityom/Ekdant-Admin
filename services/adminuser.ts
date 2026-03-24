type RequestOtpResponse = {
  success: boolean;
  otpSessionId: string;
  expiresAt: number;
  deliveryEmail: string;
  message: string;
};

type VerifyOtpResponse = {
  success: boolean;
  user: {
    email: string;
    role: string;
  };
  sessionTtlMs: number;
};

const AUTH_KEY = "isAuthenticated";
const AUTH_EMAIL_KEY = "authUserEmail";
const AUTH_EXPIRY_KEY = "authExpiryAt";

export const signUpWithEmail = async (_email: string, _password: string) => {
  void _email;
  void _password;
  return { success: true };
};

export const signInWithEmail = async (email: string, password: string): Promise<RequestOtpResponse> => {
  const response = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to request OTP.");
  }

  return data as RequestOtpResponse;
};

export const resendLoginOtp = async (email: string, password: string): Promise<RequestOtpResponse> => {
  return signInWithEmail(email, password);
};

export const verifyLoginOtp = async (
  email: string,
  otp: string,
  otpSessionId: string
): Promise<VerifyOtpResponse> => {
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp, otpSessionId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to verify OTP.");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_EXPIRY_KEY, String(Date.now() + data.sessionTtlMs));
  }

  return data as VerifyOtpResponse;
};

export const signOut = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    window.location.href = "/auth/login";
  }
};

export const getCurrentUser = async () => {
  if (typeof window !== "undefined") {
    const isAuth = localStorage.getItem(AUTH_KEY);
    const authEmail = localStorage.getItem(AUTH_EMAIL_KEY);
    const authExpiry = Number(localStorage.getItem(AUTH_EXPIRY_KEY) || 0);

    if (isAuth === "true" && authEmail && authExpiry > Date.now()) {
      return { email: authEmail, role: "admin", name: "Administrator" };
    }

    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  }
  return null;
};

export const resetPassword = async (_email: string) => {
  void _email;
  return { success: true };
};

export const updatePassword = async (_newPassword: string) => {
  void _newPassword;
  return { success: true };
};