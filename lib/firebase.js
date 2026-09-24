import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mrktforge.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mrktforge",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app = null;
let _auth = null;
let _db = null;

function getFirebaseApp() {
  if (typeof window === 'undefined') return null;
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth() {
  if (typeof window === 'undefined') return null;
  if (!_auth) {
    const app = getFirebaseApp();
    if (app) _auth = getAuth(app);
  }
  return _auth;
}

export function getFirebaseDb() {
  if (typeof window === 'undefined') return null;
  if (!_db) {
    const app = getFirebaseApp();
    if (app) _db = getFirestore(app);
  }
  return _db;
}

// Provider factories — called inside signIn functions, so they only run in browser
export function createGoogleProvider() {
  return new GoogleAuthProvider();
}

export function createFacebookProvider() {
  return new FacebookAuthProvider();
}

export function createTwitterProvider() {
  return new TwitterAuthProvider();
}

export function createAppleProvider() {
  return new OAuthProvider('apple.com');
}