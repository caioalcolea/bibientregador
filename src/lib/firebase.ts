
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
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
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

// Log the API key value as seen by the server/build process for debugging
console.log("Firebase Config Check (firebase.ts): NEXT_PUBLIC_FIREBASE_API_KEY =", apiKey ? `"${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}"` : "NOT FOUND/UNDEFINED"); // Log truncated key


// --- Validate Required Variables ---
if (!apiKey) {
    console.error("🔥🔥🔥 FATAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined.");
    console.error("🔥🔥🔥 Please ensure it is set correctly in your .env.local file and you have restarted the server.");
    // Optionally, throw an error to prevent the app from trying to initialize Firebase without a key.
    // This might be too aggressive depending on the setup, but helpful for debugging.
    throw new Error("Firebase API Key is missing. Check server logs and .env.local.");
}
if (!authDomain) console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing.");
if (!projectId) console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
// Add checks for other essential variables if needed


const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId // Optional, for Analytics
};

// Initialize Firebase
let app;
// Check if Firebase has already been initialized to prevent errors
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App initialized successfully.");
  } catch (initError: any) {
    console.error("🔥🔥🔥 Firebase App Initialization Failed:", initError);
    // Provide specific feedback if it's an invalid config issue during init
    if (initError.message?.includes('invalid-api-key') || initError.code === 'auth/invalid-api-key') {
       console.error("🔥🔥🔥 Initialization failed specifically due to invalid API key. Double-check the key value and authorized domains in Firebase Console and .env.local.");
    }
    throw initError; // Re-throw after logging
  }
} else {
  app = getApp(); // Get the already initialized app
  console.log("Firebase App already initialized. Reusing existing instance.");
}

// Log loaded config keys status *after* potential initialization
console.log("Firebase Config Status Check (Post-Init):", {
    apiKeyProvided: !!firebaseConfig.apiKey,
    authDomainProvided: !!firebaseConfig.authDomain,
    projectIdProvided: !!firebaseConfig.projectId,
    storageBucketProvided: !!firebaseConfig.storageBucket,
    messagingSenderIdProvided: !!firebaseConfig.messagingSenderId,
    appIdProvided: !!firebaseConfig.appId,
});

// Initialize other Firebase services safely
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let functions: ReturnType<typeof getFunctions>;
let analytics: any = null; // Initialize analytics as null

try {
  // These functions usually don't throw if the app object is valid,
  // but the services might not work correctly if config was bad.
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
    // This block might catch errors if getAuth/getFirestore itself fails,
    // though usually the initializeApp error is the primary one.
    throw serviceError;
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
