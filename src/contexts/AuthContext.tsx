import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { provisionUserProfileIfMissing } from '../services/firestoreService';
import type { BusinessProfile, RegistrationMetadata, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  businessProfile: BusinessProfile | null;
  authReady: boolean;
  profileLoading: boolean;
  needsEmailVerification: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    meta: RegistrationMetadata
  ) => Promise<{ emailVerified: boolean }>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PENDING_REG_KEY = 'smartstock_pending_reg';

function savePendingReg(uid: string, meta: RegistrationMetadata) {
  try {
    sessionStorage.setItem(`${PENDING_REG_KEY}_${uid}`, JSON.stringify(meta));
  } catch {
    // Ignore storage restriction
  }
}

function loadPendingReg(uid: string): RegistrationMetadata | null {
  try {
    const raw = sessionStorage.getItem(`${PENDING_REG_KEY}_${uid}`);
    return raw ? (JSON.parse(raw) as RegistrationMetadata) : null;
  } catch {
    return null;
  }
}

function clearPendingReg(uid: string) {
  try {
    sessionStorage.removeItem(`${PENDING_REG_KEY}_${uid}`);
  } catch {
    // Ignore
  }
}

export function formatAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in your Firebase Console (Authentication → Sign-in method → Email/Password). Enable it in Firebase Console or continue with Google Sign-In.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const hydrateVerifiedUser = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    try {
      const pendingMeta = loadPendingReg(firebaseUser.uid);
      const { userProfile: uProf, businessProfile: bProf } = await provisionUserProfileIfMissing(
        firebaseUser,
        pendingMeta
      );
      clearPendingReg(firebaseUser.uid);
      setUserProfile(uProf);
      setBusinessProfile(bProf);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setBusinessProfile(null);
        setAuthReady(true);
        return;
      }

      if (firebaseUser.emailVerified) {
        try {
          await hydrateVerifiedUser(firebaseUser);
        } catch (err) {
          console.error('Profile hydration error:', err);
        }
      } else {
        setUserProfile(null);
        setBusinessProfile(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [hydrateVerifiedUser]);

  // Live listener on user & business profile once verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const userRef = doc(db, 'users', user.uid);
    const businessRef = doc(db, 'users', user.uid, 'business', 'primary');

    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`)
    );

    const unsubBusiness = onSnapshot(
      businessRef,
      (snap) => {
        if (snap.exists()) {
          setBusinessProfile(snap.data() as BusinessProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/business/primary`)
    );

    return () => {
      unsubUser();
      unsubBusiness();
    };
  }, [authReady, user]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user.emailVerified) {
      await hydrateVerifiedUser(cred.user);
    }
  }, [hydrateVerifiedUser]);

  const registerWithEmail = useCallback(
    async (email: string, password: string, meta: RegistrationMetadata) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: meta.fullName.trim() });
      savePendingReg(cred.user.uid, meta);
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        return { emailVerified: false };
      }
      await hydrateVerifiedUser(cred.user);
      return { emailVerified: true };
    },
    [hydrateVerifiedUser]
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user.emailVerified) {
      await hydrateVerifiedUser(cred.user);
    }
  }, [hydrateVerifiedUser]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active user session.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshVerificationStatus = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    const refreshed = auth.currentUser;
    setUser(refreshed);
    if (refreshed.emailVerified) {
      await hydrateVerifiedUser(refreshed);
      return true;
    }
    return false;
  }, [hydrateVerifiedUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setBusinessProfile(null);
  }, []);

  const needsEmailVerification = Boolean(user && !user.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        businessProfile,
        authReady,
        profileLoading,
        needsEmailVerification,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        refreshVerificationStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
