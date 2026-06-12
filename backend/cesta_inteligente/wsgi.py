"""
WSGI config for cesta_inteligente project.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cesta_inteligente.settings')

application = get_wsgi_application()
