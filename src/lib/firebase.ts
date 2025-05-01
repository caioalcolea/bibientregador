
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
// Uncomment if Analytics is needed and configured
// import { getAnalytics, isSupported } from "firebase/analytics";

// !! ========================================================================
// !! IMPORTANT: TROUBLESHOOTING "Firebase: Error (auth/invalid-api-key)"
// !! ========================================================================
// !! If you are seeing this error, please perform the following checks:
// !!
// !! 1. CHECK .env.local FILE:
// !!    - Ensure you have a file named `.env.local` in the *root* of your project directory.
// !!    - Verify that the following line exists in `.env.local` and that the key is correct:
// !!      NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
// !!    - Make sure there are no typos and the key is enclosed in quotes if it contains special characters,
// !!      though typically quotes are not needed unless there are spaces.
// !!
// !! 2. CHECK FIREBASE CONSOLE:
// !!    - Go to your Firebase project console: https://console.firebase.google.com/
// !!    - Navigate to Project Settings (click the gear icon ⚙️) -> General tab.
// !!    - Scroll down to "Your apps".
// !!    - Find your Web app configuration.
// !!    - Confirm that the `apiKey` listed there *exactly* matches the value you put in `.env.local`.
// !!
// !! 3. CHECK AUTHORIZED DOMAINS:
// !!    - In the Firebase console, navigate to Authentication -> Settings tab -> Authorized domains.
// !!    - Ensure that the domain you are running your app on (e.g., `localhost`, `your-deployment-domain.com`)
// !!      is listed. If running locally, `localhost` usually needs to be added explicitly.
// !!
// !! 4. RESTART YOUR DEVELOPMENT SERVER:
// !!    - After creating or modifying `.env.local`, you MUST restart your Next.js development server
// !!      (stop the `npm run dev` or `yarn dev` process and run it again). Environment variables
// !!      are loaded at build/start time.
// !! ========================================================================


// --- Pre-check Environment Variables ---
// Access environment variables safely, ensuring they are read correctly on both server and client.
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

// Log the API key value as seen by the process for debugging
// Use typeof window !== 'undefined' to differentiate client/server logs if needed
// console.log(`Firebase Config Check (firebase.ts - ${typeof window !== 'undefined' ? 'Client' : 'Server'}): NEXT_PUBLIC_FIREBASE_API_KEY =`, apiKey ? `"${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}"` : "NOT FOUND/UNDEFINED"); // Log truncated key


// --- Validate Required Variables ---
if (!apiKey) {
    // This console.error IS the guidance. If you see this, fix your .env.local
    console.error("🔥🔥🔥 FATAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined.");
    console.error("🔥🔥🔥 Please ensure it is set correctly in your .env.local file and you have restarted the server.");
    // Throwing an error might be too disruptive depending on where firebase is imported.
    // Logging the error clearly is often sufficient for developers to fix their env.
    // Consider throwing ONLY if Firebase absolutely cannot function without it immediately.
    // throw new Error("Firebase API Key is missing. Check console logs and .env.local.");
}
// Optional: Add warnings for other missing variables if they are critical but maybe recoverable
// if (!authDomain) console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing.");
// if (!projectId) console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");


const firebaseConfig = {
  apiKey: apiKey || "MISSING_API_KEY", // Provide a fallback to avoid crash IF you didn't throw above
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId // Optional, for Analytics
};

// Initialize Firebase App (Singleton Pattern)
function initializeFirebaseApp(): FirebaseApp {
    if (!getApps().length) {
        try {
            const app = initializeApp(firebaseConfig);
            console.log("Firebase App initialized successfully.");
            return app;
        } catch (initError: any) {
            console.error("🔥🔥🔥 Firebase App Initialization Failed:", initError);
            // Provide specific feedback if it's an invalid config issue during init
            if (initError.message?.includes('invalid-api-key') || initError.code === 'auth/invalid-api-key') {
                console.error("🔥🔥🔥 Initialization failed specifically due to invalid API key. Double-check the key value and authorized domains in Firebase Console and .env.local.");
            }
            // Depending on recovery strategy, you might return a dummy app or re-throw
            throw initError; // Re-throw after logging if initialization is critical
        }
    } else {
        console.log("Firebase App already initialized. Reusing existing instance.");
        return getApp(); // Get the already initialized app
    }
}

const app: FirebaseApp = initializeFirebaseApp();

// Initialize other Firebase services safely, checking for API key presence
let auth: Auth;
let db: Firestore;
let functions: Functions;
let analytics: any = null; // Initialize analytics as null

// Only initialize services if the API key was present (or handle appropriately)
if (apiKey) {
    try {
        auth = getAuth(app);
        db = getFirestore(app);
        functions = getFunctions(app);
        console.log("Firebase SDKs (Auth, Firestore, Functions) obtained.");

        // Initialize Analytics only on client-side and if supported
        // if (typeof window !== 'undefined') {
        //   isSupported().then((supported) => {
        //     if (supported) {
        //       analytics = getAnalytics(app);
        //       console.log("Firebase Analytics initialized.");
        //     } else {
        //       console.log("Firebase Analytics is not supported in this environment.");
        //     }
        //   });
        // }
    } catch (serviceError: any) {
        console.error("🔥🔥🔥 Error obtaining Firebase service instances:", serviceError);
        // If services fail to initialize even with an app, it might indicate deeper config issues
        // Ensure the app instance is valid before trying to get services
        if (!app) {
             console.error("🔥🔥🔥 Cannot initialize Firebase services because Firebase App failed to initialize.");
        }
         // Depending on needs, you might assign null or throw
         // Assigning null might require checks wherever auth/db/functions are used
         // auth = null as any; db = null as any; functions = null as any; // Example if allowing app to continue degraded
         throw serviceError; // Or re-throw if services are essential
    }
} else {
    // Handle the case where API Key was missing and services cannot be initialized
    console.warn("Firebase services (Auth, Firestore, Functions) NOT initialized due to missing API Key.");
    // Assign null or dummy objects if the rest of the app needs to handle this possibility
    auth = null as any; // Requires checking for auth existence before use elsewhere
    db = null as any;   // Requires checking for db existence before use elsewhere
    functions = null as any; // Requires checking for functions existence before use elsewhere
}


export { app, auth, db, functions, analytics };

// Reminder: Ensure you have created a .env.local file in the root of your project
// and added your Firebase project configuration details there:
// NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
// NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
// NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id" // Optional
