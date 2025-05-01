
"use client"; // Essential for hooks and client-side logic

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Import initialized Firebase services
import type { Empresa, Entregador, AuthUser } from '@/lib/types'; // App-specific types
import { Loader2 } from 'lucide-react'; // Loading icon

// Define the shape of the authentication context
interface AuthContextProps {
  user: AuthUser | null; // The authenticated user's data (or null if not logged in)
  loading: boolean; // Flag indicating if auth state is being determined OR during login/logout
  initialLoadComplete: boolean; // Flag indicating if the initial auth check has finished
  login: (companyCode: string, loginIdentifier: string, pass: string) => Promise<void>; // Login function (loginIdentifier can be email or username)
  logout: () => Promise<void>; // Logout function
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider component: wraps the application to provide auth state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null); // Holds the authenticated user data
  const [loading, setLoading] = useState(true); // True during initial check AND login/logout operations
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Tracks if the first auth check finished

  // Function to fetch Entregador data based on Firebase User (using UID)
  const fetchEntregadorData = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    console.log(`Auth Context: Fetching Entregador data for UID: ${firebaseUser.uid}`);
    try {
      // Query 'entregadores' collection using the Firebase UID as the document ID or a specific field
      // Option 1: Assuming UID is the document ID (Common practice)
      // const entregadorDocRef = doc(db, "entregadores", firebaseUser.uid);
      // const entregadorDocSnap = await getDoc(entregadorDocRef);
      // if (!entregadorDocSnap.exists()) { ... }
      // const entregadorData = entregadorDocSnap.data() as Omit<Entregador, 'id'>;
      // const entregadorId = entregadorDocSnap.id;

      // Option 2: Querying by a specific field (e.g., 'login' or 'auth_uid') if UID isn't the doc ID
      const q = query(
        collection(db, "entregadores"),
        where("login", "==", firebaseUser.email), // Query by email used during login
        // Or: where("auth_uid", "==", firebaseUser.uid), // If you store UID separately
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`Auth Context: No Entregador document found for UID ${firebaseUser.uid} / email ${firebaseUser.email}.`);
        return null; // No matching driver found in Firestore
      }

      // Extract data from the found document
      const entregadorDoc = querySnapshot.docs[0];
      const entregadorData = entregadorDoc.data() as Entregador; // Cast directly assuming full Entregador structure

      if (!entregadorData.empresa_codigo || !entregadorData.uniqueId || !entregadorData.nome) {
          console.error(`Auth Context: Incomplete Entregador data found for UID ${firebaseUser.uid}. Missing required fields.`);
          return null; // Essential data missing
      }

      // Construct the AuthUser object combining Firebase Auth info and Firestore data
      const authUserData: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email, // Email from Firebase Auth
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
  }, []); // Empty dependency array

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
      // Ensure this runs regardless of whether user is found or not
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
  }, [fetchEntregadorData]);

  // Login function adapted to match the website's logic (Entregador only)
  const login = useCallback(async (companyCode: string, loginIdentifier: string, pass: string) => {
    console.log(`Auth Context: Attempting login for ${loginIdentifier}, company ${companyCode}`);
    setLoading(true); // Set loading true during login attempt
    try {
      // 1. Verify Company Code exists in Firestore
      const empresaQuery = query(collection(db, "empresas"), where("codigo", "==", companyCode), limit(1));
      const empresaSnapshot = await getDocs(empresaQuery);
      if (empresaSnapshot.empty) {
        throw new Error(`Empresa com código '${companyCode}' não encontrada.`);
      }
      const empresa = empresaSnapshot.docs[0].data() as Empresa;
      console.log("Auth Context: Company code verified.", empresa.nome);

      // 2. Verify Entregador exists for this company and login identifier
      // Assuming 'login' field in Firestore stores the identifier (email or username)
      const entregadorQuery = query(
        collection(db, "entregadores"),
        where("empresa_codigo", "==", companyCode),
        where("login", "==", loginIdentifier),
        limit(1)
      );
      const entregadorSnapshot = await getDocs(entregadorQuery);
      if (entregadorSnapshot.empty) {
        // NOTE: The website logic tries Traccar API here. We are assuming
        // Firebase Auth is the source of truth for credentials.
        // If Traccar verification is *strictly* needed before Firebase auth,
        // that logic would go here, but it's unusual.
        // Sticking to Firebase Auth flow for this implementation.
        throw new Error(`Login inválido para a empresa '${companyCode}'. Verifique o login.`);
      }
      const entregadorData = entregadorSnapshot.docs[0].data() as Entregador;
      console.log("Auth Context: Entregador record found:", entregadorData.nome);

      // 3. Attempt Firebase Sign In using the 'login' identifier (assumed to be email for Firebase Auth)
      // Important: Firebase Auth typically requires email format for signInWithEmailAndPassword.
      // If 'loginIdentifier' is *not* an email, you need a different auth method
      // (e.g., custom tokens, or ensure 'loginIdentifier' IS the user's registered email).
      await signInWithEmailAndPassword(auth, loginIdentifier, pass);
      console.log("Auth Context: Firebase signIn successful for:", loginIdentifier);

      // NOTE: Setting user state is handled by the onAuthStateChanged listener.
      // setLoading will be set to false by the listener.

    } catch (error: any) {
      console.error("Auth Context: Login process failed:", error);
      // Create user-friendly error messages
      let friendlyMessage = "Falha no login. Verifique suas credenciais e o código da empresa.";
      if (error.code) { // Firebase Auth errors
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                friendlyMessage = "Login ou senha inválidos.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "Formato de login inválido (esperado email)."; // Adjust if login isn't email
                break;
            case 'auth/too-many-requests':
                friendlyMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
                break;
             case 'auth/network-request-failed':
                friendlyMessage = "Erro de rede. Verifique sua conexão.";
                 break;
            // Add other specific Firebase error codes as needed
        }
      } else if (error.message.includes("Empresa") || error.message.includes("Login inválido")) {
         // Use custom messages thrown during validation steps
         friendlyMessage = error.message;
      }
      setLoading(false); // Ensure loading is stopped on error
      throw new Error(friendlyMessage); // Re-throw the processed error message
    }
    // setLoading state will be updated by the onAuthStateChanged listener upon completion
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log("Auth Context: Attempting logout.");
    setLoading(true); // Set loading true during logout
    try {
      await signOut(auth); // Sign out from Firebase
      // NOTE: Setting user state to null and loading to false is handled by the onAuthStateChanged listener.
      console.log("Auth Context: Firebase signOut successful.");
    } catch (error) {
      console.error("Auth Context: Logout failed:", error);
      setLoading(false); // Ensure loading is stopped even on error in signOut itself
      throw error; // Re-throw error for calling component to handle
    }
  }, []);

  // Show loading indicator ONLY during the initial auth check
  if (loading && !initialLoadComplete) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-secondary" data-testid="initial-auth-loader-container">
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
