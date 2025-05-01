"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// import { useRouter } from 'next/navigation'; // For auth checks
// import { useAuth } from '@/hooks/useAuth'; // Custom hook for auth state - TODO: Create this hook

export default function DashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [webViewUrl, setWebViewUrl] = React.useState<string | null>(null);
  // const { user, loading } = useAuth(); // TODO: Implement useAuth hook
  // const router = useRouter();

  // Simulate fetching user data and constructing URL
  React.useEffect(() => {
    // TODO: Replace with actual auth check and data fetching
    // if (!loading && !user) {
    //   router.replace('/'); // Redirect to login if not authenticated
    //   return;
    // }

    // if (user) {
      // Fetch user-specific data (company code, uniqueId) from Firestore or auth claims
      const companyCode = "mock_company_code"; // Replace with actual data
      const uniqueId = "mock_unique_id"; // Replace with actual data
      const url = `https://bibitrack.com.br/${companyCode}/app/?id=${uniqueId}`;
      console.log("WebView URL:", url);
      setWebViewUrl(url);
      setIsLoading(false);
    // }

     // Simulate loading delay
     const timer = setTimeout(() => {
        const companyCode = "simulated_company";
        const uniqueId = "simulated_id_123";
        const url = `https://bibitrack.com.br/${companyCode}/app/?id=${uniqueId}`;
        setWebViewUrl(url);
        setIsLoading(false);
     }, 1000);

     return () => clearTimeout(timer); // Cleanup timer on unmount

  }, [/* loading, user, router */]); // Add dependencies when auth is implemented

  // TODO: Implement Location Tracking Service Initialization here
  // useEffect(() => {
  //   if (user && !loading) {
  //      startLocationService(user.uid, user.uniqueId); // Pass necessary IDs
  //   }
  //   return () => {
  //      stopLocationService(); // Cleanup on component unmount or user logout
  //   }
  // }, [user, loading]);

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">BIBI.track Dashboard</h1>
        {/* TODO: Add Logout Button */}
        <button className="text-sm p-2 rounded hover:bg-primary/90">Logout</button>
      </header>
      <main className="flex-1 bg-secondary overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-[80%] w-[90%] rounded-lg" />
          </div>
        ) : webViewUrl ? (
           <Card className="h-full w-full rounded-none border-0 shadow-none">
            {/*
              NOTE: A standard HTML iframe is used here as a placeholder.
              In a real native Android app (as requested in the prompt initially, though this is Next.js),
              you would use an Android WebView component. For a web app, this iframe
              demonstrates embedding the PWA. Direct WebView integration with deeper
              native features (like JavascriptInterface) isn't possible in a standard web app.
              The prompt asks for Android Native but provides a Next.js scaffold.
              This implementation follows the Next.js scaffold.
            */}
            <iframe
              src={webViewUrl}
              title="BIBI.track PWA"
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" // Security settings for iframe
            />
          </Card>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-destructive">Failed to load BIBI.track interface.</p>
          </div>
        )}
      </main>
      {/* TODO: Add status bar for tracking service status, sync status, etc. */}
      <footer className="bg-muted text-muted-foreground p-2 text-center text-xs border-t">
        Location Tracking: Active | Sync Status: Synced
      </footer>
    </div>
  );
}
