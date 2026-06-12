"""
Serviço de inteligência de compras com Google Gemini.
"""
import os
from decimal import Decimal

from django.conf import settings

from core.models import Produto, Promocao
from core.services.oportunidade import ranking_oportunidades


def _fallback_recomendacao():
    """Retorna recomendação local quando a API Gemini não está configurada."""
    top = ranking_oportunidades(limite=5)
    linhas = []
    for item in top:
        motivo = []
        if item['pontuacao_estoque'] >= 70:
            motivo.append('estoque baixo')
        if item['pontuacao_preco'] >= 60:
            motivo.append('preço competitivo')
        if item['pontuacao_consumo'] >= 60:
            motivo.append('alto consumo')
        motivo_txt = ', '.join(motivo) if motivo else 'oportunidade geral'
        linhas.append(
            f"- {item['produto']} (índice {item['indice']}): {motivo_txt}"
        )

    return {
        'recomendacao': 'API Gemini não configurada. Usando heurística local.',
        'detalhes': (
            'Configure a variável de ambiente GEMINI_API_KEY para habilitar '
            'recomendações geradas por IA.'
        ),
        'top_oportunidades': top,
        'texto': (
            'Recomendação de compra (fallback):\n'
            + '\n'.join(linhas)
            + '\n\nPriorize produtos com estoque baixo e preço próximo ao '
            'menor histórico.'
        ),
    }


def gerar_recomendacao_compra():
    """
    Gera recomendação de compra usando Google Gemini.

    Se GEMINI_API_KEY não estiver configurada, retorna resposta fallback
    baseada no ranking de oportunidades local.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        return _fallback_recomendacao()

    try:
        from google import genai
    except ImportError:
        return _fallback_recomendacao()

    ranking = ranking_oportunidades(limite=10)
    promocoes = Promocao.objects.select_related('produto', 'fornecedor').order_by('preco')[:10]

    prompt = _montar_prompt(ranking, promocoes)

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        texto = response.text or ''
    except Exception as exc:
        fallback = _fallback_recomendacao()
        fallback['erro_api'] = str(exc)
        return fallback

    return {
        'recomendacao': 'Recomendação gerada por IA.',
        'texto': texto,
        'top_oportunidades': ranking,
        'promocoes': [
            {
                'produto': p.produto.nome,
                'fornecedor': p.fornecedor.nome if p.fornecedor else None,
                'preco': float(p.preco),
                'validade': p.validade.isoformat() if p.validade else None,
            }
            for p in promocoes
        ],
    }


def _montar_prompt(ranking, promocoes):
    """Monta o prompt para a Gemini API."""
    linhas_ranking = []
    for item in ranking:
        linhas_ranking.append(
            f"{item['produto']}: índice {item['indice']}, "
            f"preço médio R$ {item['preco_atual']}, "
            f"menor histórico R$ {item['menor_preco']}, "
            f"estoque {item['estoque_atual']}, "
            f"consumo mensal {item['consumo_mensal_medio']}"
        )

    linhas_promocoes = []
    for p in promocoes:
        linhas_promocoes.append(
            f"{p.produto.nome}: R$ {p.preco} "
            f"({'válido até ' + p.validade.isoformat() if p.validade else 'sem validade'})"
        )

    prompt = """Você é um assistente de compras para um banco de alimentos.
Analise os dados abaixo e gere uma recomendação de compra objetiva em português.
Inclua:
1. Top 3 produtos para comprar agora e o motivo.
2. Produtos que podem esperar.
3. Dicas de economia com base no histórico de preços.

Ranking de oportunidade (índice 0-100):
{ranking}

Promoções ativas:
{promocoes}

Responda de forma direta, em português, com no máximo 10 linhas.
""".format(
        ranking='\n'.join(linhas_ranking) or 'Sem dados.',
        promocoes='\n'.join(linhas_promocoes) or 'Sem promoções.',
    )
    return prompt
