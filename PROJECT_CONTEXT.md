# Cesta Inteligente — Contexto do Projeto

## Visão Geral
Sistema de gestão de cestas básicas que transforma o controle de estoque em uma ferramenta de decisão de compra. Acompanha produtos, estoque, histórico de preços, comparação de marcas e indica o melhor momento para compra.

## Status Atual
- **Fase**: 1 (MVP entregue)
- **Estrutura**: Monorepo com backend Django (`backend/`) e frontend Next.js (`frontend/`).
- **Dados iniciais**: Planilha `Acompanhamento Cestas Básicas -.xlsx` (Fev–Jun/2026) importada para o banco.
- **Servidores de desenvolvimento**:
  - Backend: `http://localhost:8000`
  - Frontend: `http://localhost:3000`

## Stack
- Backend: Django 5.2 + Django REST Framework
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Banco: SQLite (desenvolvimento) / PostgreSQL (produção)
- IA: Google Gemini API (`google-genai`) com fallback quando `GEMINI_API_KEY` não está configurada

## Autenticação
- Sistema protegido por JWT (SimpleJWT).
- Usuário demo criado automaticamente: `admin` / `admin123`.
- Telas privadas redirecionam para `/login` quando não autenticado.

## Como Executar

### Backend
```bash
cd backend
source .venv/Scripts/activate  # Windows Git Bash
python manage.py migrate
python manage.py criar_usuario_demo
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

### Reimportar dados da planilha
```bash
cd backend
source .venv/Scripts/activate
python manage.py importar_planilha
```

## Módulos Entregues (Fase 1)
1. ✅ Produtos — CRUD completo
2. ✅ Compras — registro rápido com atualização automática de estoque
3. ✅ Histórico de Preços — tabela e gráfico
4. ✅ Comparativo de Marcas — menor preço e preço médio
5. ✅ Estoque — semáforo visual (acima/atenção/urgente)
6. ✅ Formação da Cesta — montagem mensal automática
7. ✅ Simulador — necessário / em estoque / falta comprar
8. ✅ Promoções — cadastro manual com alerta de menor preço histórico
9. ✅ Inteligência de Compras — índice de oportunidade 0-100 + recomendação
10. ✅ Fornecedores — CRUD simples
11. ✅ Dashboard — KPIs e top oportunidades

## Endpoints da API
### Autenticação
- `POST /api/auth/login` → tokens access/refresh
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Módulos
- `GET/POST /api/produtos/`
- `GET/PUT/PATCH/DELETE /api/produtos/<id>/`
- `GET /api/produtos/<id>/historico-precos/`
- `GET /api/produtos/<id>/comparativo-marcas/`
- `GET/POST /api/compras/`
- `GET /api/estoque/`
- `GET /api/simulador/?cestas=N`
- `GET /api/formacao-cesta/?mes=YYYY-MM`
- `GET/POST /api/promocoes/`
- `GET/POST /api/fornecedores/`
- `GET/POST /api/alertas/`
- `GET /api/inteligencia/oportunidades/`
- `GET /api/inteligencia/recomendacao/`
- `GET /api/dashboard/resumo/`

## Próximos Passos (Fases 2 e 3)
- Scraping de preços de supermercados (Playwright/Apify)
- Alertas automáticos de preços
- Previsão de consumo e estoque com IA

## Convenções
- Commits em português, prefixados por área (`feat:`, `fix:`, `docs:`, `refactor:`).
- Backend expõe API REST em `/api/`.
- Frontend consome API via `src/lib/api.ts`.
