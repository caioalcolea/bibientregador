// src/components/login-page.tsx
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, User, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/* Validação via Zod                                                  */
/* ------------------------------------------------------------------ */
const loginSchema = z.object({
  companyCode: z.string().min(1, "Código da Empresa é obrigatório"),
  username: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading: authLoading, user, initialLoadComplete } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { companyCode: "", username: "", password: "" },
  });

  /* ------------------------------------------------------------------ */
  /* Redireciona se já estiver logado                                   */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (initialLoadComplete && user) {
      router.replace("/dashboard");
    }
  }, [initialLoadComplete, user, router]);

  /* Pré‑preenche código da empresa via query string ?codigo=XX */
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const empresaCodigo = new URLSearchParams(window.location.search).get(
        "codigo"
      );
      if (empresaCodigo) form.setValue("companyCode", empresaCodigo);
    }
  }, [form]);

  /* ------------------------------------------------------------------ */
  /* Submit                                                             */
  /* ------------------------------------------------------------------ */
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(data.companyCode, data.username, data.password);
      toast({
        title: "Login Bem-sucedido",
        description: "Redirecionando para o painel...",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado no login.";
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting || !initialLoadComplete;

  if (!initialLoadComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Image
            src="https://bibitrack.com.br/adm/assets/img/logo.png"
            alt="BIBI.track Logo"
            width={96}
            height={40}
            className="mx-auto mb-4 h-12 w-auto"
            priority
          />
          <CardTitle className="text-2xl font-bold text-primary">
            BIBI.track
          </CardTitle>
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
                    <FormLabel className="flex items-center gap-2">
                      <Building size={16} /> Código da Empresa
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 0323"
                        {...field}
                        disabled={isLoading}
                        required
                      />
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
                    <FormLabel className="flex items-center gap-2">
                      <User size={16} /> Login
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Seu login"
                        {...field}
                        disabled={isLoading}
                        required
                      />
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
                    <FormLabel className="flex items-center gap-2">
                      <KeyRound size={16} /> Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Sua senha"
                        {...field}
                        disabled={isLoading}
                        required
                      />
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

