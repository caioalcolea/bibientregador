"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, User, KeyRound } from "lucide-react";
// import { signInWithEmailAndPassword } from "firebase/auth"; // Uncomment when Firebase is configured
// import { auth } from "@/lib/firebase"; // Uncomment when Firebase is configured
// import { useRouter } from 'next/navigation'; // Uncomment when auth logic is added

// Define the validation schema using Zod
const loginSchema = z.object({
  companyCode: z.string().min(1, "Company code is required"),
  username: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  // const router = useRouter(); // Uncomment when auth logic is added

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyCode: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    console.log("Login data submitted:", data);

    // TODO: Implement Firebase Authentication
    // 1. Query Firestore 'empresas' collection by data.companyCode.
    // 2. Query Firestore 'entregadores' collection by data.username and empresa_codigo.
    // 3. If both exist and match, attempt Firebase sign-in.
    // 4. On successful sign-in, redirect to the dashboard/main app view.
    // 5. Handle errors (invalid company code, invalid credentials, etc.).

    try {
      // Placeholder for Firebase Auth - replace with actual implementation
      // const userCredential = await signInWithEmailAndPassword(auth, data.username, data.password);
      // console.log("Firebase Auth Success:", userCredential.user);

      // Simulate API call/Auth
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.username}! (Simulation)`,
      });
      // router.push('/dashboard'); // Redirect on successful login - Uncomment later

    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      // if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      //   errorMessage = "Invalid username or password.";
      // } else if (error.code === 'auth/invalid-email') {
      //    errorMessage = "Invalid email format.";
      // }
       // Add checks for company code / entregador not found based on Firestore query results

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">BIBI.track Mobile</CardTitle>
          <CardDescription>Entregador Login</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Building size={16} /> Company Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company code" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User size={16} /> Email (Login)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><KeyRound size={16} /> Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
