"""
Comando Django para importar dados da planilha Excel.
"""
from django.core.management.base import BaseCommand

from core.services.importar_planilha import importar_planilha


class Command(BaseCommand):
    help = 'Importa produtos, marcas, fornecedores e compras da planilha Excel.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--caminho',
            type=str,
            default=None,
            help='Caminho para a planilha Excel. Padrão: Acompanhamento Cestas Básicas -.xlsx na raiz do projeto.',
        )
        parser.add_argument(
            '--ano',
            type=int,
            default=2026,
            help='Ano de referência dos dados.',
        )
        parser.add_argument(
            '--limpar',
            action='store_true',
            help='Remove Compras existentes antes de importar.',
        )

    def handle(self, *args, **options):
        caminho = options['caminho']
        ano = options['ano']

        if options['limpar']:
            from core.models import Compra
            count = Compra.objects.count()
            Compra.objects.all().delete()
            self.stdout.write(f'{count} compras anteriores removidas.')

        resultado = importar_planilha(caminho=caminho, ano=ano)

        self.stdout.write(
            self.style.SUCCESS(
                f'Importação concluída: {resultado["produtos"]} produtos, '
                f'{resultado["compras"]} compras processadas '
                f'({resultado["registros"]} registros lidos).'
            )
        )
