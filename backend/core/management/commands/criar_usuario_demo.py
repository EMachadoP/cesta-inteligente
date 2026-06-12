"""
Comando para criar usuário de demonstração.
"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Cria um usuário demo para testes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Nome de usuário',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Senha',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@cestainteligente.local',
            help='Email',
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.set_password(password)
            user.email = email
            user.save()
            self.stdout.write(
                self.style.WARNING(f'Usuário "{username}" atualizado.')
            )
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            self.stdout.write(
                self.style.SUCCESS(f'Usuário "{username}" criado com sucesso.')
            )

        self.stdout.write(f'Login: {username}')
        self.stdout.write(f'Senha: {password}')
