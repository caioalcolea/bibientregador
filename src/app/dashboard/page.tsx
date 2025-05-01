
"use client";

import * as React from 'react';
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
  const [isTracking, setIsTracking] = React.useState(false); // Track service status dynamically
  const [syncStatus, setSyncStatus] = React.useState("Aguardando"); // Placeholder sync status
  const [isOnline, setIsOnline] = React.useState(true); // Track network status

  const { user, loading: authLoading, logout, initialLoadComplete } = useAuth(); // Get user, loading state, and logout function
  const router = useRouter();
  const { toast } = useToast();

  // Effect for checking network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Effect for authentication check and redirection
  React.useEffect(() => {
    if (initialLoadComplete && !authLoading && !user) {
      console.log("Dashboard: User not authenticated, redirecting to login.");
      router.replace('/'); // Redirect to login if not authenticated
    }
  }, [initialLoadComplete, authLoading, user, router]);

  // Effect to construct PWA URL and manage loading state once user is available
  React.useEffect(() => {
    if (user && !authLoading) {
      console.log("Dashboard: User authenticated, constructing PWA URL.");
      // Construct the URL using user data from the custom auth context
      const url = `https://bibitrack.com.br/${user.empresaCodigo}/app/?id=${user.uniqueId}`;
      console.log("Dashboard: WebView URL:", url);
      setWebViewUrl(url);
      // Use iframe onload to set loading state false
      setIsLoadingPwa(true); // Assume loading starts when URL is set
    } else if (initialLoadComplete && !authLoading && !user) {
      setIsLoadingPwa(false);
      setWebViewUrl(null);
    } else {
       setIsLoadingPwa(true);
    }
  }, [user, authLoading, initialLoadComplete]);

   // Effect for managing the location tracking service based on user state
   React.useEffect(() => {
    let serviceStarted = false;
    if (user && !authLoading) {
      console.log("Dashboard: Starting location service for user:", user.loginIdentifier, "uniqueId:", user.uniqueId);
      // Pass the necessary user details to the location service
      startLocationService(user); // Pass the whole AuthUser object
      serviceStarted = true;
      setIsTracking(true);
      setSyncStatus("Ativo");
    } else {
       // If user becomes null (logout) or during initial load when user is null
       if (isLocationServiceRunning()) {
           console.log("Dashboard: User logged out or changed, stopping location service.");
           stopLocationService();
           setIsTracking(false);
           setSyncStatus("Inativo");
       }
    }

    // Cleanup function
    return () => {
      // Stop service only if it was started in *this* effect instance
      if (serviceStarted) {
        console.log("Dashboard: Component unmounting or user changed, ensuring location service is stopped.");
        stopLocationService();
        setIsTracking(false);
        setSyncStatus("Inativo");
      }
    };
   }, [user, authLoading]); // Re-run if user or authLoading state changes

    // Function to handle iframe load completion
    const handleIframeLoad = () => {
        console.log("Dashboard: Iframe finished loading.");
        setIsLoadingPwa(false);
    };

    // Function to handle iframe load errors
    const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
        console.error("Dashboard: Iframe loading error:", e);
        toast({ variant: "destructive", title: "Erro ao carregar", description: "Não foi possível carregar a interface do BIBI.track." });
        setIsLoadingPwa(false);
        setWebViewUrl(null);
    };

  const handleLogout = async () => {
    console.log("Dashboard: Logging out...");
    // Loading state will be managed by AuthContext during logout
    try {
      await logout();
      // stopLocationService(); // Stop service is handled by the useEffect watching 'user'
      // setIsTracking(false); // Also handled by useEffect
      // setSyncStatus("Inativo"); // Also handled by useEffect
      toast({ title: "Logout realizado com sucesso." });
      // Redirection is handled by the first useEffect when user becomes null
    } catch (error) {
      console.error("Dashboard: Logout failed:", error);
      toast({ variant: "destructive", title: "Erro no Logout", description: "Não foi possível fazer logout." });
    }
  };

  // Show main loading spinner only during the *initial* auth check
  if (authLoading && !initialLoadComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="dashboard-auth-loader" />
      </div>
    );
  }

   // If initial load is complete but user is null (not logged in), redirect handled by effect, show nothing here.
   if (initialLoadComplete && !user) {
       return null; // Or a minimal message/spinner if preferred while redirecting
   }

  // If authenticated, show the dashboard content
  return (
    <div className="flex h-screen flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-semibold truncate">BIBI.track</h1>
        <div className="flex items-center gap-2">
           {/* Display driver name or login identifier */}
           <span className="text-sm hidden sm:inline truncate max-w-[150px]" title={user?.nome || user?.loginIdentifier}>
             {user?.nome || user?.loginIdentifier || 'Carregando...'}
           </span>
           <Button variant="ghost" size="sm" onClick={handleLogout} disabled={authLoading} className="hover:bg-primary/90 text-primary-foreground">
            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sair"}
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-background overflow-hidden">
        {(isLoadingPwa || authLoading) && !webViewUrl && ( // Show skeleton if PWA is loading OR auth is still loading before URL is ready
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-[80%] w-[90%] rounded-lg bg-muted" />
          </div>
        )}
        {webViewUrl && ( // Render iframe only when URL is ready
            <iframe
              key={webViewUrl} // Add key to force re-render if URL changes
              src={webViewUrl}
              title="BIBI.track PWA"
              className={`h-full w-full border-0 transition-opacity duration-300 ${isLoadingPwa ? 'opacity-0' : 'opacity-100'}`} // Fade in iframe
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              aria-busy={isLoadingPwa}
            />
        )}
         {!isLoadingPwa && !webViewUrl && initialLoadComplete && !authLoading && ( // Show error only if not loading and no URL after auth complete
           <div className="flex h-full items-center justify-center p-4 text-center">
             <p className="text-destructive">Não foi possível carregar a interface do BIBI.track. Verifique sua conexão ou tente novamente.</p>
           </div>
         )}
      </main>
      {/* Status bar */}
      <footer className="bg-muted text-muted-foreground p-2 text-center text-xs border-t flex justify-center items-center gap-4">
         <div className={`flex items-center gap-1 ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
           <MapPin size={12} />
           <span>Rastreamento: {isTracking ? 'Ativo' : 'Inativo'}</span>
         </div>
         <div className={`flex items-center gap-1 ${isOnline ? 'text-blue-600' : 'text-gray-500'}`}>
           {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
           <span>Rede: {isOnline ? 'Online' : 'Offline'}</span>
         </div>
         {/* Sync status might need more sophisticated logic based on actual sync events */}
         {/* <div className={`flex items-center gap-1 ${syncStatus === 'Ativo' ? 'text-blue-600' : 'text-gray-500'}`}>
           <span>Sync: {syncStatus}</span>
         </div> */}
      </footer>
    </div>
  );
}
