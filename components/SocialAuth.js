import { useState, useEffect } from 'react';
import {
  getFirebaseAuth,
  getFirebaseDb,
  createGoogleProvider,
  createFacebookProvider,
  createTwitterProvider,
  createAppleProvider,
} from '../lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SocialAuth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Check for redirect result on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
    if (!auth) return;

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          await handleUserAuth(user);
          if (onAuthSuccess) onAuthSuccess(user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        setError(error.message);
      }
    };
    handleRedirectResult();
  }, []);

  // Handle user authentication
  const handleUserAuth = async (user) => {
    const db = getFirebaseDb();
    if (!db) return user;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          provider: user.providerData?.[0]?.providerId || 'unknown',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          subscriptions: {
            dailyNewsletter: true,
            priceAlerts: true,
            forgePicks: true,
            marketUpdates: false,
            earningsReports: false,
          },
        });
      } else {
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }

      setUser(user);
      if (onAuthSuccess) onAuthSuccess(user);
      return user;
    } catch (error) {
      console.error('Error handling user auth:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign in with provider
  const signInWithProvider = async (providerFactory, providerName) => {
    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError('Firebase not initialized. Please refresh the page.');
        setLoading(false);
        return;
      }

      const provider = providerFactory();
      let result;

      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        if (popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupError;
      }

      const user = result.user;
      await handleUserAuth(user);

      if (onAuthSuccess) onAuthSuccess(user);
    } catch (error) {
      console.error(`Error signing in with ${providerName}:`, error);

      if (error.code === 'auth/operation-not-allowed') {
        setError(`${providerName} sign-in is not enabled in Firebase Console. Please enable it in Authentication → Sign-in methods.`);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const socialButtons = [
    {
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      ),
      bgColor: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-800',
      hoverTextColor: 'hover:text-gray-900',
      providerFactory: createGoogleProvider,
      providerName: 'Google',
    },
    {
      name: 'Apple',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      hoverTextColor: 'hover:text-white',
      providerFactory: createAppleProvider,
      providerName: 'Apple',
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877f2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bgColor: 'bg-[#1877f2] hover:bg-[#0d65d9]',
      textColor: 'text-white',
      hoverTextColor: 'hover:text-white',
      providerFactory: createFacebookProvider,
      providerName: 'Facebook',
    },
    {
      name: 'X',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      hoverTextColor: 'hover:text-white',
      providerFactory: createTwitterProvider,
      providerName: 'X',
    },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/30">
          ❌ {error}
        </div>
      )}

      {socialButtons.map((button) => (
        <button
          key={button.name}
          onClick={() => signInWithProvider(button.providerFactory, button.providerName)}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg font-medium transition ${button.bgColor} ${button.textColor} ${button.hoverTextColor} disabled:opacity-50`}
        >
          {button.icon}
          <span>Continue with {button.name}</span>
        </button>
      ))}

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0c1224] px-3 text-gray-500">or continue with email</span>
        </div>
      </div>

      {loading && (
        <div className="text-center text-cyan-400 text-sm animate-pulse">
          ⏳ Authenticating...
        </div>
      )}
    </div>
  );
}