# Cadastro de Conta, Reset Manual e Limpeza do Login — Design

**Data:** 2026-06-15
**Status:** Aprovado

## Objetivo
Permitir que novos usuários criem conta (com barreira por código de convite),
oferecer um caminho de "esqueci a senha" (reset manual pelo admin) e remover as
credenciais de demonstração da tela de login.

## Contexto
- Autenticação via SimpleJWT. `POST /api/auth/login` e `/auth/refresh` são `AllowAny`;
  o resto exige `IsAuthenticated`.
- **Base de dados compartilhada**: os modelos (produtos, compras, etc.) não têm dono
  por usuário. Todo usuário autenticado vê e edita os mesmos dados.
- Backend **sem e-mail configurado** (sem `EMAIL_*`).
- Login atual (`frontend/src/app/login/page.tsx`) vem com campos pré-preenchidos
  `admin`/`admin123` e exibe a mensagem "Usuário demo: admin / Senha: admin123".

## Decisões
1. **Cadastro com código de convite** (base permanece compartilhada).
2. **Reset de senha manual** pelo admin via `/admin/` — sem infra de e-mail.
3. Novos usuários são **comuns** (`is_staff=False`, `is_superuser=False`).
4. Após cadastro bem-sucedido, **auto-login** (retorna tokens JWT).

## Backend (Django)
- Endpoint `POST /api/auth/register` (`AllowAny`).
- Serializer `RegisterSerializer` valida:
  - `username` — obrigatório, único.
  - `email` — obrigatório, formato válido.
  - `password` — obrigatório, passa pelos `AUTH_PASSWORD_VALIDATORS` do Django (mín. 8).
  - `invite_code` — obrigatório; deve ser igual a `settings.REGISTRATION_INVITE_CODE`.
- Regras:
  - Se `REGISTRATION_INVITE_CODE` estiver vazio/ausente → **recusa todo cadastro**
    (fail-safe): 400 com "Cadastro desabilitado".
  - Se `invite_code` não conferir → 400 "Código de convite inválido".
  - Se `username` já existir → 400 "Usuário já existe".
  - Sucesso → cria `User` comum, retorna `{ access, refresh, user: {...} }` (HTTP 201).
- `REGISTRATION_INVITE_CODE = os.getenv('REGISTRATION_INVITE_CODE', '')` em settings.
- Variável setada no Railway (serviço `cesta-inteligente`).

## Frontend (Next.js)
- **`/register`** (nova página pública): campos usuário, e-mail, senha, código de convite.
  On success: salva tokens (mesmo fluxo do `AuthContext.login`) e redireciona ao dashboard.
  Exibe erros do backend (código inválido, usuário duplicado, senha fraca).
- **`/forgot-password`** (nova página pública): texto estático
  "Para redefinir sua senha, entre em contato com o administrador do sistema." + link "Voltar ao login".
- **`/login`** (ajuste):
  - Remover a mensagem "Usuário demo: admin / Senha: admin123".
  - Limpar os defaults dos campos (`useState("")` em vez de `admin`/`admin123`).
  - Adicionar links "Criar conta" (→ `/register`) e "Esqueci minha senha" (→ `/forgot-password`).
- `AuthContext`/`api.ts`: adicionar função `register(...)` reaproveitando o armazenamento de tokens.

## Testes
- Backend: registro com código válido (201 + tokens), código inválido (400),
  cadastro desabilitado quando a var está vazia (400), username duplicado (400),
  senha fraca (400).
- Ajustar o e2e (`frontend/e2e/test_telas.spec.ts`) que referencia a credencial demo,
  já que o pré-preenchimento será removido.

## Fora de escopo (YAGNI)
Multi-tenancy / dados por usuário, verificação de e-mail, rate-limiting,
expiração/uso-único de convite, reset de senha por e-mail.

## Riscos
- Código de convite é um segredo compartilhado único; se vazar, qualquer um se cadastra.
  Mitigação: trocar a var no Railway quando necessário.
- Base compartilhada: todo usuário cadastrado vê todos os dados (aceito nesta fase).
