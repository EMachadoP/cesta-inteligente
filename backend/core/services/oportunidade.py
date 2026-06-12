"""
Serviço de cálculo de oportunidade de compra por produto.
"""
from django.db.models import Min

from core.models import Produto, Compra


def normalizar(valor, minimo, maximo):
    """Normaliza valor entre 0 e 100."""
    if maximo == minimo:
        return 50.0
    return max(0.0, min(100.0, ((valor - minimo) / (maximo - minimo)) * 100.0))


def calcular_oportunidade(produto):
    """
    Retorna um dicionário com índice de oportunidade (0-100) e detalhamento.

    Pesos:
      - 40% relação entre preço atual/médio e menor preço histórico.
      - 30% estoque baixo (menor estoque = maior pontuação).
      - 30% consumo mensal (maior consumo = maior pontuação).
    """
    preco_medio = float(produto.preco_medio() or 0)
    menor_preco = float(produto.menor_preco() or 0)
    estoque = float(produto.estoque_atual)
    estoque_minimo = float(produto.estoque_minimo)
    consumo = produto.consumo_mensal_medio()

    # Pontuação de preço: quanto menor o preço atual em relação ao histórico, melhor.
    if preco_medio > 0 and menor_preco > 0:
        razao_preco = float(menor_preco) / float(preco_medio)
        pontuacao_preco = min(100.0, razao_preco * 100)
    else:
        pontuacao_preco = 50.0

    # Pontuação de estoque: estoque baixo deve ter pontuação alta.
    # Usamos a distância até o mínimo invertida.
    if estoque_minimo > 0:
        razao_estoque = estoque / estoque_minimo
        if razao_estoque <= 0:
            pontuacao_estoque = 100.0
        elif razao_estoque >= 2:
            pontuacao_estoque = 0.0
        else:
            pontuacao_estoque = (2 - razao_estoque) * 50.0
    else:
        if estoque <= 0:
            pontuacao_estoque = 100.0
        else:
            pontuacao_estoque = max(0.0, 100.0 - estoque * 5)

    # Pontuação de consumo: maior consumo = maior prioridade de compra.
    todos_consumos = [
        p.consumo_mensal_medio()
        for p in Produto.objects.filter(ativo=True)
    ]
    if todos_consumos:
        max_consumo = max(todos_consumos)
        min_consumo = min(todos_consumos)
        pontuacao_consumo = normalizar(consumo, min_consumo, max_consumo)
    else:
        pontuacao_consumo = 50.0

    indice = (
        pontuacao_preco * 0.40
        + pontuacao_estoque * 0.30
        + pontuacao_consumo * 0.30
    )

    return {
        'produto_id': produto.id,
        'produto': produto.nome,
        'indice': round(indice, 2),
        'preco_atual': round(preco_medio, 2),
        'menor_preco': round(menor_preco, 2),
        'pontuacao_preco': round(pontuacao_preco, 2),
        'estoque_atual': round(estoque, 3),
        'estoque_minimo': round(estoque_minimo, 3),
        'pontuacao_estoque': round(pontuacao_estoque, 2),
        'consumo_mensal_medio': round(consumo, 3),
        'pontuacao_consumo': round(pontuacao_consumo, 2),
    }


def ranking_oportunidades(limite=10):
    """Retorna ranking de produtos ordenados por índice de oportunidade."""
    produtos = Produto.objects.filter(ativo=True)
    ranking = [calcular_oportunidade(p) for p in produtos]
    ranking.sort(key=lambda x: x['indice'], reverse=True)
    return ranking[:limite]
