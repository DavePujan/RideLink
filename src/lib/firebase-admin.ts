import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'artful-hope-13bk6';

const app = getApps().length === 0 
  ? initializeApp({ projectId }) 
  : getApp();

export const adminAuth = getAuth(app);

