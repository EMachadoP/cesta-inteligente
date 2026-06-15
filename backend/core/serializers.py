"""
Serializers da API do Cesta Inteligente.
"""
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

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


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome']


class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = ['id', 'nome']


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id', 'nome', 'produto']


class ProdutoListSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source='categoria',
        write_only=True,
        required=False,
    )
    categoria_nome = serializers.CharField(write_only=True, required=False)
    status_estoque = serializers.CharField(read_only=True)
    preco_medio = serializers.SerializerMethodField()
    menor_preco = serializers.SerializerMethodField()
    consumo_mensal_medio = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = [
            'id',
            'nome',
            'categoria',
            'categoria_id',
            'categoria_nome',
            'quantidade_por_cesta',
            'unidade',
            'marca_preferencial',
            'estoque_atual',
            'estoque_minimo',
            'ativo',
            'status_estoque',
            'preco_medio',
            'menor_preco',
            'consumo_mensal_medio',
        ]

    def get_preco_medio(self, obj):
        preco = obj.preco_medio()
        return round(preco, 2) if preco is not None else None

    def get_menor_preco(self, obj):
        preco = obj.menor_preco()
        return round(preco, 2) if preco is not None else None

    def get_consumo_mensal_medio(self, obj):
        return round(obj.consumo_mensal_medio(), 3)

    def _resolve_categoria(self, validated_data):
        categoria_nome = validated_data.pop('categoria_nome', None)
        if categoria_nome and 'categoria' not in validated_data:
            categoria, _ = Categoria.objects.get_or_create(nome=categoria_nome.strip())
            validated_data['categoria'] = categoria
        return validated_data

    def create(self, validated_data):
        validated_data = self._resolve_categoria(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._resolve_categoria(validated_data)
        return super().update(instance, validated_data)


class CompraSerializer(serializers.ModelSerializer):
    produto = ProdutoListSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True,
    )
    fornecedor = FornecedorSerializer(read_only=True)
    fornecedor_id = serializers.PrimaryKeyRelatedField(
        queryset=Fornecedor.objects.all(),
        source='fornecedor',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Compra
        fields = [
            'id',
            'data',
            'produto',
            'produto_id',
            'marca',
            'quantidade',
            'valor_total',
            'valor_unitario',
            'fornecedor',
            'fornecedor_id',
            'observacao',
        ]
        read_only_fields = ['valor_unitario']


class CompraHistoricoSerializer(serializers.ModelSerializer):
    produto = serializers.CharField(source='produto.nome', read_only=True)
    fornecedor = FornecedorSerializer(read_only=True)

    class Meta:
        model = Compra
        fields = ['id', 'data', 'produto', 'marca', 'quantidade', 'valor_total', 'valor_unitario', 'fornecedor']


class PromocaoSerializer(serializers.ModelSerializer):
    produto = ProdutoListSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True,
    )
    fornecedor = FornecedorSerializer(read_only=True)
    fornecedor_id = serializers.PrimaryKeyRelatedField(
        queryset=Fornecedor.objects.all(),
        source='fornecedor',
        write_only=True,
        required=False,
        allow_null=True,
    )
    menor_historico = serializers.SerializerMethodField()

    class Meta:
        model = Promocao
        fields = [
            'id',
            'produto',
            'produto_id',
            'fornecedor',
            'fornecedor_id',
            'preco',
            'validade',
            'observacao',
            'data_cadastro',
            'menor_historico',
        ]

    def get_menor_historico(self, obj):
        menor = obj.produto.menor_preco()
        if menor is None:
            return False
        return float(obj.preco) <= float(menor)


class AlertaSerializer(serializers.ModelSerializer):
    produto = ProdutoListSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True,
    )

    class Meta:
        model = Alerta
        fields = ['id', 'produto', 'produto_id', 'preco_maximo', 'ativo']


class ItemCestaSerializer(serializers.ModelSerializer):
    produto = ProdutoListSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True,
    )

    class Meta:
        model = ItemCesta
        fields = ['id', 'montagem', 'produto', 'produto_id', 'quantidade']


class MontagemCestaSerializer(serializers.ModelSerializer):
    itens = ItemCestaSerializer(many=True, read_only=True)
    custo_total = serializers.SerializerMethodField()

    class Meta:
        model = MontagemCesta
        fields = ['id', 'mes_referencia', 'data_criacao', 'itens', 'custo_total']

    def get_custo_total(self, obj):
        return round(obj.custo_total(), 2)


class ComparativoMarcasSerializer(serializers.Serializer):
    marca = serializers.CharField()
    compras_count = serializers.IntegerField()
    menor_preco = serializers.DecimalField(max_digits=10, decimal_places=2)
    preco_medio = serializers.DecimalField(max_digits=10, decimal_places=2)


class EstoqueSerializer(serializers.ModelSerializer):
    categoria = serializers.CharField(source='categoria.nome', read_only=True)
    status = serializers.CharField(source='status_estoque', read_only=True)
    preco_medio = serializers.SerializerMethodField()
    consumo_mensal_medio = serializers.SerializerMethodField()
    cobertura_meses = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = [
            'id',
            'nome',
            'categoria',
            'unidade',
            'estoque_atual',
            'estoque_minimo',
            'status',
            'preco_medio',
            'consumo_mensal_medio',
            'cobertura_meses',
        ]

    def get_preco_medio(self, obj):
        preco = obj.preco_medio()
        return round(preco, 2) if preco is not None else None

    def get_consumo_mensal_medio(self, obj):
        return round(obj.consumo_mensal_medio(), 3)

    def get_cobertura_meses(self, obj):
        consumo = obj.consumo_mensal_medio()
        if consumo <= 0:
            return None
        return round(float(obj.estoque_atual) / consumo, 2)


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
