from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(REGISTRATION_INVITE_CODE="SEGREDO123")
class RegisterEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/register"
        self.payload = {
            "username": "novo",
            "email": "novo@exemplo.com",
            "password": "umaSenhaForte9",
            "invite_code": "SEGREDO123",
        }

    def test_cadastro_valido_retorna_tokens(self):
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["username"], "novo")
        user = User.objects.get(username="novo")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_codigo_invalido_recusa(self):
        payload = {**self.payload, "invite_code": "ERRADO"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(username="novo").exists())

    def test_username_duplicado_recusa(self):
        User.objects.create_user(username="novo", password="x")
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 400)

    def test_senha_fraca_recusa(self):
        payload = {**self.payload, "password": "123"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, 400)

    @override_settings(REGISTRATION_INVITE_CODE="")
    def test_cadastro_desabilitado_quando_sem_codigo(self):
        res = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(username="novo").exists())
