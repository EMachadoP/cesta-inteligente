"""
Rotas da API do Cesta Inteligente.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    AlertaViewSet,
    CompraViewSet,
    DashboardViewSet,
    EstoqueViewSet,
    FornecedorViewSet,
    FormacaoCestaViewSet,
    InteligenciaViewSet,
    LoginView,
    ProdutoViewSet,
    PromocaoViewSet,
    RefreshView,
    SimuladorViewSet,
    logout_view,
    me_view,
)

router = DefaultRouter(trailing_slash=False)
router.register(r'produtos', ProdutoViewSet, basename='produto')
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'promocoes', PromocaoViewSet, basename='promocao')
router.register(r'alertas', AlertaViewSet, basename='alerta')
router.register(r'estoque', EstoqueViewSet, basename='estoque')
router.register(r'simulador', SimuladorViewSet, basename='simulador')
router.register(r'formacao-cesta', FormacaoCestaViewSet, basename='formacao-cesta')
router.register(r'inteligencia', InteligenciaViewSet, basename='inteligencia')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/refresh', RefreshView.as_view(), name='refresh'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/me', me_view, name='me'),
]
