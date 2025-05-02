// src/context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/firebase";
import type { Empresa, AuthUser } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { getTraccarDevices } from "@/services/traccar";

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  initialLoadComplete: boolean;
  login: (
    companyCode: string,
    loginIdentifier: string,
    pass: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);
const AUTH_STORAGE_KEY = "bibitrack_auth_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Sessão persistida                                                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Login custom                                                       */
  /* ------------------------------------------------------------------ */
  const login = useCallback(
    async (companyCode: string, loginIdentifier: string, pass: string) => {
      setLoading(true);

      try {
        // 1. Busca empresa no Supabase
        const { data, error } = await supabase
          .from("empresas")
          .select("*")
          .eq("codigo", companyCode)
          .single<Empresa>();

        if (error || !data) throw new Error("Empresa não encontrada.");

        // 2. Procura entregador no JSON/array
        const entregadores: Array<{
          login: string;
          senha?: string;
          uniqueId: string;
          nome?: string;
        }> = Array.isArray(data.entregadores)
          ? data.entregadores
          : typeof data.entregadores === "string"
          ? JSON.parse(data.entregadores)
          : [];

        const driver =
          entregadores.find(
            (e) => e.login === loginIdentifier && e.senha === pass
          ) ??
          // 3. Fallback Traccar
          (await (async () => {
            const devices = await getTraccarDevices();
            return devices.find((d) =>
              d.name
                ?.toLowerCase()
                .includes(`${companyCode}${loginIdentifier}`.toLowerCase())
            )
              ? {
                  uniqueId: devices.find(
                    (d) =>
                      d.name
                        ?.toLowerCase()
                        .includes(
                          `${companyCode}${loginIdentifier}`.toLowerCase()
                        )
                  )!.uniqueId,
                  nome: loginIdentifier,
                }
              : null;
          })());

        if (!driver) throw new Error("Credenciais inválidas.");

        const authUser: AuthUser = {
          empresaCodigo: companyCode,
          loginIdentifier,
          uniqueId: driver.uniqueId,
          nome: driver.nome,
          type: "entregador",
        };

        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /* Logout                                                             */
  /* ------------------------------------------------------------------ */
  const logout = useCallback(async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoading(false);
  }, []);

  if (loading && !initialLoadComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, initialLoadComplete, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

