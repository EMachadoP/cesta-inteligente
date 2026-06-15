"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KeyRound className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Esqueci minha senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Para redefinir sua senha, entre em contato com o administrador do
            sistema. Ele poderá gerar uma nova senha para o seu usuário.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
