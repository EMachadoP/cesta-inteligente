from django.contrib import admin

from core.models import (
    Categoria,
    Fornecedor,
    Produto,
    Marca,
    Compra,
    Promocao,
    Alerta,
    MontagemCesta,
    ItemCesta,
)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome']
    search_fields = ['nome']


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome']
    search_fields = ['nome']


class MarcaInline(admin.TabularInline):
    model = Marca
    extra = 1


class CompraInline(admin.TabularInline):
    model = Compra
    extra = 0
    readonly_fields = ['valor_unitario']


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'nome',
        'categoria',
        'quantidade_por_cesta',
        'unidade',
        'estoque_atual',
        'estoque_minimo',
        'ativo',
    ]
    list_filter = ['categoria', 'ativo']
    search_fields = ['nome', 'marca_preferencial']
    inlines = [MarcaInline, CompraInline]


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'produto']
    list_filter = ['produto__categoria']
    search_fields = ['nome', 'produto__nome']


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'data',
        'produto',
        'marca',
        'quantidade',
        'valor_total',
        'valor_unitario',
        'fornecedor',
    ]
    list_filter = ['data', 'produto__categoria', 'fornecedor']
    search_fields = ['produto__nome', 'marca', 'observacao']
    date_hierarchy = 'data'


@admin.register(Promocao)
class PromocaoAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'produto',
        'fornecedor',
        'preco',
        'validade',
        'data_cadastro',
    ]
    list_filter = ['validade', 'fornecedor']
    search_fields = ['produto__nome', 'observacao']


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ['id', 'produto', 'preco_maximo', 'ativo']
    list_filter = ['ativo']
    search_fields = ['produto__nome']


class ItemCestaInline(admin.TabularInline):
    model = ItemCesta
    extra = 1


@admin.register(MontagemCesta)
class MontagemCestaAdmin(admin.ModelAdmin):
    list_display = ['id', 'mes_referencia', 'data_criacao']
    inlines = [ItemCestaInline]


@admin.register(ItemCesta)
class ItemCestaAdmin(admin.ModelAdmin):
    list_display = ['id', 'montagem', 'produto', 'quantidade']
    list_filter = ['montagem__mes_referencia']
    search_fields = ['produto__nome']
