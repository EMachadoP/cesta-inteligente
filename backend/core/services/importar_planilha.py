"""
Serviço para importar dados da planilha Excel para o banco de dados.
"""
import os
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pandas as pd
from django.db import transaction

from core.models import Categoria, Compra, Fornecedor, Marca, Produto


MESES_PT = {
    'JANEIRO': 1,
    'FEVEREIRO': 2,
    'MARÇO': 3,
    'MARCO': 3,
    'ABRIL': 4,
    'MAIO': 5,
    'JUNHO': 6,
    'JULHO': 7,
    'AGOSTO': 8,
    'SETEMBRO': 9,
    'OUTUBRO': 10,
    'NOVEMBRO': 11,
    'DEZEMBRO': 12,
}

PRODUTO_ALIASES = {
    'marcarrão': 'macarrão',
    'marcarrao': 'macarrao',
    'macarão': 'macarrão',
    'macarrao': 'macarrão',
    'fubas': 'fubá',
    'fuba': 'fubá',
    'fubá': 'fubá',
    'açucar': 'açúcar',
    'acucar': 'açúcar',
    'açúcar': 'açúcar',
    'óleo': 'óleo',
    'oleo': 'óleo',
    'feijões': 'feijão',
    'feijoes': 'feijão',
    'feijão': 'feijão',
    'molhos': 'molho tomate',
    'molho tomate': 'molho tomate',
    'molho/extrato': 'molho tomate',
    'massa bolo': 'massa bolo',
    'trigo': 'trigo',
    'farinha': 'farinha',
    'bolacha': 'bolacha',
    'leite': 'leite',
    'arroz': 'arroz',
}

MARCA_ALIASES = {
    'bomsabor': 'bom sabor',
    'bonsabor': 'bom sabor',
    'bom sabor': 'bom sabor',
    'vitamassa': 'vitamassa',
    'vitarella': 'vitarella',
    'flokão': 'flocos',
    'flokao': 'flocos',
    'flocão': 'flocos',
    'floco': 'flocos',
    'flocos': 'flocos',
    'gostosin': 'gostosinho',
    'gostosinho': 'gostosinho',
    'fortmilho': 'fortmilho',
    'novomilho': 'novomilho',
    'perelac': 'perelac',
    'pilar': 'pilar',
    'marilan': 'marilan',
    'palmeron': 'palmeron',
    'italac': 'italac',
    'italak': 'italac',
    'feira nova': 'feira nova',
    'sítio novo': 'sítio novo',
    'sitio novo': 'sítio novo',
    'farina': 'farinha',
    'farinha': 'farinha',
    'soya': 'soya',
    'da casa': 'da casa',
    'princesa': 'princesa',
    'panelão': 'panelão',
    'panelao': 'panelão',
    'pop': 'pop',
    'kika': 'kika',
    'grão minas': 'grão minas',
    'grao minas': 'grão minas',
    'cristal': 'cristal',
}


def normalizar_texto(texto):
    """Remove espaços extras e converte para título."""
    if texto is None:
        return ''
    if pd.isna(texto):
        return ''
    texto = str(texto).strip()
    texto = re.sub(r'\s+', ' ', texto)
    return texto


def normalizar_produto(nome):
    """Normaliza nome do produto usando aliases."""
    nome = normalizar_texto(nome).lower()
    nome_sem_acento = nome.replace('ç', 'c').replace('ã', 'a').replace('õ', 'o')
    nome_sem_acento = nome_sem_acento.replace('á', 'a').replace('é', 'e').replace('í', 'i')
    nome_sem_acento = nome_sem_acento.replace('ó', 'o').replace('ú', 'u').replace('ê', 'e')
    for chave, valor in PRODUTO_ALIASES.items():
        if nome == chave or nome_sem_acento == chave:
            return valor
    return nome.title()


def normalizar_marca(nome):
    """Normaliza nome da marca usando aliases."""
    nome = normalizar_texto(nome).lower()
    nome_sem_acento = nome.replace('ç', 'c').replace('ã', 'a').replace('õ', 'o')
    nome_sem_acento = nome_sem_acento.replace('á', 'a').replace('é', 'e').replace('í', 'i')
    nome_sem_acento = nome_sem_acento.replace('ó', 'o').replace('ú', 'u').replace('ê', 'e')
    for chave, valor in MARCA_ALIASES.items():
        if nome == chave or nome_sem_acento == chave:
            return valor.title()
    return nome.title() if nome else 'Sem marca'


def parse_decimal(valor):
    """Converte valor para Decimal, tratando vírgulas e strings."""
    if valor is None or pd.isna(valor):
        return None
    if isinstance(valor, (int, float)):
        return Decimal(str(valor))
    texto = str(valor).strip().replace('R$', '').replace('unid', '').replace(' ', '')
    texto = texto.replace('.', '').replace(',', '.')
    try:
        return Decimal(texto)
    except InvalidOperation:
        return None


def identificar_mes(linhas_acima):
    """Procura nome de mês em uma lista de valores."""
    for linha in linhas_acima:
        for celula in linha:
            texto = normalizar_texto(celula).upper()
            texto = (
                texto.replace('Ç', 'C')
                .replace('Ã', 'A')
                .replace('Õ', 'O')
                .replace('Á', 'A')
                .replace('É', 'E')
                .replace('Í', 'I')
                .replace('Ó', 'O')
                .replace('Ú', 'U')
                .replace('Ê', 'E')
            )
            for nome_mes, numero in MESES_PT.items():
                if nome_mes in texto:
                    return numero
    return None


def extrair_blocos(df):
    """Extrai os blocos de cabeçalho e seus respectivos meses."""
    blocos = []
    for idx, row in df.iterrows():
        valores = [str(v).upper() if pd.notna(v) else '' for v in row]
        if any('PRODUTO' in v for v in valores):
            linhas_acima = [df.iloc[i].fillna('').tolist() for i in range(max(0, idx - 3), idx)]
            mes = identificar_mes(linhas_acima)
            if mes is None:
                continue
            colunas_interesse = []
            for c in range(len(row)):
                if pd.notna(row.iloc[c]) and str(row.iloc[c]).strip():
                    colunas_interesse.append(c)
            if not colunas_interesse:
                continue
            blocos.append({
                'linha_inicio': idx + 1,
                'mes': mes,
                'colunas': colunas_interesse,
            })
    return blocos


def ler_linha_bloco(df, idx, colunas):
    """Lê uma linha de dados dentro de um bloco."""
    row = df.iloc[idx]
    valores = {}
    for c in colunas:
        if c < len(row):
            valores[c] = row.iloc[c]
        else:
            valores[c] = None
    return valores


def encontrar_coluna(colunas, header_row, termos):
    """Encontra índice da coluna cujo cabeçalho contenha um dos termos."""
    for c in colunas:
        if c >= len(header_row):
            continue
        texto = str(header_row.iloc[c]).upper() if pd.notna(header_row.iloc[c]) else ''
        for termo in termos:
            if termo in texto:
                return c
    return None


def importar_planilha(caminho=None, ano=2026):
    """Importa a planilha padrão do projeto."""
    if caminho is None:
        raiz = Path(__file__).resolve().parent.parent.parent.parent
        caminho = raiz / 'Acompanhamento Cestas Básicas -.xlsx'

    caminho = Path(caminho)
    if not caminho.exists():
        raise FileNotFoundError(f'Planilha não encontrada: {caminho}')

    xl = pd.ExcelFile(str(caminho))
    registros = []
    saldos_por_mes = {}

    vistos = set()

    for sheet_name in xl.sheet_names:
        df = pd.read_excel(caminho, sheet_name=sheet_name, header=None)
        df = df.where(pd.notna(df), None)

        blocos = extrair_blocos(df)
        for bloco in blocos:
            linha = bloco['linha_inicio']
            mes = bloco['mes']
            colunas = bloco['colunas']
            header_row = df.iloc[linha - 1]

            col_produto = encontrar_coluna(colunas, header_row, ['PRODUTO'])
            col_quantidade = encontrar_coluna(colunas, header_row, ['QUANTIDADE', 'QTDE', 'QTD'])
            col_marca = encontrar_coluna(colunas, header_row, ['MARCA'])
            col_valor_total = encontrar_coluna(colunas, header_row, ['R$', 'VALOR', 'TOTAL'])
            col_valor_unit = encontrar_coluna(colunas, header_row, ['UNIT', 'UNID'])
            col_sobras = encontrar_coluna(colunas, header_row, ['SOBRAS', 'DISPONÍVEL', 'DISPONIVEL'])

            if col_produto is None or col_quantidade is None:
                continue

            while linha < len(df):
                valores = ler_linha_bloco(df, linha, colunas)
                nome_produto = normalizar_produto(valores.get(col_produto))
                if not nome_produto:
                    linha += 1
                    continue

                # Para de ler ao encontrar linha de total ou fim do bloco
                if nome_produto.lower() in ('nan', ''):
                    if pd.notna(valores.get(col_quantidade)) and str(valores.get(col_quantidade)).strip() != '':
                        pass
                    else:
                        break

                quantidade = parse_decimal(valores.get(col_quantidade)) or Decimal('1')
                marca = normalizar_marca(valores.get(col_marca))
                valor_total = parse_decimal(valores.get(col_valor_total))
                valor_unit = parse_decimal(valores.get(col_valor_unit))
                sobras = parse_decimal(valores.get(col_sobras))

                if quantidade is None or valor_total is None:
                    linha += 1
                    continue

                chave = (mes, nome_produto, float(quantidade), float(valor_total))
                if chave in vistos:
                    linha += 1
                    continue
                vistos.add(chave)

                registros.append({
                    'mes': mes,
                    'ano': ano,
                    'produto': nome_produto,
                    'marca': marca,
                    'quantidade': quantidade,
                    'valor_total': valor_total,
                    'valor_unitario': valor_unit,
                    'sobras': sobras,
                })

                if sobras is not None:
                    saldos_por_mes[(nome_produto, mes)] = sobras

                linha += 1

    return _salvar_registros(registros, saldos_por_mes)


def _salvar_registros(registros, saldos_por_mes):
    """Persiste os registros importados no banco de dados."""
    categoria_padrao, _ = Categoria.objects.get_or_create(nome='Alimentos')
    fornecedor_padrao, _ = Fornecedor.objects.get_or_create(nome='Geral')

    produtos_criados = {}
    compras_criadas = 0

    with transaction.atomic():
        for reg in registros:
            nome_produto = reg['produto']
            if nome_produto not in produtos_criados:
                produto, _ = Produto.objects.get_or_create(
                    nome=nome_produto,
                    defaults={
                        'categoria': categoria_padrao,
                        'quantidade_por_cesta': Decimal('1'),
                        'unidade': 'un',
                    },
                )
                produtos_criados[nome_produto] = produto
            else:
                produto = produtos_criados[nome_produto]

            if reg['marca']:
                Marca.objects.get_or_create(
                    nome=reg['marca'],
                    produto=produto,
                )

            Compra.objects.create(
                data=date(reg['ano'], reg['mes'], 1),
                produto=produto,
                marca=reg['marca'] or '',
                quantidade=reg['quantidade'],
                valor_total=reg['valor_total'],
                valor_unitario=reg['valor_unitario'],
                fornecedor=fornecedor_padrao,
                observacao=f'Importado da planilha - {reg["mes"]}/{reg["ano"]}',
            )
            compras_criadas += 1

        # Estoque inicial = sobras do último mês disponível (Junho/2026)
        for (nome_produto, mes), saldo in saldos_por_mes.items():
            if mes == 6:
                produto = produtos_criados.get(nome_produto)
                if produto:
                    produto.estoque_atual = saldo
                    produto.save(update_fields=['estoque_atual'])

    return {
        'produtos': len(produtos_criados),
        'compras': compras_criadas,
        'registros': len(registros),
    }

