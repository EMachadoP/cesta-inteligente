# Cadastro de Conta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar cadastro de conta protegido por código de convite, página de "esqueci a senha" (reset manual pelo admin) e remover as credenciais demo da tela de login.

**Architecture:** Endpoint DRF `POST /api/auth/register` (`AllowAny`) que valida um código de convite vindo de `settings.REGISTRATION_INVITE_CODE`, cria usuário comum e retorna tokens JWT (auto-login). No frontend, novas páginas `/register` e `/forgot-password`, função `register` em `lib/auth.ts`, e ajustes na tela de login.

**Tech Stack:** Django 5.2 + DRF + SimpleJWT (backend, testes via `manage.py test`); Next.js 14 + React + shadcn/ui (frontend).

---

### Task 1: Backend — settings + RegisterSerializer

**Files:**
- Modify: `backend/cesta_inteligente/settings.py` (perto de `GEMINI_API_KEY`, linha ~137)
- Modify: `backend/core/serializers.py` (adicionar ao final)
- Test: `backend/core/test_auth.py` (criar)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/core/test_auth.py`:

```python
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(REGISTRATION_INVITE_CODE="SEGREDO123")
class RegisterEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/register"
        self.payload = {
            "username": "novo",
            "email": "novo@exemplo.com",
            "password": "umaSenhaForte9",
            "invite_code": "SEGREDO123",
        }

    def test_cadastro_valido_retorna_tokens(self):
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["username"], "novo")
        user = User.objects.get(username="novo")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_codigo_invalido_recusa(self):
        payload = {**self.payload, "invite_code": "ERRADO"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(username="novo").exists())

    def test_username_duplicado_recusa(self):
        User.objects.create_user(username="novo", password="x")
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 400)

    def test_senha_fraca_recusa(self):
        payload = {**self.payload, "password": "123"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 400)

    @override_settings(REGISTRATION_INVITE_CODE="")
    def test_cadastro_desabilitado_quando_sem_codigo(self):
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(username="novo").exists())
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `cd backend && ./.venv/Scripts/python.exe manage.py test core.test_auth -v 2`
Expected: FAIL (404 no endpoint / serializer inexistente).

- [ ] **Step 3: Adicionar a variável em settings.py**

Adicionar logo após a linha `GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')`:

```python
REGISTRATION_INVITE_CODE = os.getenv('REGISTRATION_INVITE_CODE', '')
```

- [ ] **Step 4: Adicionar o RegisterSerializer**

No topo de `backend/core/serializers.py`, garantir imports:

```python
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
```

Ao final do arquivo:

```python
class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    invite_code = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Usuário já existe.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_invite_code(self, value):
        expected = settings.REGISTRATION_INVITE_CODE
        if not expected:
            raise serializers.ValidationError("Cadastro desabilitado no momento.")
        if value != expected:
            raise serializers.ValidationError("Código de convite inválido.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
```

- [ ] **Step 5: Commit (parcial — serializer e settings)**

```bash
git add backend/cesta_inteligente/settings.py backend/core/serializers.py backend/core/test_auth.py
git commit -m "feat(backend): RegisterSerializer + var REGISTRATION_INVITE_CODE"
```

---

### Task 2: Backend — RegisterView + rota

**Files:**
- Modify: `backend/core/views.py` (perto de `LoginView`, linha ~220)
- Modify: `backend/core/urls.py`

- [ ] **Step 1: Adicionar a view**

Em `backend/core/views.py`, adicionar import no topo (junto aos outros DRF):

```python
from rest_framework.views import APIView
```

E importar o serializer (na lista `from core.serializers import (...)`): adicionar `RegisterSerializer`.

Adicionar a classe após `RefreshView`:

```python
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )
```

- [ ] **Step 2: Registrar a rota**

Em `backend/core/urls.py`, adicionar `RegisterView` ao import `from core.views import (...)` e a rota dentro de `urlpatterns`, após a linha do `login`:

```python
    path('auth/register', RegisterView.as_view(), name='register'),
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `cd backend && ./.venv/Scripts/python.exe manage.py test core.test_auth -v 2`
Expected: PASS (5 testes).

- [ ] **Step 4: Commit**

```bash
git add backend/core/views.py backend/core/urls.py
git commit -m "feat(backend): endpoint POST /api/auth/register com auto-login"
```

---

### Task 3: Frontend — função register em lib/auth.ts

**Files:**
- Modify: `frontend/src/lib/auth.ts` (após a função `login`, linha ~160)

- [ ] **Step 1: Adicionar helper de extração de erro + função register**

Adicionar ao final de `frontend/src/lib/auth.ts`:

```typescript
function extractFirstError(err: Record<string, unknown>): string | null {
  for (const value of Object.values(err)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return null;
}

export async function register(
  username: string,
  email: string,
  password: string,
  inviteCode: string
): Promise<Tokens> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password,
      invite_code: inviteCode,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { detail?: string }).detail ||
      extractFirstError(err as Record<string, unknown>) ||
      "Erro ao criar conta";
    throw new Error(msg);
  }

  const data = await res.json();
  const tokens: Tokens = { access: data.access, refresh: data.refresh };
  saveTokens(tokens);
  return tokens;
}
```

- [ ] **Step 2: Verificar compilação de tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/auth.ts
git commit -m "feat(frontend): funcao register em lib/auth"
```

---

### Task 4: Frontend — AuthContext.register + rotas públicas

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Atualizar imports, interface e rotas públicas**

Em `frontend/src/contexts/AuthContext.tsx`:

Trocar o import de `@/lib/auth` para incluir `register`:

```typescript
import {
  User,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getAccessToken,
  getCurrentUser,
} from "@/lib/auth";
```

Atualizar a interface `AuthContextType` adicionando:

```typescript
  register: (
    username: string,
    email: string,
    password: string,
    inviteCode: string
  ) => Promise<void>;
```

Trocar `const PUBLIC_ROUTES = ["/login"];` por:

```typescript
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];
```

- [ ] **Step 2: Adicionar a função register e expô-la no provider**

Após a função `login`, adicionar:

```typescript
  async function register(
    username: string,
    email: string,
    password: string,
    inviteCode: string
  ) {
    await authRegister(username, email, password, inviteCode);
    const current = await getCurrentUser();
    setUser(current);
    router.replace("/");
  }
```

Atualizar o `value` do provider:

```typescript
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
```

Também trocar, no segundo `useEffect`, a condição de redirect de logado:
`if (isAuthenticated && pathname === "/login")` →
`if (isAuthenticated && PUBLIC_ROUTES.includes(pathname))`.

- [ ] **Step 3: Verificar compilação**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat(frontend): AuthContext.register e rotas publicas"
```

---

### Task 5: Frontend — página /register

**Files:**
- Create: `frontend/src/app/register/page.tsx`

- [ ] **Step 1: Criar a página**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(username, email, password, inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Criar conta
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de convite</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar conta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/register/page.tsx
git commit -m "feat(frontend): pagina de cadastro /register"
```

---

### Task 6: Frontend — página /forgot-password

**Files:**
- Create: `frontend/src/app/forgot-password/page.tsx`

- [ ] **Step 1: Criar a página estática**

```tsx
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
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/forgot-password/page.tsx
git commit -m "feat(frontend): pagina /forgot-password (reset manual)"
```

---

### Task 7: Frontend — limpeza da tela de login

**Files:**
- Modify: `frontend/src/app/login/page.tsx`

- [ ] **Step 1: Limpar defaults, remover msg demo, adicionar links**

Trocar:
```typescript
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
```
por:
```typescript
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
```

Adicionar `import Link from "next/link";` no topo.

Substituir o bloco final (a partir de `<p className="mt-4 ...">Usuário demo...`) por:

```tsx
          <div className="mt-4 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
            <p>
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </p>
          </div>
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "feat(frontend): remove credenciais demo e adiciona links de cadastro/reset"
```

---

### Task 8: Ajustar e2e que dependia da credencial demo

**Files:**
- Modify: `frontend/e2e/test_telas.spec.ts`

- [ ] **Step 1: Inspecionar o teste**

Run: `cd frontend && grep -n "admin\|admin123\|demo\|#username\|#password" e2e/test_telas.spec.ts`
Identificar o passo de login que dependia do pré-preenchimento.

- [ ] **Step 2: Garantir que o login preenche as credenciais explicitamente**

No passo de login do e2e, assegurar que o teste digita usuário/senha em vez de confiar no valor pré-preenchido. Exemplo de trecho a usar:

```typescript
await page.fill('#username', 'admin');
await page.fill('#password', 'admin123');
await page.getByRole('button', { name: 'Entrar' }).click();
```

Remover qualquer asserção que verifique a presença do texto "Usuário demo".

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/test_telas.spec.ts
git commit -m "test(e2e): login digita credenciais; remove dependencia da msg demo"
```

---

### Task 9: Deploy + configuração + docs

**Files:**
- Modify: `PROJECT_CONTEXT.md`

- [ ] **Step 1: Setar REGISTRATION_INVITE_CODE no Railway**

(Operador com `RAILWAY_TOKEN` do projeto `joyful-enchantment`.) Escolher um código secreto e:

```bash
export RAILWAY_TOKEN=<token-do-projeto-cesta-inteligente>
cd backend
railway variables --service cesta-inteligente --environment production \
  --set "REGISTRATION_INVITE_CODE=<codigo-secreto>"
```

- [ ] **Step 2: Build de produção do frontend**

Run: `cd frontend && npm run build`
Expected: build conclui sem erros.

- [ ] **Step 3: Push do backend (dispara redeploy no Railway)**

```bash
git push origin main
```

- [ ] **Step 4: Deploy do frontend na Vercel**

Run: `cd frontend && vercel --prod --yes --scope eldons-projects-3194802d`
Expected: deploy READY em `https://cesta-inteligente.vercel.app`.

- [ ] **Step 5: Verificação ponta a ponta**

- Cadastro com código correto → cria conta e loga (redireciona ao dashboard).
- Cadastro com código errado → erro "Código de convite inválido".
- Login sem campos pré-preenchidos e sem a mensagem demo.
- `/forgot-password` mostra a mensagem de contato com o admin.

- [ ] **Step 6: Atualizar PROJECT_CONTEXT e commitar**

Documentar: endpoint `/api/auth/register`, variável `REGISTRATION_INVITE_CODE`, páginas `/register` e `/forgot-password`, fluxo de reset manual via `/admin/`.

```bash
git add PROJECT_CONTEXT.md
git commit -m "docs: registra cadastro por convite, reset manual e limpeza do login"
git push origin main
```
