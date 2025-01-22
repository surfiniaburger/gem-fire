/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default function AuthComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const CLOUD_RUN_URL = 'https://mlb-1011675918473.us-central1.run.app';

  // Handle the authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // Verify the token with your Cloud Run service
          const response = await fetch(`${CLOUD_RUN_URL}/?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to authenticate with the server');
          }

          // If successful, redirect to the main application
          window.location.href = `${CLOUD_RUN_URL}/?token=${encodeURIComponent(token)}`;
        } catch (error) {
          setError('Authentication failed with the server');
          console.error('Server authentication error:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      analytics && logEvent(analytics, 'login_attempt');

      const provider = new GoogleAuthProvider();
      // Add scopes required by Identity Platform
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      //const result = await signInWithPopup(auth, provider);
      analytics && logEvent(analytics, 'login_success', {
        method: 'google'
      });
    } catch (error) {
      analytics && logEvent(analytics, 'login_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      setError('Sign in failed. Please try again.');
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Welcome to the MLB App</h1>
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Sign In with Google'}
      </button>
    </main>
  );
}