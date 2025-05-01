
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
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

// Define the validation schema using Zod, matching the fields in the provided HTML
const loginSchema = z.object({
  companyCode: z.string().min(1, "Código da Empresa é obrigatório"),
  // Username/Login field can be email or other identifier based on context, using string for flexibility
  username: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"), // Assuming min length 1 as per HTML example
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  // Use the loading state and login function from AuthContext
  const { login, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Local loading state for the submit button specifically
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyCode: "",
      username: "", // Renamed from email to username for consistency with HTML
      password: "",
    },
  });

   // Redirect if user is already logged in
   React.useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
   }, [user, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true); // Start local submitting indicator
    console.log("Login data submitted:", data);

    try {
      // Call the login function from AuthContext
      await login(data.companyCode, data.username, data.password);

      // Login function handles Firebase auth and Firestore checks.
      // If it resolves without error, the onAuthStateChanged listener in AuthContext
      // will update the user state and trigger redirection via the useEffect above.
      toast({
        title: "Login Iniciado",
        description: "Verificando credenciais...", // More accurate message
      });
      // No need to redirect here, useEffect handles it based on user state change
      // router.push('/dashboard');

    } catch (error: any) {
      console.error("Login process failed:", error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message || "Ocorreu um erro. Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsSubmitting(false); // Stop local submitting indicator
      // AuthContext's loading state will be managed internally by the login/auth process
    }
  };

  // Disable form while auth check is in progress or during submission
  const isLoading = authLoading || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          {/* Optional: Add logo image here if desired */}
          {/* <img src="/path/to/logo.png" alt="BIBI track" className="mx-auto mb-4 h-10 w-auto" /> */}
          <CardTitle className="text-2xl font-bold text-primary">BIBI.track</CardTitle>
          <CardDescription>Acesso Entregador</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Building size={16} /> Código da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 0323" {...field} disabled={isLoading} />
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
                     {/* Label updated to 'Login' */}
                    <FormLabel className="flex items-center gap-2"><User size={16} /> Login</FormLabel>
                    <FormControl>
                       {/* Changed type to text, placeholder updated */}
                      <Input type="text" placeholder="Seu login" {...field} disabled={isLoading} />
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
                    <FormLabel className="flex items-center gap-2"><KeyRound size={16} /> Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar" // Button text updated
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
