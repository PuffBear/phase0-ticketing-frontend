/**
 * Firebase Authentication Helpers
 *
 * Security notes:
 * - Firebase ID tokens are short-lived (1 hour). Firebase SDK auto-refreshes them in memory.
 * - We NEVER store tokens in localStorage or sessionStorage.
 * - getIdToken(true) forces a fresh token — use this before sending to backend.
 * - signOut() clears Firebase's in-memory session on this device.
 */

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { apiPost } from './api';
import type { User } from '../types';

/**
 * Signs in with Google via popup, then exchanges the Firebase ID token
 * with our backend to get the app session cookie.
 *
 * @returns The app User object from our backend
 * @throws Error with a user-friendly message on failure
 */
/** How long (ms) to wait for the Google popup before giving up. */
const GOOGLE_POPUP_TIMEOUT_MS = 90_000;

export async function signInWithGoogle(): Promise<User> {
    let firebaseUser: FirebaseUser;

    // Race the popup against a timeout so that if the user walks away
    // (closes the browser, switches tabs, never clicks anything) it doesn't
    // hang the UI in "Signing in..." for eternity.
    const popupPromise = signInWithPopup(auth, googleProvider);
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject({ code: 'auth/timeout' }),
            GOOGLE_POPUP_TIMEOUT_MS
        )
    );

    try {
        const result = await Promise.race([popupPromise, timeoutPromise]);
        firebaseUser = result.user;
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            throw new Error('Sign-in cancelled.');
        }
        if (code === 'auth/timeout') {
            throw new Error('Sign-in timed out. Please try again.');
        }
        if (code === 'auth/popup-blocked') {
            throw new Error('Popup was blocked. Please allow popups for this site.');
        }
        if (code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection.');
        }
        throw new Error('Google sign-in failed. Please try again.');
    }

    // Force-refresh to get a fresh token (avoids sending a token that expires
    // during the network round-trip to our backend)
    const idToken = await firebaseUser.getIdToken(/* forceRefresh= */ true);

    // Exchange Firebase ID token for our app's session cookie
    const result = await apiPost<{ ok: boolean; user: User }>('/auth/firebase', { idToken });

    if (!result.ok || !result.user) {
        throw new Error('Authentication failed. Please try again.');
    }

    return result.user;
}

/**
 * Signs out from Firebase (clears in-memory token) and optionally
 * calls the backend logout to clear the session cookie.
 */
export async function signOutFirebase(): Promise<void> {
    try {
        await signOut(auth);
    } catch {
        // Non-critical: even if Firebase signOut fails, we still clear our cookie
    }
}

/**
 * Subscribes to Firebase auth state changes.
 * Returns an unsubscribe function.
 *
 * Note: This reflects Firebase's view of auth state (token validity).
 * Our app auth state is managed separately via the cookie-based /auth/me check.
 */
export function onFirebaseAuthStateChanged(
    callback: (user: FirebaseUser | null) => void
): () => void {
    return onAuthStateChanged(auth, callback);
}
