import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Use environment variables for client-side Firebase config with safe local fallbacks
const env = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'artful-hope-13bk6',
  appId: env.VITE_FIREBASE_APP_ID || '1:727267137731:web:4ac515c505b29de29a6a76',
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAt0aZYy73BInvsTMt9bcARDUb8rSGTmys',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'artful-hope-13bk6.firebaseapp.com',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'artful-hope-13bk6.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '727267137731',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

