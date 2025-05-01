
"use client";

import * as React from 'react';
import { Card } from '@/components/ui/card'; // Removed unused Card components
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation'; // For redirection
import { useAuth } from '@/context/AuthContext'; // Custom hook for auth state
import { Button } from '@/components/ui/button'; // For logout button
import { Loader2, MapPin, Wifi, WifiOff } from 'lucide-react'; // Icons for status
import { startLocationService, stopLocationService, isLocationServiceRunning } from '@/services/locationService'; // Import location service functions
import { useToast } from '@/hooks/use-toast'; // For showing notifications

export default function DashboardPage() {
  const [isLoadingPwa, setIsLoadingPwa] = React.useState(true); // Loading state specifically for PWA iframe
  const [webViewUrl, setWebViewUrl] = React.useState<string | null>(null);
  const [isTracking, setIsTracking] = React.useState(isLocationServiceRunning()); // Track service status
  const [syncStatus, setSyncStatus] = React.useState("Aguardando"); // Placeholder sync status

  const { user, loading: authLoading, logout, initialLoadComplete } = useAuth(); // Get user, loading state, and logout function
  const router = useRouter();
  const { toast } = useToast();

  // Effect for authentication check and redirection
  React.useEffect(() => {
    // Only redirect *after* the initial auth check is complete and we know the user state
    if (initialLoadComplete && !authLoading && !user) {
      console.log("Dashboard: User not authenticated, redirecting to login.");
      router.replace('/'); // Redirect to login if not authenticated
    }
  }, [initialLoadComplete, authLoading, user, router]);

  // Effect to construct PWA URL and manage loading state once user is available
  React.useEffect(() => {
    if (user && !authLoading) {
      console.log("Dashboard: User authenticated, constructing PWA URL.");
      // Construct the URL using actual user data
      const url = `https://bibitrack.com.br/${user.empresaCodigo}/app/?id=${user.uniqueId}`;
      console.log("Dashboard: WebView URL:", url);
      setWebViewUrl(url);
      // Simulate a small delay for iframe to potentially start loading, then hide skeleton
      // A better approach might involve iframe onload event, but this is simpler for now.
      const timer = setTimeout(() => setIsLoadingPwa(false), 500);
      return () => clearTimeout(timer);
    } else if (initialLoadComplete && !authLoading && !user) {
      // If initial load is done, not loading, and still no user, means logout or failed auth
      setIsLoadingPwa(false); // Stop loading indicator if user isn't coming
      setWebViewUrl(null); // Clear URL
    } else {
       // Still loading auth or user is null initially
       setIsLoadingPwa(true);
    }
  }, [user, authLoading, initialLoadComplete]); // Depend on user and loading state

   // Effect for managing the location tracking service
   React.useEffect(() => {
    let serviceStarted = false;
    if (user && !authLoading) {
      // Start the service if user is logged in and auth is not loading
      console.log("Dashboard: Starting location service for user:", user.uid);
      startLocationService(user.uid, user.uniqueId, user.empresaCodigo);
      serviceStarted = true;
      setIsTracking(true);
      setSyncStatus("Ativo"); // Update status display
    }

    // Cleanup function: stop the service when the component unmounts or dependencies change
    return () => {
      if (serviceStarted) {
        console.log("Dashboard: Stopping location service due to component unmount or user change.");
        stopLocationService();
        setIsTracking(false);
        setSyncStatus("Inativo");
      }
    };
   }, [user, authLoading]); // Re-run if user or authLoading state changes

  const handleLogout = async () => {
    console.log("Dashboard: Logging out...");
    try {
      await logout();
      stopLocationService(); // Ensure service stops on manual logout
      setIsTracking(false);
      setSyncStatus("Inativo");
      toast({ title: "Logout realizado com sucesso." });
      // Redirection is handled by the first useEffect when user becomes null
    } catch (error) {
      console.error("Dashboard: Logout failed:", error);
      toast({ variant: "destructive", title: "Erro no Logout", description: "Não foi possível fazer logout." });
    }
  };

  // Show loading spinner only during the initial auth check
  if (authLoading && !initialLoadComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="dashboard-auth-loader" />
      </div>
    );
  }


  // If authenticated, show the dashboard content
  return (
    <div className="flex h-screen flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-semibold truncate">BIBI.track</h1>
        <div className="flex items-center gap-2">
           <span className="text-sm hidden sm:inline truncate max-w-[150px]" title={user?.nome}>{user?.nome || 'Carregando...'}</span>
           <Button variant="ghost" size="sm" onClick={handleLogout} disabled={authLoading} className="hover:bg-primary/90 text-primary-foreground">
            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sair"}
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-background overflow-hidden"> {/* Changed bg to background */}
        {isLoadingPwa ? (
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-[80%] w-[90%] rounded-lg bg-muted" /> {/* Use muted for skeleton bg */}
          </div>
        ) : webViewUrl ? (
           // Removed Card wrapper around iframe for cleaner look
            <iframe
              src={webViewUrl}
              title="BIBI.track PWA"
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation" // Added allow-top-navigation
              onError={(e) => {
                  console.error("Dashboard: Iframe loading error:", e);
                  toast({ variant: "destructive", title: "Erro ao carregar", description: "Não foi possível carregar a interface do BIBI.track." });
                  setIsLoadingPwa(false); // Ensure loading stops on error
                  setWebViewUrl(null); // Clear URL on error
              }}
            />
        ) : !authLoading && initialLoadComplete ? ( // Only show error if auth is done and still no URL
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="text-destructive">Não foi possível carregar a interface do BIBI.track. Verifique sua conexão ou tente novamente.</p>
          </div>
        ) : null /* Render nothing while auth is loading but PWA isn't necessarily */ }
      </main>
      {/* Status bar */}
      <footer className="bg-muted text-muted-foreground p-2 text-center text-xs border-t flex justify-center items-center gap-4">
         <div className={`flex items-center gap-1 ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
           {isTracking ? <MapPin size={12} /> : <MapPin size={12} />}
           <span>Rastreamento: {isTracking ? 'Ativo' : 'Inativo'}</span>
         </div>
         <div className={`flex items-center gap-1 ${syncStatus === 'Ativo' ? 'text-blue-600' : 'text-gray-500'}`}>
           {/* Use Wifi icons based on a potential future 'online' status */}
           {navigator.onLine ? <Wifi size={12} /> : <WifiOff size={12} />}
           <span>Sync: {syncStatus}</span>
         </div>
      </footer>
    </div>
  );
}
