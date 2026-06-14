import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[id="username"]', "admin");
  await page.fill('input[id="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
}

const rotas = [
  { path: "/", nome: "Dashboard" },
  { path: "/produtos", nome: "Produtos" },
  { path: "/compras", nome: "Compras" },
  { path: "/estoque", nome: "Estoque" },
  { path: "/precos", nome: "Preços" },
  { path: "/marcas", nome: "Marcas" },
  { path: "/simulador", nome: "Simulador" },
  { path: "/promocoes", nome: "Promoções" },
  { path: "/fornecedores", nome: "Fornecedores" },
  { path: "/inteligencia", nome: "Inteligência" },
];

test.describe("Teste de todas as telas", () => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  for (const rota of rotas) {
    test(`navega para ${rota.nome} sem erros`, async ({ page }) => {
      pageErrors.length = 0;
      consoleErrors.length = 0;

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await login(page);
      await page.goto(`${BASE_URL}${rota.path}`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      await page.waitForTimeout(1500);

      expect(pageErrors, `Erros de página em ${rota.nome}: ${pageErrors.join(", ")}`).toHaveLength(0);
      expect(consoleErrors, `Console errors em ${rota.nome}: ${consoleErrors.join(", ")}`).toHaveLength(0);
    });
  }
});
