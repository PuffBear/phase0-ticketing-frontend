/**
 * Firebase Frontend SDK Initialization
 *
 * Security: All config values are public-safe (Firebase Web Config is designed to be public).
 * The actual security enforcement happens on Firebase Rules + our backend verification.
 * Tokens are NEVER stored in localStorage — Firebase manages them in memory.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required config at startup
const missingVars = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
    console.error('❌ Missing Firebase config env vars:', missingVars.join(', '));
}

// Prevent duplicate app initialization (happens in dev HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Configure Google provider with prompt to always show account chooser
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
