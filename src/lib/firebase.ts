// src/lib/firebase.ts
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getFunctions } from "firebase/functions";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional, for Analytics
};

// Initialize Firebase
// let app;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp();
// }

// const auth = getAuth(app);
// const db = getFirestore(app);
// const functions = getFunctions(app);
// let analytics;
// if (typeof window !== 'undefined') {
//    analytics = getAnalytics(app); // Initialize Analytics only on client-side
// }


// Placeholder exports - uncomment and use the actual Firebase instances when configured
const auth = null;
const db = null;
const functions = null;
const analytics = null;

console.warn("Firebase configuration is not fully set up. Using placeholders.");
console.log("Firebase Config Used (Check Environment Variables):", {
    apiKey: firebaseConfig.apiKey ? 'Loaded' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'Loaded' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'Loaded' : 'MISSING',
    // Add other checks as needed
});

export { auth, db, functions, analytics };

// IMPORTANT: Ensure you have created a .env.local file in the root of your project
// and added your Firebase project configuration details there:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (Optional)
