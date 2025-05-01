// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
// Uncomment if Analytics is needed and configured
// import { getAnalytics, isSupported } from "firebase/analytics";

// !! ========================================================================
// !! VERY IMPORTANT: READ THIS IF YOU SEE FIREBASE ERRORS
// !! ========================================================================
// !! The error "Firebase: Error (auth/invalid-api-key)" or the console message
// !! "FATAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing"
// !! means your Firebase environment variables are not configured correctly.
// !!
// !! TO FIX THIS:
// !! 1. CREATE/CHECK `.env.local` FILE:
// !!    - Make sure you have a file named `.env.local` in the *ROOT* directory
// !!      of your project (the same directory as `package.json`).
// !!
// !! 2. ADD FIREBASE CONFIG TO `.env.local`:
// !!    - Open `.env.local` and add the following lines, replacing the placeholders
// !!      with your *actual* Firebase project values:
// !!
// !!      NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
// !!      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
// !!      NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
// !!      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
// !!      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
// !!      NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
// !!      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional
// !!
// !!    - You can find these values in your Firebase project settings:
// !!      Project Settings (⚙️) > General > Your apps > Web app > SDK setup and configuration.
// !!
// !! 3. **RESTART YOUR DEVELOPMENT SERVER**:
// !!    - This is crucial! After saving changes to `.env.local`, STOP your
// !!      development server (Ctrl+C in the terminal) and RESTART it
// !!      (`npm run dev` or `yarn dev`). Next.js only reads `.env.local` on startup.
// !!
// !! 4. CHECK FIREBASE CONSOLE:
// !!    - Ensure the API key in `.env.local` matches the one in the Firebase console.
// !!    - Ensure `localhost` is listed under Authentication > Settings > Authorized domains.
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

// Debug log to show if the key is being read (logs only during build/server start or client load)
// console.log(`Firebase Config Check (firebase.ts): NEXT_PUBLIC_FIREBASE_API_KEY found: ${!!apiKey}`);


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
        console.log("Attempting to initialize Firebase App...");
        try {
            const app = initializeApp(firebaseConfig);
            console.log("Firebase App initialized successfully.");
            return app;
        } catch (initError: any) {
            console.error("🔥🔥🔥 Firebase App Initialization Failed:", initError);
            // Provide specific feedback if it's an invalid config issue during init
            if (initError.message?.includes('invalid-api-key') || initError.code === 'auth/invalid-api-key') {
                console.error("🔥🔥🔥 Initialization failed specifically due to invalid API key. Double-check the key value in .env.local and ensure the server was restarted.");
                console.error("🔥🔥🔥 Also verify 'localhost' is an authorized domain in your Firebase Authentication settings.");
            }
            // Depending on recovery strategy, you might return a dummy app or re-throw
            throw initError; // Re-throw after logging if initialization is critical
        }
    } else {
        // console.log("Firebase App already initialized. Reusing existing instance.");
        return getApp(); // Get the already initialized app
    }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let analytics: any = null; // Initialize analytics as null


try {
  app = initializeFirebaseApp();

  // Initialize other Firebase services safely, checking for app instance
  if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      functions = getFunctions(app);
      console.log("Firebase SDKs (Auth, Firestore, Functions) obtained.");

      // Initialize Analytics only on client-side and if supported
      // if (typeof window !== 'undefined') {
      //   isSupported().then((supported) => {
      //     if (supported) {
      //       analytics = getAnalytics(app as FirebaseApp); // Cast needed if app can be null initially
      //       console.log("Firebase Analytics initialized.");
      //     } else {
      //       console.log("Firebase Analytics is not supported in this environment.");
      //     }
      //   });
      // }
  } else {
      // This case should theoretically not be reached if initializeFirebaseApp throws on critical failure
      console.error("🔥🔥🔥 Firebase App is null after initialization attempt. Services cannot be obtained.");
  }

} catch (error) {
    // This catches errors from initializeFirebaseApp or getAuth/getFirestore/getFunctions
     console.error("🔥🔥🔥 Critical error during Firebase setup:", error);
     // Set services to null explicitly if initialization failed
     app = null;
     auth = null;
     db = null;
     functions = null;
}

// Export potentially null services. Consumers must handle the possibility of null.
export { app, auth, db, functions, analytics };

// Reminder comments are covered by the large block at the top