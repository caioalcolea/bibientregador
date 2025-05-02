// src/app/dashboard/page.tsx
"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Wifi, WifiOff } from "lucide-react";
import {
  startLocationService,
  stopLocationService,
  isLocationServiceRunning,
} from "@/services/locationService";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [isLoadingPwa, setIsLoadingPwa] = React.useState(true);
  const [webViewUrl, setWebViewUrl] = React.useState<string | null>(null);
  const [isTracking, setIsTracking] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);

  const { user, loading: authLoading, logout, initialLoadComplete } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  /* ------------------------------------------------------------------ */
  /* Conectividade                                                      */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Redireciona se não autenticado                                     */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (initialLoadComplete && !authLoading && !user) {
      router.replace("/");
    }
  }, [initialLoadComplete, authLoading, user, router]);

  /* ------------------------------------------------------------------ */
  /* Constrói URL do PWA                                                */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (user && !authLoading) {
      const url = `https://bibitrack.com.br/${user.empresaCodigo}/app/?id=${user.uniqueId}`;
      setWebViewUrl(url);
      setIsLoadingPwa(true);
    } else if (initialLoadComplete && !authLoading && !user) {
      setIsLoadingPwa(false);
      setWebViewUrl(null);
    } else {
      setIsLoadingPwa(true);
    }
  }, [user, authLoading, initialLoadComplete]);

  /* ------------------------------------------------------------------ */
  /* Serviço de localização                                             */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    let serviceStarted = false;
    if (user && !authLoading) {
      startLocationService(user);
      serviceStarted = true;
      setIsTracking(true);
    } else if (isLocationServiceRunning()) {
      stopLocationService();
      setIsTracking(false);
    }
    return () => {
      if (serviceStarted) {
        stopLocationService();
        setIsTracking(false);
      }
    };
  }, [user, authLoading]);

  const handleIframeLoad = () => setIsLoadingPwa(false);

  const handleIframeError = () => {
    toast({
      variant: "destructive",
      title: "Erro ao carregar",
      description: "Não foi possível carregar a interface do BIBI.track.",
    });
    setIsLoadingPwa(false);
    setWebViewUrl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logout realizado com sucesso." });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro no Logout",
        description: "Não foi possível fazer logout.",
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  if (authLoading && !initialLoadComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2
          className="h-12 w-12 animate-spin text-primary"
          data-testid="dashboard-auth-loader"
        />
      </div>
    );
  }

  if (initialLoadComplete && !user) return null;

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-semibold truncate">
          BIBI.track
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="text-sm hidden sm:inline truncate max-w-[150px]"
            title={user?.nome || user?.loginIdentifier}
          >
            {user?.nome || user?.loginIdentifier || "Carregando..."}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={authLoading}
            className="hover:bg-primary/90 text-primary-foreground"
          >
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sair"
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-background overflow-hidden">
        {(isLoadingPwa || authLoading) && !webViewUrl && (
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-[80%] w-[90%] rounded-lg bg-muted" />
          </div>
        )}

        {webViewUrl && (
          <iframe
            key={webViewUrl}
            src={webViewUrl}
            title="BIBI.track PWA"
            className={`h-full w-full border-0 transition-opacity duration-300 ${
              isLoadingPwa ? "opacity-0" : "opacity-100"
            }`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            aria-busy={isLoadingPwa}
          />
        )}

        {!isLoadingPwa && !webViewUrl && initialLoadComplete && !authLoading && (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="text-destructive">
              Não foi possível carregar a interface do BIBI.track. Verifique sua
              conexão ou tente novamente.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-muted text-muted-foreground p-2 text-center text-xs border-t flex justify-center items-center gap-4">
        <div
          className={`flex items-center gap-1 ${
            isTracking ? "text-green-600" : "text-red-600"
          }`}
        >
          <MapPin size={12} />
          <span>Rastreamento: {isTracking ? "Ativo" : "Inativo"}</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            isOnline ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>Rede: {isOnline ? "Online" : "Offline"}</span>
        </div>
      </footer>
    </div>
  );
}

