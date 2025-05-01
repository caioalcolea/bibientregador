
"use client"; // Essential for hooks and client-side logic

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Removed Firebase Auth imports: onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser
// Removed Firebase Auth/DB imports from @/lib/firebase as they are handled differently now
import { supabase } from '@/lib/firebase'; // Import Supabase client
import type { Empresa, Entregador, Dispositivo, AuthUser } from '@/lib/types'; // App-specific types
import { Loader2 } from 'lucide-react'; // Loading icon
import { getTraccarDevices, verifyTraccarCredentials } from '@/services/traccar'; // Import Traccar service functions

// Define the shape of the authentication context
interface AuthContextProps {
  user: AuthUser | null; // The authenticated user's data (or null if not logged in)
  loading: boolean; // Flag indicating if auth state is being determined OR during login/logout
  initialLoadComplete: boolean; // Flag indicating if the initial auth check (from storage) has finished
  login: (companyCode: string, loginIdentifier: string, pass: string) => Promise<void>; // Login function
  logout: () => Promise<void>; // Logout function
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AUTH_STORAGE_KEY = 'bibitrack_auth_user';

// AuthProvider component: wraps the application to provide auth state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null); // Holds the authenticated user data
  const [loading, setLoading] = useState(true); // True during initial check AND login/logout operations
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Tracks if the first auth check finished

  // Effect to load user from storage on initial mount (simulates session persistence)
  useEffect(() => {
    console.log("Auth Context: Checking for persisted user session...");
    setLoading(true);
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        // Basic validation (can be more thorough)
        if (parsedUser && parsedUser.empresaCodigo && parsedUser.loginIdentifier && parsedUser.uniqueId) {
           console.log("Auth Context: Found valid persisted user session:", parsedUser);
           setUser(parsedUser);
        } else {
           console.warn("Auth Context: Invalid user data found in storage. Clearing.");
           localStorage.removeItem(AUTH_STORAGE_KEY);
           setUser(null);
        }
      } else {
         console.log("Auth Context: No persisted user session found.");
         setUser(null);
      }
    } catch (error) {
       console.error("Auth Context: Error reading user from storage:", error);
       localStorage.removeItem(AUTH_STORAGE_KEY); // Clear potentially corrupted data
       setUser(null);
    } finally {
       setLoading(false);
       setInitialLoadComplete(true);
       console.log("Auth Context: Initial user check complete.");
    }
  }, []); // Runs only once on mount

  // Custom Login function based on the provided script logic
  const login = useCallback(async (companyCode: string, loginIdentifier: string, pass: string) => {
    console.log(`Auth Context: Attempting login for ${loginIdentifier}, company ${companyCode}`);
    setLoading(true);

    if (!supabase) {
        console.error("Auth Context: Supabase client not initialized!");
        setLoading(false);
        throw new Error("Erro interno do sistema (Supabase não disponível).");
    }

    try {
      // 1. Fetch Company Data from Supabase
      console.log(`Auth Context: Fetching company with code: ${companyCode}`);
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('codigo', companyCode)
        .limit(1);

      if (empresaError) {
        console.error("Auth Context: Error fetching company from Supabase:", empresaError);
        throw new Error("Erro ao verificar código da empresa.");
      }
      if (!empresaData || empresaData.length === 0) {
        throw new Error(`Empresa com código '${companyCode}' não encontrada.`);
      }
      const empresa: Empresa = empresaData[0];
      console.log("Auth Context: Company found:", empresa.nome);

      // --- Driver Authentication Logic ---
      // We only care about 'entregador' type based on the mobile app context

      let authenticatedDriver: { uniqueId: string; nome?: string } | null = null;

      // 2a. Check Supabase 'entregadores' field (if exists and has data)
      if (empresa.entregadores) {
        console.log("Auth Context: Checking credentials against Supabase 'entregadores' field.");
        try {
          let entregadoresList: Array<{ login: string; senha?: string; uniqueId: string; nome?: string }> = [];
          if (typeof empresa.entregadores === 'string') {
            entregadoresList = JSON.parse(empresa.entregadores);
          } else if (Array.isArray(empresa.entregadores)) {
            entregadoresList = empresa.entregadores;
          }

          if (Array.isArray(entregadoresList)) {
            // IMPORTANT SECURITY NOTE: Comparing plain text passwords like this is highly insecure!
            // This replicates the *insecure* logic from the provided script.
            // A real application MUST use password hashing on the server-side.
            const foundDriver = entregadoresList.find(e => e.login === loginIdentifier && e.senha === pass);

            if (foundDriver) {
              console.log("Auth Context: Driver authenticated via Supabase 'entregadores'.", foundDriver);
              authenticatedDriver = { uniqueId: foundDriver.uniqueId, nome: foundDriver.nome };
            } else {
               console.log("Auth Context: Driver not found or password mismatch in Supabase 'entregadores'.");
            }
          } else {
            console.warn("Auth Context: 'entregadores' field is not a valid JSON array string or array. Skipping Supabase check.");
          }
        } catch (parseError) {
          console.error("Auth Context: Error parsing 'entregadores' field from Supabase:", parseError);
          // Continue to Traccar check as fallback
        }
      } else {
         console.log("Auth Context: No 'entregadores' field found in Supabase company data. Proceeding to Traccar check.");
      }

      // 2b. Fallback: Verify Driver with Traccar API if not found in Supabase
      if (!authenticatedDriver) {
        console.log("Auth Context: Attempting fallback authentication via Traccar API.");
        try {
           const traccarDevices = await getTraccarDevices(); // Fetch all devices

           // Filter devices for the current company based on name convention
           const companyDevices = traccarDevices.filter(device =>
               device.name && device.name.startsWith(companyCode)
           );
           console.log(`Auth Context: Found ${companyDevices.length} Traccar devices for company ${companyCode}.`);

           // Find the device matching the driver's login identifier (case-insensitive)
           const driverDevice = companyDevices.find(device =>
               device.name.toLowerCase().includes(loginIdentifier.toLowerCase())
           );

           if (driverDevice) {
             console.log("Auth Context: Found matching Traccar device:", driverDevice);
             // Note: The original script doesn't verify the password against Traccar here.
             // It assumes if the device name matches, it's valid. This is insecure if
             // passwords should be checked. For now, replicating the script's behavior.
             // If password check against Traccar is needed, implement verifyTraccarCredentials here.
             authenticatedDriver = { uniqueId: driverDevice.uniqueId, nome: driverDevice.name }; // Use device name as fallback name
             console.log("Auth Context: Driver 'authenticated' via Traccar device name match.");
           } else {
             console.log("Auth Context: No matching Traccar device found for login:", loginIdentifier);
             throw new Error("Credenciais de entregador inválidas ou motorista não encontrado.");
           }
        } catch (traccarError: any) {
           console.error("Auth Context: Error during Traccar verification:", traccarError);
           throw new Error(traccarError.message || "Erro ao verificar motorista no Traccar.");
        }
      }

      // 3. Set User State if Authenticated
      if (authenticatedDriver) {
        const authUserData: AuthUser = {
          empresaCodigo: companyCode,
          loginIdentifier: loginIdentifier,
          uniqueId: authenticatedDriver.uniqueId,
          nome: authenticatedDriver.nome,
          type: 'entregador',
        };
        setUser(authUserData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUserData)); // Persist session
        console.log("Auth Context: Login successful. User state set:", authUserData);
      } else {
        // This case should technically be caught by earlier throws, but as a safeguard:
        throw new Error("Falha na autenticação. Verifique suas credenciais.");
      }

    } catch (error: any) {
      console.error("Auth Context: Login process failed:", error);
      setUser(null); // Ensure user is null on error
      localStorage.removeItem(AUTH_STORAGE_KEY); // Clear any potentially stale session
      // Rethrow the error with a user-friendly message if possible
      throw new Error(error.message || "Ocorreu um erro desconhecido durante o login.");
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies if needed, like supabase client instance

  // Logout function
  const logout = useCallback(async () => {
    console.log("Auth Context: Attempting logout.");
    setLoading(true);
    try {
      setUser(null); // Clear user state
      localStorage.removeItem(AUTH_STORAGE_KEY); // Remove persisted session
      // No server-side logout needed for this custom implementation
      console.log("Auth Context: Logout successful (local state cleared).");
    } catch (error) {
      console.error("Auth Context: Logout failed:", error);
      // Should generally not fail, but handle just in case
    } finally {
      setLoading(false);
    }
  }, []);

  // Show loading indicator ONLY during the initial auth check from storage
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
