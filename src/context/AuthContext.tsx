"use client"; // Essential for hooks and client-side logic

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Import initialized Firebase services
import type { Empresa, Entregador, AuthUser } from '@/lib/types'; // App-specific types
import { Loader2 } from 'lucide-react'; // Loading icon

// Define the shape of the authentication context
interface AuthContextProps {
  user: AuthUser | null; // The authenticated user's data (or null if not logged in)
  loading: boolean; // Flag indicating if auth state is being determined
  initialLoadComplete: boolean; // Flag indicating if the initial auth check has finished
  login: (companyCode: string, email: string, pass: string) => Promise<void>; // Login function
  logout: () => Promise<void>; // Logout function
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider component: wraps the application to provide auth state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null); // Holds the authenticated user data
  const [loading, setLoading] = useState(true); // True while checking initial auth state or during login/logout
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Tracks if the first auth check finished

  // Function to fetch Entregador data based on Firebase User
  const fetchEntregadorData = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    if (!firebaseUser.email) {
      console.error("Auth Context: Firebase user missing email.");
      return null; // Cannot lookup without email
    }
    console.log(`Auth Context: Fetching Entregador data for email: ${firebaseUser.email}`);
    try {
      // Query 'entregadores' collection for a document matching the logged-in user's email
      const q = query(
        collection(db, "entregadores"),
        where("login", "==", firebaseUser.email), // 'login' field stores the email
        limit(1) // Expect only one matching driver per email
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`Auth Context: No Entregador document found for email ${firebaseUser.email}.`);
        return null; // No matching driver found in Firestore
      }

      // Extract data from the found document
      const entregadorDoc = querySnapshot.docs[0];
      // Important: Cast carefully, ensure Firestore data matches the Entregador type
      const entregadorData = entregadorDoc.data() as Omit<Entregador, 'id'>; // Exclude 'id' if using auto-ID

      // Construct the AuthUser object combining Firebase Auth info and Firestore data
      const authUserData: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || entregadorData.nome, // Use Firestore name if Auth name is null
        empresaCodigo: entregadorData.empresa_codigo,
        uniqueId: entregadorData.uniqueId, // Traccar ID
        entregadorId: entregadorDoc.id, // Firestore document ID
        nome: entregadorData.nome,
      };
      console.log("Auth Context: Entregador data fetched successfully:", authUserData);
      return authUserData;

    } catch (error) {
      console.error("Auth Context: Error fetching Entregador data from Firestore:", error);
      return null; // Return null on error
    }
  }, []); // Empty dependency array as fetchEntregadorData doesn't depend on component state


  // Effect to listen for Firebase authentication state changes
  useEffect(() => {
    console.log("Auth Context: Setting up onAuthStateChanged listener.");
    setLoading(true); // Start loading when the listener is attached

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("Auth Context: onAuthStateChanged triggered. Firebase user:", firebaseUser?.uid || "null");
      if (firebaseUser) {
        // User is signed in according to Firebase Auth
        const fetchedUser = await fetchEntregadorData(firebaseUser);
        if (fetchedUser) {
          // Successfully fetched associated driver data
          setUser(fetchedUser);
        } else {
          // Driver data not found or error fetching - inconsistency state
          console.error(`Auth Context: User ${firebaseUser.uid} authenticated but failed to fetch Entregador data. Forcing logout.`);
          setUser(null); // Clear any potentially stale user data
          await signOut(auth).catch(err => console.error("Auth Context: Error during forced sign out:", err)); // Force sign out
        }
      } else {
        // User is signed out
        setUser(null);
      }
      // Mark initial load as complete and set loading to false AFTER processing
      setLoading(false);
      setInitialLoadComplete(true);
       console.log("Auth Context: Auth state processed. Loading:", false, "InitialLoadComplete:", true, "User:", user ? user.uid : "null");
    });

    // Cleanup: Unsubscribe from the listener when the component unmounts
    return () => {
        console.log("Auth Context: Cleaning up onAuthStateChanged listener.");
        unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntregadorData]); // Include fetchEntregadorData in dependency array

  // Login function
  const login = useCallback(async (companyCode: string, email: string, pass: string) => {
    console.log(`Auth Context: Attempting login for ${email}, company ${companyCode}`);
    setLoading(true); // Set loading true during login attempt
    try {
      // 1. Verify Company Code
      const empresaQuery = query(collection(db, "empresas"), where("codigo", "==", companyCode), limit(1));
      const empresaSnapshot = await getDocs(empresaQuery);
      if (empresaSnapshot.empty) {
        throw new Error(`Empresa com código '${companyCode}' não encontrada.`);
      }
      console.log("Auth Context: Company code verified.");

      // 2. Verify Entregador exists for this company and email *before* Firebase sign-in
      const entregadorQuery = query(
        collection(db, "entregadores"),
        where("empresa_codigo", "==", companyCode),
        where("login", "==", email), // Assuming 'login' field holds the email
        limit(1)
      );
      const entregadorSnapshot = await getDocs(entregadorQuery);
      if (entregadorSnapshot.empty) {
        throw new Error(`Login inválido para a empresa '${companyCode}'. Verifique o email.`);
      }
      console.log("Auth Context: Entregador record found for email.");

      // 3. Attempt Firebase Sign In
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("Auth Context: Firebase signIn successful.");
      // NOTE: Setting user state is handled by the onAuthStateChanged listener,
      // which will fetch the full Entregador data upon successful sign-in.

    } catch (error: any) {
      console.error("Auth Context: Login process failed:", error);
      // Create user-friendly error messages
      let friendlyMessage = "Falha no login. Verifique suas credenciais e o código da empresa.";
      if (error.code) { // Firebase Auth errors often have codes
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': // Common code for invalid email/password combo
                friendlyMessage = "Email ou senha inválidos.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "Formato de email inválido.";
                break;
            case 'auth/too-many-requests':
                friendlyMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
                break;
            // Add other specific Firebase error codes as needed
        }
      } else if (error.message.includes("Empresa") || error.message.includes("Entregador")) {
         // Use custom messages thrown during validation steps
         friendlyMessage = error.message;
      }
      setLoading(false); // Ensure loading is stopped on error
      throw new Error(friendlyMessage); // Re-throw the processed error message
    }
    // setLoading state will be updated by the onAuthStateChanged listener upon completion
  }, []); // Empty dependency array as login doesn't depend on component state directly

  // Logout function
  const logout = useCallback(async () => {
    console.log("Auth Context: Attempting logout.");
    setLoading(true); // Set loading true during logout
    try {
      await signOut(auth); // Sign out from Firebase
      // NOTE: Setting user state to null is handled by the onAuthStateChanged listener.
      console.log("Auth Context: Firebase signOut successful.");
    } catch (error) {
      console.error("Auth Context: Logout failed:", error);
      setLoading(false); // Ensure loading is stopped even on error
      // Optionally re-throw or handle the error (e.g., show a toast)
      throw error;
    }
     // setLoading state will be updated by the onAuthStateChanged listener upon completion
  }, []); // Empty dependency array

  // Show loading indicator ONLY during the initial auth check
  if (loading && !initialLoadComplete) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-secondary">
            <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="initial-auth-loader" />
        </div>
     )
  }

  // Provide the auth state and functions to children components via context
  return (
    <AuthContext.Provider value={{ user, loading, initialLoadComplete, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext in components
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error occurs if useAuth is used outside of an AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};