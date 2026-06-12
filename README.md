# Cesta Inteligente

Sistema de gestão de cestas básicas que transforma controle de estoque em ferramenta de decisão de compra.

## Tecnologias

- **Backend**: Django 5 + Django REST Framework
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Banco**: SQLite (dev) / PostgreSQL (prod)
- **IA**: Google Gemini API

## Como executar

### Pré-requisitos
- Python 3.13+
- Node.js 22+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
python manage.py migrate
python manage.py importar_planilha
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Funcionalidades

- Dashboard com KPIs e ranking de oportunidades
- Cadastro de produtos, compras, fornecedores e promoções
- Controle de estoque com alertas visuais
- Histórico de preços e comparativo de marcas
- Simulador de compras para N cestas
- Índice de oportunidade de compra
- Recomendações com IA (Gemini)

## Estrutura

```
CestaInteligente/
├── backend/      # Django + DRF
├── frontend/     # Next.js
├── PROJECT_CONTEXT.md
└── Acompanhamento Cestas Básicas -.xlsx
```
