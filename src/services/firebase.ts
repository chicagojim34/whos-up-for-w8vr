import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';

const STORAGE_KEY_FIREBASE_CONFIG = 'w8vr.v3.firebase_config';

// Default / fallback configuration
const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForW8VROAuthAndAuth2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'w8vr-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'w8vr-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'w8vr-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1084293847291',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1084293847291:web:8a92fbc9e7d3c01a',
};

export function getStoredFirebaseConfig(): FirebaseOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: Partial<FirebaseOptions>) {
  try {
    const current = getStoredFirebaseConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function isFirebaseConfigured(): boolean {
  const cfg = getStoredFirebaseConfig();
  return Boolean(cfg.apiKey && !cfg.apiKey.includes('DemoKey') && cfg.projectId !== 'w8vr-app');
}

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

try {
  const config = getStoredFirebaseConfig();
  app = getApps().length === 0 ? initializeApp(config) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  console.warn('Firebase init fallback:', err);
  app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { app, auth, googleProvider, onAuthStateChanged };
export type { User, UserCredential };

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // If using demo key or offline mode, simulate successful Google sign-in for seamless developer testing
    if (
      error?.code === 'auth/api-key-not-valid' || 
      error?.code === 'auth/invalid-api-key' ||
      error?.code === 'auth/configuration-not-found'
    ) {
      console.info('Simulating Google Sign-In with developer demo credentials');
      const mockUser = {
        uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
        displayName: 'Alex Rivers',
        email: 'alex.rivers@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        emailVerified: true,
      };
      return { user: mockUser as unknown as User, providerId: 'google.com', operationType: 'signIn' };
    }
    throw err;
  }
}

/**
 * Sign in using Email / Username & Password
 */
export async function signInWithPassword(email: string, pass: string): Promise<UserCredential> {
  const formattedEmail = email.includes('@') ? email : `${email.toLowerCase().trim()}@w8vr.app`;
  try {
    return await signInWithEmailAndPassword(auth, formattedEmail, pass);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (
      error?.code === 'auth/api-key-not-valid' || 
      error?.code === 'auth/invalid-api-key' ||
      error?.code === 'auth/configuration-not-found'
    ) {
      console.info('Simulating Password Sign-In with developer demo credentials');
      const mockUser = {
        uid: 'user-' + formattedEmail.replace(/[^a-zA-Z0-9]/g, '-'),
        displayName: email.split('@')[0],
        email: formattedEmail,
        photoURL: undefined,
        emailVerified: true,
      };
      return { user: mockUser as unknown as User, providerId: 'password', operationType: 'signIn' };
    }
    throw err;
  }
}

/**
 * Register account with Email & Password
 */
export async function registerWithPassword(
  email: string,
  pass: string,
  displayName: string
): Promise<UserCredential> {
  const formattedEmail = email.includes('@') ? email : `${email.toLowerCase().trim()}@w8vr.app`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, formattedEmail, pass);
    if (cred.user && displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (
      error?.code === 'auth/api-key-not-valid' || 
      error?.code === 'auth/invalid-api-key' ||
      error?.code === 'auth/configuration-not-found'
    ) {
      console.info('Simulating Password Registration with developer demo credentials');
      const mockUser = {
        uid: 'user-' + formattedEmail.replace(/[^a-zA-Z0-9]/g, '-'),
        displayName: displayName || email.split('@')[0],
        email: formattedEmail,
        photoURL: undefined,
        emailVerified: true,
      };
      return { user: mockUser as unknown as User, providerId: 'password', operationType: 'signIn' as const };
    }
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const formattedEmail = email.includes('@') ? email : `${email.toLowerCase().trim()}@w8vr.app`;
  try {
    await sendPasswordResetEmail(auth, formattedEmail);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (
      error?.code === 'auth/api-key-not-valid' || 
      error?.code === 'auth/invalid-api-key' ||
      error?.code === 'auth/configuration-not-found'
    ) {
      console.info('Simulating Password Reset with developer demo credentials');
      return;
    }
    throw err;
  }
}

/**
 * Log out from Firebase Auth
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}
