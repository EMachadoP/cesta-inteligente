"""
Views da API do Cesta Inteligente.
"""
from datetime import date

from django.db import models
from django.db.models import Avg, Count, Min
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from core.models import Alerta, Compra, Fornecedor, Produto, Promocao, MontagemCesta, ItemCesta
from core.serializers import (
    AlertaSerializer,
    ComparativoMarcasSerializer,
    CompraHistoricoSerializer,
    CompraSerializer,
    EstoqueSerializer,
    FornecedorSerializer,
    MontagemCestaSerializer,
    ProdutoListSerializer,
    PromocaoSerializer,
)
from core.services.inteligencia import gerar_recomendacao_compra
from core.services.oportunidade import ranking_oportunidades


class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.select_related('categoria').prefetch_related('marcas')
    serializer_class = ProdutoListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('ativo') is not None:
            ativo = self.request.query_params.get('ativo').lower() in ('1', 'true', 'sim')
            qs = qs.filter(ativo=ativo)
        return qs

    @action(detail=True, methods=['get'], url_path='historico-precos')
    def historico_precos(self, request, pk=None):
        produto = self.get_object()
        compras = produto.compras.order_by('data', 'id')
        serializer = CompraHistoricoSerializer(compras, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='comparativo-marcas')
    def comparativo_marcas(self, request, pk=None):
        produto = self.get_object()
        compras = produto.compras.exclude(marca='').exclude(marca__isnull=True)
        marcas = (
            compras.values('marca')
            .annotate(
                compras_count=Count('id'),
                menor_preco=Min('valor_unitario'),
                preco_medio=Avg('valor_unitario'),
            )
            .order_by('marca')
        )
        resultado = []
        for m in marcas:
            resultado.append({
                'marca': m['marca'],
                'compras_count': m['compras_count'],
                'menor_preco': m['menor_preco'] or 0,
                'preco_medio': round(m['preco_medio'] or 0, 2),
            })
        serializer = ComparativoMarcasSerializer(resultado, many=True)
        return Response(serializer.data)


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.select_related('produto', 'fornecedor')
    serializer_class = CompraSerializer
    filterset_fields = ['produto', 'fornecedor', 'data']

    def get_queryset(self):
        qs = super().get_queryset()
        produto = self.request.query_params.get('produto')
        if produto:
            qs = qs.filter(produto_id=produto)
        return qs.order_by('-data', '-id')


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.all()
    serializer_class = FornecedorSerializer


class PromocaoViewSet(viewsets.ModelViewSet):
    queryset = Promocao.objects.select_related('produto', 'fornecedor')
    serializer_class = PromocaoSerializer


class AlertaViewSet(viewsets.ModelViewSet):
    queryset = Alerta.objects.select_related('produto')
    serializer_class = AlertaSerializer


class EstoqueViewSet(viewsets.ViewSet):
    def list(self, request):
        produtos = Produto.objects.filter(ativo=True).select_related('categoria')
        serializer = EstoqueSerializer(produtos, many=True)
        return Response(serializer.data)


class SimuladorViewSet(viewsets.ViewSet):
    def list(self, request):
        try:
            cestas = int(request.query_params.get('cestas', 1))
        except ValueError:
            cestas = 1

        produtos = Produto.objects.filter(ativo=True)
        resultado = []
        for produto in produtos:
            necessario = float(produto.quantidade_por_cesta) * cestas
            em_estoque = float(produto.estoque_atual)
            falta_comprar = max(0, necessario - em_estoque)
            resultado.append({
                'produto_id': produto.id,
                'produto': produto.nome,
                'unidade': produto.unidade,
                'quantidade_por_cesta': float(produto.quantidade_por_cesta),
                'necessario': round(necessario, 3),
                'em_estoque': round(em_estoque, 3),
                'falta_comprar': round(falta_comprar, 3),
                'preco_medio': round(float(produto.preco_medio() or 0), 2),
                'custo_estimado': round(falta_comprar * float(produto.preco_medio() or 0), 2),
            })
        return Response(resultado)


class FormacaoCestaViewSet(viewsets.ViewSet):
    def list(self, request):
        mes_str = request.query_params.get('mes')
        if mes_str:
            try:
                ano, mes = map(int, mes_str.split('-'))
                referencia = date(ano, mes, 1)
            except Exception:
                return Response(
                    {'erro': 'Formato de mês inválido. Use YYYY-MM.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            hoje = date.today()
            referencia = date(hoje.year, hoje.month, 1)

        montagem, created = MontagemCesta.objects.get_or_create(
            mes_referencia=referencia,
            defaults={},
        )
        if created:
            for produto in Produto.objects.filter(ativo=True):
                ItemCesta.objects.create(
                    montagem=montagem,
                    produto=produto,
                    quantidade=produto.quantidade_por_cesta,
                )

        serializer = MontagemCestaSerializer(montagem)
        return Response(serializer.data)


class InteligenciaViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def oportunidades(self, request):
        limite = int(request.query_params.get('limite', 10))
        return Response(ranking_oportunidades(limite=limite))

    @action(detail=False, methods=['get'])
    def recomendacao(self, request):
        return Response(gerar_recomendacao_compra())


class DashboardViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'], url_path='resumo')
    def resumo(self, request):
        from django.conf import settings

        produtos = Produto.objects.filter(ativo=True)
        cestas_previstas = getattr(settings, 'DEFAULT_CESTAS_MES', 16)

        cestas_possiveis = None
        custo_medio_cesta = 0
        economia_acumulada = 0
        for produto in produtos:
            qtd_por_cesta = float(produto.quantidade_por_cesta) or 1
            possiveis = float(produto.estoque_atual) / qtd_por_cesta
            if cestas_possiveis is None or possiveis < cestas_possiveis:
                cestas_possiveis = possiveis

            preco_medio = float(produto.preco_medio() or 0)
            menor_preco = float(produto.menor_preco() or 0)
            custo_medio_cesta += qtd_por_cesta * preco_medio
            if preco_medio > menor_preco > 0:
                economia_acumulada += (preco_medio - menor_preco) * produto.consumo_mensal_medio()

        produtos_em_falta = produtos.filter(
            models.Q(estoque_atual__lt=models.F('estoque_minimo')) & models.Q(estoque_minimo__gt=0)
        ).count()

        return Response({
            'cestas_previstas_mes': cestas_previstas,
            'cestas_possiveis_estoque': round(cestas_possiveis or 0, 2),
            'custo_medio_cesta': round(custo_medio_cesta, 2),
            'economia_acumulada': round(economia_acumulada, 2),
            'produtos_em_falta_count': produtos_em_falta,
            'promocoes_count': Promocao.objects.count(),
            'top_oportunidades': ranking_oportunidades(limite=5),
        })


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'detail': 'Logout realizado com sucesso.'})
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    })
