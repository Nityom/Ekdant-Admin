export const signUpWithEmail = async (email: string, password: string) => {
  return { success: true };
};

export const signInWithEmail = async (email: string, password: string) => {
  // Hardcoded values for login
  if (email === "admin@ekdant.com" && password === "Admin@123") {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', 'true');
    }
    return { success: true, user: { email, role: "admin" } };
  }

  throw new Error("Invalid credentials. Please use admin@ekdant.com / Admin@123");
};

export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/auth/login';
  }
};

export const getCurrentUser = async () => {
  if (typeof window !== 'undefined') {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === 'true') {
      return { email: "admin@ekdant.com", role: "admin", name: "Administrator" };
    }
  }
  return null;
};

// New function for password reset
export const resetPassword = async (email: string) => {
  return { success: true };
};

// New function to update password after reset
export const updatePassword = async (newPassword: string) => {
  return { success: true };
};