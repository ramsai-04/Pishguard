import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { type User } from "@/types";
import { firebaseAuth, getFirebaseAuthToken, googleProvider, isFirebaseClientConfigured } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  const clearLocalSession = () => {
    setUser(null);
    localStorage.removeItem("phishguard_user");
    localStorage.removeItem("phishguard_token");
    window.dispatchEvent(new Event("auth-changed"));
  };

  const syncFirebaseSession = async (): Promise<User> => {
    if (!apiBaseUrl) {
      throw new Error("API base URL is not configured");
    }
    const idToken = await getFirebaseAuthToken();
    if (!idToken) {
      throw new Error("Firebase user is not authenticated");
    }

    const response = await fetch(`${apiBaseUrl}/auth/firebase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(err?.message || "Firebase session sync failed");
    }

    const data = (await response.json()) as {
      user?: { id: string; name: string; email: string; createdAt: string };
    };

    if (!data.user) {
      throw new Error("Invalid session response");
    }

    const userData: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      createdAt: new Date(data.user.createdAt),
    };

    setUser(userData);
    localStorage.setItem("phishguard_user", JSON.stringify(userData));
    localStorage.setItem("phishguard_token", idToken);
    window.dispatchEvent(new Event("auth-changed"));
    return userData;
  };

  useEffect(() => {
    if (!apiBaseUrl || !isFirebaseClientConfigured || !firebaseAuth) {
      setIsLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearLocalSession();
        setIsLoading(false);
        return;
      }

      if (firebaseUser.email && !firebaseUser.emailVerified) {
        await signOut(firebaseAuth).catch(() => undefined);
        clearLocalSession();
        setIsLoading(false);
        return;
      }

      try {
        await syncFirebaseSession();
      } catch {
        clearLocalSession();
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, [apiBaseUrl]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!isFirebaseClientConfigured || !firebaseAuth) {
        throw new Error("Firebase client is not configured");
      }
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await cred.user.reload();
      if (cred.user.email && !cred.user.emailVerified) {
        await signOut(firebaseAuth);
        throw new Error("Email is not verified. Please verify your email first.");
      }
      await syncFirebaseSession();
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!isFirebaseClientConfigured || !firebaseAuth) {
        throw new Error("Firebase client is not configured");
      }
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await sendEmailVerification(cred.user);
      await signOut(firebaseAuth);
      clearLocalSession();
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!isFirebaseClientConfigured || !firebaseAuth) {
        throw new Error("Firebase client is not configured");
      }
      await signInWithPopup(firebaseAuth, googleProvider);
      await syncFirebaseSession();
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (firebaseAuth) {
      signOut(firebaseAuth).catch(() => undefined);
    }
    clearLocalSession();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
