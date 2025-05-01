
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
import { useAuth } from '@/context/AuthContext'; // Import the updated useAuth hook
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

// Define the validation schema using Zod, matching the fields in the provided HTML
// Note: Removed the userType field as it's now hardcoded for 'entregador'
const loginSchema = z.object({
  companyCode: z.string().min(1, "Código da Empresa é obrigatório"),
  username: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  // Use the loading state and login function from the custom AuthContext
  const { login, loading: authLoading, user, initialLoadComplete } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Local loading state for the submit button specifically
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyCode: "",
      username: "",
      password: "",
    },
  });

   // Redirect if user is already logged in after initial load check
   React.useEffect(() => {
    if (initialLoadComplete && user) {
       console.log("LoginPage: User already authenticated, redirecting to dashboard.");
      router.replace('/dashboard');
    }
   }, [initialLoadComplete, user, router]);

   // Set company code from URL params if present
   React.useEffect(() => {
    // Check if window is defined (runs only on client)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const empresaCodigo = urlParams.get('codigo');
      if (empresaCodigo) {
        form.setValue('companyCode', empresaCodigo);
        console.log("LoginPage: Pre-filled company code from URL:", empresaCodigo);
      }
    }
   }, [form]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    console.log("Login data submitted:", data);

    try {
      // Call the custom login function from AuthContext
      // The third argument (password) is passed directly from the form data.
      await login(data.companyCode, data.username, data.password);

      // If login is successful, the useEffect above will handle redirection
      // when the 'user' state updates.
      toast({
        title: "Login Bem-sucedido",
        description: "Redirecionando para o painel...",
      });

    } catch (error: any) {
      console.error("Login process failed:", error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message || "Ocorreu um erro. Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable form while initial auth check is in progress or during submission
  const isLoading = authLoading || isSubmitting || !initialLoadComplete;

   // Prevent rendering the form until the initial load check is complete
   // and we know if the user is already logged in or not.
   if (!initialLoadComplete) {
       return (
           <div className="flex min-h-screen items-center justify-center bg-secondary">
               <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="login-initial-load-spinner" />
           </div>
       );
   }

   // If already logged in after check, render null while redirecting
   if (user) {
       return null;
   }

  // Render the login form if not logged in
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          {/* Logo - Consider adding an actual image component */}
          <img src="https://bibitrack.com.br/adm/assets/img/logo.png" alt="BIBI.track Logo" className="mx-auto mb-4 h-12 w-auto" />
          <CardTitle className="text-2xl font-bold text-primary">BIBI.track</CardTitle>
          {/* Changed description as only 'entregador' is supported */}
          <CardDescription>Acesso Entregador</CardDescription>
        </CardHeader>
        <CardContent>
          {/* User Type Selector (commented out as only driver is needed) */}
          {/* <div className="mb-4 flex justify-center">
            <Button variant="outline" className="w-full cursor-default">
              Entregador
            </Button>
          </div> */}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Building size={16} /> Código da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 0323" {...field} disabled={isLoading} required />
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
                    <FormLabel className="flex items-center gap-2"><User size={16} /> Login</FormLabel>
                    <FormControl>
                      {/* Input type is text for login identifier */}
                      <Input type="text" placeholder="Seu login" {...field} disabled={isLoading} required />
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
                      <Input type="password" placeholder="Sua senha" {...field} disabled={isLoading} required />
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
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
