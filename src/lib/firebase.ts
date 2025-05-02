// src/lib/firebase.ts
//----------------------------------------------
// 1) Firebase (Modular SDK v9+) initialisation
//----------------------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApCBbI9xN0ah1TOM25Ol4a-qQroVKEyCQ",
  authDomain: "motora---bibi.firebaseapp.com",
  projectId: "motora---bibi",
  storageBucket: "motora---bibi.firebasestorage.app",
  messagingSenderId: "727732983131",
  appId: "1:727732983131:web:ce9f70d7af3507d073f67e",
  measurementId: "G-D7EQCE6G2W"
};

// Re‑use the existing app on the client / SSR, or create it once
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** Firestore instance that is **never null** */
export const db: Firestore = getFirestore(firebaseApp);

//------------------------------------------------
// 2) Supabase client (browser‑side usage only)
//------------------------------------------------
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

//------------------------------------------------
// 3) (Optional) named export of the Firebase app
//------------------------------------------------
export { firebaseApp };

