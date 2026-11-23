import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  type Auth, 
  type UserCredential 
} from 'firebase/auth';
import type { FirebaseConfigSettings, CustomerUser } from '../types';

const STORAGE_KEY = 'nasamat_firebase_config_v1';
const LOCAL_ACCOUNTS_KEY = 'nasamat_local_accounts_v1';

export interface LocalAccountRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigSettings = {
  apiKey: "AIzaSyB-oSwRSvg5_QCzxSuGTbg3GzjiZWcE0yc",
  authDomain: "nasmat-95a51.firebaseapp.com",
  projectId: "nasmat-95a51",
  storageBucket: "nasmat-95a51.firebasestorage.app",
  messagingSenderId: "348453892318",
  appId: "1:348453892318:web:6164c908e0c42be8c0124f",
  measurementId: "G-WF38VF30F2",
  isFirebaseEnabled: true,
};

/**
 * Default empty or stored Firebase configuration
 */
export const loadFirebaseConfig = (): FirebaseConfigSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.apiKey.length > 10) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading firebase config from storage:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FIREBASE_CONFIG));
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: FirebaseConfigSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Trigger global event for components
    window.dispatchEvent(new CustomEvent('nasamat_firebase_config_updated', { detail: config }));
  } catch (err) {
    console.error('Error saving firebase config:', err);
  }
};

/**
 * Check if valid Firebase credentials are provided
 */
export const isFirebaseConfigured = (config?: FirebaseConfigSettings): boolean => {
  const c = config || loadFirebaseConfig();
  return Boolean(c.apiKey && c.apiKey.length > 5 && c.authDomain && c.projectId);
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export const getFirebaseInstance = (customConfig?: FirebaseConfigSettings): { app: FirebaseApp | null; auth: Auth | null } => {
  const config = customConfig || loadFirebaseConfig();

  if (!isFirebaseConfigured(config)) {
    return { app: null, auth: null };
  }

  try {
    if (getApps().length > 0) {
      cachedApp = getApp();
      cachedAuth = getAuth(cachedApp);
      return { app: cachedApp, auth: cachedAuth };
    }

    cachedApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    });
    cachedAuth = getAuth(cachedApp);
    return { app: cachedApp, auth: cachedAuth };
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
    return { app: cachedApp, auth: cachedAuth };
  }
};

/**
 * Sign In with Google via Real Firebase Auth Popup
 */
export const signInWithGoogleFirebase = async (): Promise<CustomerUser> => {
  const { auth } = getFirebaseInstance();

  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const credential: UserCredential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;

  const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'عميل جوجل';
  const email = fbUser.email || '';
  const photoURL = fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4285F4&color=fff&bold=true`;

  const customerUser: CustomerUser = {
    id: `fb-g-${fbUser.uid}`,
    name: displayName,
    email: email,
    phone: fbUser.phoneNumber || undefined,
    avatar: photoURL,
    provider: 'google',
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    segment: 'vip',
  };

  return customerUser;
};

/**
 * Sign In with Apple via Real Firebase OAuth Popup
 */
export const signInWithAppleFirebase = async (): Promise<CustomerUser> => {
  const { auth } = getFirebaseInstance();

  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  const credential: UserCredential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;

  const displayName = fbUser.displayName || 'عميل آبل';
  const email = fbUser.email || '';
  const photoURL = fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000&color=fff&bold=true`;

  const customerUser: CustomerUser = {
    id: `fb-a-${fbUser.uid}`,
    name: displayName,
    email: email,
    avatar: photoURL,
    provider: 'apple',
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    segment: 'vip',
  };

  return customerUser;
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async (): Promise<void> => {
  const { auth } = getFirebaseInstance();
  if (auth) {
    await fbSignOut(auth);
  }
};

/**
 * Helper to parse any pasted JavaScript or JSON config from Firebase Console:
 * Example input:
 * const firebaseConfig = {
 *   apiKey: "AIzaSy...",
 *   authDomain: "my-perfume.firebaseapp.com",
 *   projectId: "my-perfume",
 *   storageBucket: "my-perfume.firebasestorage.app",
 *   messagingSenderId: "123456789",
 *   appId: "1:12345:web:abcdef",
 * };
 */
export const parseFirebaseConfigSnippet = (snippet: string): Partial<FirebaseConfigSettings> => {
  const result: Partial<FirebaseConfigSettings> = {};
  if (!snippet) return result;

  const extractField = (key: string): string => {
    // Matches key: "value" or "key": "value" or 'key': 'value'
    const reg = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
    const match = snippet.match(reg);
    return match ? match[1].trim() : '';
  };

  result.apiKey = extractField('apiKey');
  result.authDomain = extractField('authDomain');
  result.projectId = extractField('projectId');
  result.storageBucket = extractField('storageBucket');
  result.messagingSenderId = extractField('messagingSenderId');
  result.appId = extractField('appId');
  result.measurementId = extractField('measurementId');

  return result;
};

// ================= LOCAL ACCOUNTS STORAGE (FALLBACK WHEN FIREBASE CONFIG IS PENDING) =================

export const getLocalAccounts = (): LocalAccountRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAccounts = (accounts: LocalAccountRecord[]): void => {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving local accounts:', err);
  }
};

// ================= EMAIL / PASSWORD AUTHENTICATION =================

/**
 * Sign in with Email and Password
 * Uses real Firebase Auth if configured; falls back gracefully to verified local accounts
 */
export const signInWithEmailFirebase = async (email: string, password: string): Promise<CustomerUser> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('MISSING_FIELDS');
  }

  const { auth } = getFirebaseInstance();

  if (auth && isFirebaseConfigured()) {
    try {
      const credential: UserCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = credential.user;
      const displayName = fbUser.displayName || cleanEmail.split('@')[0] || 'عميل نسمات';
      const photoURL = fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000&color=fff&bold=true`;

      return {
        id: `fb-e-${fbUser.uid}`,
        name: displayName,
        email: cleanEmail,
        phone: fbUser.phoneNumber || undefined,
        avatar: photoURL,
        provider: 'email',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        segment: 'vip',
      };
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/configuration-not-found') {
        console.warn('Firebase Auth service not yet started in Console. Falling back to local accounts.');
      } else {
        throw fbErr;
      }
    }
  }

  // Local Accounts Fallback
  const accounts = getLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (found) {
    if (found.passwordHash !== cleanPassword) {
      const err: any = new Error('WRONG_PASSWORD');
      err.code = 'auth/wrong-password';
      throw err;
    }

    return {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=000&color=fff&bold=true`,
      provider: 'email',
      registeredAt: found.createdAt,
      lastLoginAt: new Date().toISOString(),
      segment: 'vip',
    };
  }

  // If first time with this email in local fallback mode, register smoothly
  const newAccount: LocalAccountRecord = {
    id: `usr-email-${Date.now()}`,
    name: cleanEmail.split('@')[0],
    email: cleanEmail,
    passwordHash: cleanPassword,
    createdAt: new Date().toISOString(),
  };
  saveLocalAccounts([...accounts, newAccount]);

  return {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAccount.name)}&background=000&color=fff&bold=true`,
    provider: 'email',
    registeredAt: newAccount.createdAt,
    lastLoginAt: new Date().toISOString(),
    segment: 'vip',
  };
};

/**
 * Sign up a new customer with Email, Password and Name
 */
export const signUpWithEmailFirebase = async (
  email: string,
  password: string,
  displayName: string,
  phone?: string
): Promise<CustomerUser> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanPassword) {
    throw new Error('MISSING_FIELDS');
  }

  const { auth } = getFirebaseInstance();

  if (auth && isFirebaseConfigured()) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = credential.user;

      try {
        await updateProfile(fbUser, {
          displayName: cleanName,
        });
      } catch (e) {
        console.warn('Could not update Firebase displayName immediately:', e);
      }

      const photoURL = fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=000&color=fff&bold=true`;

      return {
        id: `fb-e-${fbUser.uid}`,
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim() || undefined,
        avatar: photoURL,
        provider: 'email',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        segment: 'vip',
      };
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/configuration-not-found') {
        console.warn('Firebase Auth service not yet started in Console. Falling back to local accounts.');
      } else {
        throw fbErr;
      }
    }
  }

  // Local Accounts Fallback
  const accounts = getLocalAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    const err: any = new Error('EMAIL_EXISTS');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const newAccount: LocalAccountRecord = {
    id: `usr-email-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    phone: phone?.trim() || undefined,
    passwordHash: cleanPassword,
    createdAt: new Date().toISOString(),
  };
  saveLocalAccounts([...accounts, newAccount]);

  return {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    phone: newAccount.phone,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAccount.name)}&background=000&color=fff&bold=true`,
    provider: 'email',
    registeredAt: newAccount.createdAt,
    lastLoginAt: new Date().toISOString(),
    segment: 'vip',
  };
};

/**
 * Reset password via Firebase Auth
 */
export const resetPasswordFirebase = async (email: string): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('MISSING_EMAIL');
  }

  const { auth } = getFirebaseInstance();
  if (auth && isFirebaseConfigured()) {
    await sendPasswordResetEmail(auth, cleanEmail);
  }
};

/**
 * Unified Firebase Error Formatter for Arabic and English
 */
export const formatFirebaseError = (err: any, isAr: boolean): string => {
  const code = err?.code || '';
  const message = err?.message || '';

  if (code === 'auth/configuration-not-found') {
    return isAr 
      ? 'خدمة المصادقة (Authentication) لم تُفعل بعد في كونسول Firebase! اضغط على زر "1. تفعيل Google & Email" بالأسفل ثم اضغط زر "Get started" في صفحة Firebase.' 
      : 'Authentication service is not enabled in Firebase Console yet. Please click "1. تفعيل Google & Email" and click "Get started".';
  }
  if (code === 'auth/popup-closed-by-user') {
    return isAr ? 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.' : 'Sign-in popup was closed by user.';
  }
  if (code === 'auth/popup-blocked') {
    return isAr ? 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة.' : 'Popup blocked by browser. Please allow popups.';
  }
  if (code === 'auth/unauthorized-domain') {
    return isAr 
      ? 'هذا النطاق (127.0.0.1) غير مصرح به في Firebase. للحل الفوري: افتح المتجر عبر http://localhost:5173/ (يعمل فوراً) أو أضف 127.0.0.1 في Authorized domains.' 
      : 'Domain (127.0.0.1) not authorized in Firebase. Instant fix: use http://localhost:5173/ or add 127.0.0.1 to Authorized Domains in Firebase Console.';
  }
  if (code === 'auth/user-not-found') {
    return isAr ? 'لم يتم العثور على أي حساب مسجل بهذا البريد الإلكتروني.' : 'No user found with this email.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return isAr ? 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.' : 'Invalid password or credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return isAr ? 'هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.' : 'Email is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return isAr ? 'كلمة المرور ضعيفة جداً. يرجى إدخال 6 أحرف أو أرقام على الأقل.' : 'Password should be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return isAr ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email format.';
  }
  if (code === 'auth/operation-not-allowed') {
    return isAr ? 'موفر تسجيل الدخول غير مفعّل في Firebase Console. يرجى تفعيله من قسم Authentication > Sign-in method.' : 'Sign-in provider is disabled in Firebase Console.';
  }
  if (code === 'FIREBASE_NOT_CONFIGURED') {
    return isAr ? 'يرجى ربط مفاتيح Firebase Console أولاً لتفعيل تسجيل الدخول السحابي.' : 'Please configure Firebase Console keys first.';
  }

  return message || (isAr ? 'حدث خطأ أثناء المصادقة، يرجى التحقق والمحاولة ثانية.' : 'Authentication error occurred.');
};
