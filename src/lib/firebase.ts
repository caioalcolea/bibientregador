// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Removed: import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// !! ========================================================================
// !! Environment Variable Configuration Notice
// !! ========================================================================
// !! This application now uses both Firebase (Firestore) and Supabase.
// !! Ensure the following variables are correctly set in your `.env.local` file:
// !!
// !! --- Firebase Firestore Configuration ---
// !! NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
// !! NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
// !! NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
// !! NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
// !! NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
// !! NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
// !!
// !! --- Supabase Configuration ---
// !! NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
// !! NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
// !!
// !! After adding or modifying these variables, **RESTART your development server**
// !! (Ctrl+C in the terminal, then `npm run dev` or `yarn dev`).
// !! ========================================================================


// --- Firebase Configuration ---
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// --- Supabase Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


// --- Validate Required Firebase Variables ---
if (!firebaseApiKey) {
    console.error("🔥🔥🔥 FATAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined.");
    console.error("🔥🔥🔥 Please ensure it is set correctly in your .env.local file and you have restarted the server.");
    // Consider throwing an error depending on how critical Firestore is
}
// Add similar checks for other required Firebase config if necessary

const firebaseConfig = {
  apiKey: firebaseApiKey || "MISSING_API_KEY", // Fallback only if not throwing
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

// --- Validate Required Supabase Variables ---
if (!supabaseUrl) {
    console.error("🔥🔥🔥 FATAL ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing or undefined.");
    console.error("🔥🔥🔥 Please ensure it is set correctly in your .env.local file and you have restarted the server.");
}
if (!supabaseAnonKey) {
    console.error("🔥🔥🔥 FATAL ERROR: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing or undefined.");
    console.error("🔥🔥🔥 Please ensure it is set correctly in your .env.local file and you have restarted the server.");
}

// Initialize Firebase App (Singleton Pattern) - For Firestore/Functions
function initializeFirebaseAppIfNeeded(): FirebaseApp {
    if (!getApps().length) {
        console.log("Attempting to initialize Firebase App (for Firestore/Functions)...");
        try {
            const app = initializeApp(firebaseConfig);
            console.log("Firebase App initialized successfully.");
            return app;
        } catch (initError: any) {
            console.error("🔥🔥🔥 Firebase App Initialization Failed:", initError);
            // Handle specific errors if needed
            throw initError; // Re-throw if critical
        }
    } else {
        return getApp(); // Get the already initialized app
    }
}

// Initialize Supabase Client (Singleton Recommended)
let supabaseSingleton: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!supabaseSingleton) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // This case should be caught by the initial checks, but adding a safeguard
             console.error("🔥🔥🔥 Supabase URL or Anon Key is missing during client initialization. Cannot proceed.");
             // Returning a dummy or throwing might be options, throwing is safer
             throw new Error("Supabase configuration is incomplete.");
        }
        console.log("Attempting to initialize Supabase client...");
        supabaseSingleton = createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized successfully.");
    }
    return supabaseSingleton;
}


// --- Initialize and Export Services ---
let app: FirebaseApp | null = null;
// Removed: let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let supabase: SupabaseClient | null = null;

try {
  // Initialize Firebase for Firestore/Functions
  app = initializeFirebaseAppIfNeeded();
  if (app) {
      db = getFirestore(app);
      functions = getFunctions(app);
      console.log("Firebase SDKs (Firestore, Functions) obtained.");
  } else {
      console.error("🔥🔥🔥 Firebase App is null after initialization attempt. Firestore/Functions services cannot be obtained.");
  }

  // Initialize Supabase
  supabase = getSupabaseClient();

} catch (error) {
     console.error("🔥🔥🔥 Critical error during Firebase/Supabase setup:", error);
     app = null;
     db = null;
     functions = null;
     supabase = null; // Ensure Supabase is also null on error
}

// Export the initialized services. Consumers should check for null.
export { app, db, functions, supabase };
