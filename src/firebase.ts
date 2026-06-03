import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Resolver la firma de TypeScript para import.meta.env
const metaEnv = (import.meta as any).env || {};

// Configuración provista en tu pestaña de Firebase SDK Config en tu video
const firebaseConfig = {
  apiKey: localStorage.getItem('tapp_firebase_api_key_override') || metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBudWAdEd0EwL-837L-mE7I-7Fm_B2n4I8",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "tappmusic-e9406.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "tappmusic-e9406",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "tappmusic-e9406.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "1002591783990",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:1002591783990:web:cd4725537c475f8df15c97"
};

// Inicializar la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Instancias de servicios exportados
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Funciones utilitarias exigidas para App.tsx
export function getFirebaseConfig() {
  return firebaseConfig;
}

export function updateFirebaseApiKey(newKey: string) {
  if (!newKey) return;
  localStorage.setItem('tapp_firebase_api_key_override', newKey.trim());
  window.location.reload();
}

// ---- FIRESTORE DETECTOR DE ERRORES EXIGIDO ----
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
