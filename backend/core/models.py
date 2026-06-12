"""
Modelos do aplicativo core para o sistema Cesta Inteligente.
"""
from django.db import models
from django.conf import settings


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Fornecedor(models.Model):
    nome = models.CharField(max_length=200, unique=True)

    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Produto(models.Model):
    nome = models.CharField(max_length=200)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='produtos',
    )
    quantidade_por_cesta = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=1,
    )
    unidade = models.CharField(max_length=20, default='un')
    marca_preferencial = models.CharField(
        max_length=200,
        blank=True,
        null=True,
    )
    estoque_atual = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
    )
    estoque_minimo = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['nome']

    def __str__(self):
        return self.nome

    def preco_medio(self):
        compras = self.compras.exclude(quantidade=0)
        if not compras.exists():
            return None
        total_valor = sum((c.valor_total or 0) for c in compras)
        total_quantidade = sum((c.quantidade or 0) for c in compras)
        if total_quantidade == 0:
            return None
        return total_valor / total_quantidade

    def menor_preco(self):
        compras = self.compras.exclude(quantidade=0)
        if not compras.exists():
            return None
        return min((c.valor_unitario or 0) for c in compras)

    def consumo_mensal_medio(self):
        cestas_mes = getattr(settings, 'DEFAULT_CESTAS_MES', 16)
        return float(self.quantidade_por_cesta) * cestas_mes

    def status_estoque(self):
        estoque = float(self.estoque_atual)
        minimo = float(self.estoque_minimo)
        if minimo > 0 and estoque < minimo:
            return 'urgente'
        if minimo > 0 and estoque < minimo * 1.2:
            return 'atencao'
        return 'ok'


class Marca(models.Model):
    nome = models.CharField(max_length=200)
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='marcas',
    )

    class Meta:
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'
        ordering = ['nome']
        constraints = [
            models.UniqueConstraint(
                fields=['nome', 'produto'],
                name='unique_marca_por_produto',
            ),
        ]

    def __str__(self):
        return f'{self.nome} ({self.produto})'


class Compra(models.Model):
    data = models.DateField()
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='compras',
    )
    marca = models.CharField(max_length=200, blank=True, null=True)
    quantidade = models.DecimalField(max_digits=10, decimal_places=3)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    valor_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='compras',
    )
    observacao = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Compra'
        verbose_name_plural = 'Compras'
        ordering = ['-data', '-id']

    def __str__(self):
        return f'{self.produto} - {self.quantidade}un em {self.data}'

    def save(self, *args, **kwargs):
        if not self.valor_unitario and self.quantidade:
            try:
                self.valor_unitario = self.valor_total / self.quantidade
            except Exception:
                self.valor_unitario = None
        super().save(*args, **kwargs)
        if self.quantidade:
            self.produto.estoque_atual += self.quantidade
            self.produto.save(update_fields=['estoque_atual'])

    def delete(self, *args, **kwargs):
        if self.quantidade:
            self.produto.estoque_atual -= self.quantidade
            self.produto.save(update_fields=['estoque_atual'])
        super().delete(*args, **kwargs)


class Promocao(models.Model):
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='promocoes',
    )
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='promocoes',
    )
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    validade = models.DateField(blank=True, null=True)
    observacao = models.TextField(blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Promoção'
        verbose_name_plural = 'Promoções'
        ordering = ['-data_cadastro']

    def __str__(self):
        return f'{self.produto} - R$ {self.preco}'


class Alerta(models.Model):
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='alertas',
    )
    preco_maximo = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        ordering = ['produto__nome']

    def __str__(self):
        return f'{self.produto} - max R$ {self.preco_maximo}'


class MontagemCesta(models.Model):
    mes_referencia = models.DateField(unique=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Montagem de Cesta'
        verbose_name_plural = 'Montagens de Cesta'
        ordering = ['-mes_referencia']

    def __str__(self):
        return f'Cesta {self.mes_referencia:%Y-%m}'

    def custo_total(self):
        return sum(
            float(item.quantidade) * float(item.produto.preco_medio() or 0)
            for item in self.itens.select_related('produto')
        )


class ItemCesta(models.Model):
    montagem = models.ForeignKey(
        MontagemCesta,
        on_delete=models.CASCADE,
        related_name='itens',
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='itens_cesta',
    )
    quantidade = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        verbose_name = 'Item de Cesta'
        verbose_name_plural = 'Itens de Cesta'
        ordering = ['produto__nome']
        constraints = [
            models.UniqueConstraint(
                fields=['montagem', 'produto'],
                name='unique_item_montagem_produto',
            ),
        ]

    def __str__(self):
        return f'{self.produto} x {self.quantidade}'
