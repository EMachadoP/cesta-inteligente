# Cesta Inteligente — Contexto do Projeto

## Visão Geral
Sistema de gestão de cestas básicas que transforma o controle de estoque em uma ferramenta de decisão de compra. Acompanha produtos, estoque, histórico de preços, comparação de marcas e indica o melhor momento para compra.

## Status Atual
- **Fase**: 1 (MVP entregue)
- **Estrutura**: Monorepo com backend Django (`backend/`) e frontend Next.js (`frontend/`).
- **Dados iniciais**: Planilha `Acompanhamento Cestas Básicas -.xlsx` (Fev–Mai/2026) importada para o banco.
- **Servidores de desenvolvimento**:
  - Backend: `http://localhost:8000`
  - Frontend: `http://localhost:3000`
- **Ambiente de produção (testes)**:
  - Backend: `https://cesta-inteligente-production.up.railway.app`
  - Frontend: `https://frontend-lsma3d257-eldons-projects-3194802d.vercel.app`
  - Banco de dados: PostgreSQL hospedado no Railway
  - Repositório: `https://github.com/EMachadoP/cesta-inteligente`

## Stack
- Backend: Django 5.2.15 + Django REST Framework + djangorestframework-simplejwt
- Frontend: Next.js 14.2.18 + React + Tailwind CSS + shadcn/ui
- Banco local: SQLite (`backend/db.sqlite3`)
- Banco produção: PostgreSQL (Railway)
- IA: Google Gemini API (`google-genai`) com fallback quando `GEMINI_API_KEY` não está configurada
- Python: 3.13.7
- Node: v22.20.0 / npm 11.15.0

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

### Frontend (desenvolvimento)
```bash
cd frontend
npm run dev
```

### Frontend (produção local)
```bash
cd frontend
npm run build
npm start
```

### Reimportar dados da planilha
```bash
cd backend
source .venv/Scripts/activate
python manage.py importar_planilha
```

## Dados Importados
Resumo atual do banco após importação da planilha:

| Entidade | Quantidade | Observação |
|---|---|---|
| Produtos | 12 | Todos ativos, categoria padrão "Alimentos" |
| Compras | 45 | Fev (24) + Abr (12) + Mai (9) |
| Fornecedores | 1 | "Geral" (planilha não possui fornecedor) |
| Marcas | 27 | Extraídas das células preenchidas da coluna "Marca" |
| Promoções | 0 | Planilha não possui aba de promoções |

**Atenção**: 19 compras ficaram com marca `"Sem marca"` porque a coluna "Marca" na aba "2º trimestre" (MAIO/2026) está em branco para esses itens na planilha original.

## Módulos Entregues (Fase 1)
1. ✅ Produtos — CRUD completo com categoria via `categoria_nome`
2. ✅ Compras — registro rápido com atualização automática de estoque
3. ✅ Histórico de Preços — tabela e gráfico
4. ✅ Comparativo de Marcas — menor preço e preço médio
5. ✅ Estoque — semáforo visual (acima/atenção/urgente)
6. ✅ Formação da Cesta — montagem mensal automática
7. ✅ Simulador — necessário / em estoque / falta comprar, com fluxo de **programação de compra** (botão Comprar, último preço, comparativo, substituição/acréscimo de produto e finalização)
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

## Deploy

### Railway (backend + PostgreSQL)
1. Criar projeto no Railway a partir do repositório GitHub.
2. Configurar **Root Directory** como `backend`.
3. Adicionar serviço **PostgreSQL** (o Railway cria `DATABASE_URL` automaticamente).
4. Configurar variáveis de ambiente:
   - `SECRET_KEY` — chave segura gerada
   - `DEBUG=False`
   - `ALLOWED_HOSTS=*`
   - `CORS_ALLOWED_ORIGINS=https://<url-do-frontend>.vercel.app`
5. Rodar no Console do Railway:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

### Vercel (frontend)
1. Criar projeto a partir do diretório `frontend/`.
2. Configurar variável de ambiente:
   - `NEXT_PUBLIC_API_URL=https://<url-do-backend>.railway.app`
3. O `next.config.js` desativa o proxy local quando `NEXT_PUBLIC_API_URL` está definido.

## Problemas Conhecidos e Soluções

### VS Code — "Servidor indisponível" no preview embutido
**Causa**: o navegador embutido do VS Code (Electron) pode ter problemas de rede/DNS com `localhost`.  
**Solução**: abra o sistema no **Chrome** ou **Edge** externo, acessando `http://localhost:3000`.


### Erro `Objects are not valid as a React child`
**Causa**: serializers do backend retornam objetos aninhados para `categoria`, `produto` e `fornecedor`, mas o frontend renderizava esses objetos diretamente.  
**Status**: Corrigido nas telas de Produtos, Estoque, Compras e Promoções (commit `871a49c`). Helpers `produtoNome`/`fornecedorNome` agora aceitam objetos ou IDs.

### Erro `ChunkLoadError: Loading chunk app/layout failed`
**Causa**: processos `node.exe` zumbis ou cache `.next` corrompido no modo dev.  
**Solução**:
1. Pare processos nas portas 3000/3001 (`taskkill //PID <PID> //F`)
2. Remova o cache: `rm -rf frontend/.next`
3. Gere build de produção: `npm run build && npm start`
4. No navegador, pressione `Ctrl+F5` para limpar cache

### Portas 3000/8000 ocupadas
Processos antigos do Node/Python podem ficar presos. Use `netstat -ano | grep :3000` para identificar o PID e `taskkill //PID <PID> //F` para finalizar. Também funciona `npx kill-port 3000`.

### Deploy no Railway retorna 502
**Causas comuns**:
- `Procfile` ou `requirements.txt` não encontrados na raiz do serviço.
- Erro no startup do Gunicorn ou nas variáveis de ambiente.
- Banco PostgreSQL não vinculado (`DATABASE_URL` ausente).

**Solução**:
1. Verifique no Railway se **Root Directory** está configurado como `backend`.
2. Confira os logs de deploy no dashboard do Railway.
3. Certifique-se de que o PostgreSQL foi adicionado ao projeto e que `DATABASE_URL` está definida.

## Próximos Passos (Fases 2 e 3)
- Scraping de preços de supermercados (Playwright/Apify)
- Alertas automáticos de preços
- Previsão de consumo e estoque com IA
- Permitir importar abas adicionais da planilha sem duplicar registros

## Convenções
- Commits em português, prefixados por área (`feat:`, `fix:`, `docs:`, `refactor:`).
- Backend expõe API REST em `/api/`.
- Frontend consome API via `src/lib/api.ts`.
- URLs de autenticação sem trailing slash para coincidir com as rotas do backend.
