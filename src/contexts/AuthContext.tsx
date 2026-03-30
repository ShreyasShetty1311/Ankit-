import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  authError: string | null;
  isDemoUser: boolean;
  /** Pass this to API calls — null when demo so ALL data is fetched */
  fetchUserId: string | null;
  signInWithGoogle: () => Promise<void>;
  enterDemo: () => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// Fixed demo identity shown in the UI
const DEMO_DISPLAY: AppUser = {
  uid: "__demo__",
  displayName: "Demo User",
  email: "demo@shortify.pro",
  photoURL: null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Real Google sign-in ────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will update firebaseUser automatically
    } catch (err: any) {
      const msg: string =
        err?.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled."
          : err?.code === "auth/unauthorized-domain"
          ? "This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains."
          : err?.code === "auth/operation-not-allowed"
          ? "Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google."
          : err?.message ?? "Sign-in failed. Please try again.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // ── One-click demo entry ────────────────────────────────────────────────────
  const enterDemo = () => {
    setIsDemoUser(true);
    setAuthError(null);
  };

  // ── Logout / exit demo ─────────────────────────────────────────────────────
  const logout = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
    } else {
      await signOut(auth);
      // onAuthStateChanged handles clearing firebaseUser
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  // The user object shown in the UI
  const user: AppUser | null = isDemoUser
    ? DEMO_DISPLAY
    : firebaseUser
    ? {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      }
    : null;

  // userId passed to API calls:
  // - Demo → null (no filter, shows all Firestore data)
  // - Real user → their Firebase uid (shows only their data)
  const fetchUserId: string | null = isDemoUser ? null : (firebaseUser?.uid ?? null);

  // Considered "logged in" if demo OR Firebase user exists
  const effectiveUser = isDemoUser || firebaseUser ? user : null;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        loading,
        authError,
        isDemoUser,
        fetchUserId,
        signInWithGoogle,
        enterDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
