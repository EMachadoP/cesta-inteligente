import {
  Produto,
  Compra,
  Fornecedor,
  Promocao,
  EstoqueItem,
  DashboardResumo,
  HistoricoPreco,
  ComparativoMarca,
  SimuladorResponse,
  Oportunidade,
  ApiError,
} from "@/types";

const API_BASE = "http://localhost:8000/api";

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData: ApiError = {};
    try {
      errorData = (await response.json()) as ApiError;
    } catch {
      // ignore parsing errors
    }
    const message =
      errorData.detail ||
      errorData.message ||
      `Erro ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

// Dashboard
export async function getDashboard(): Promise<DashboardResumo> {
  return apiFetch<DashboardResumo>("/dashboard/resumo/");
}

// Produtos
export async function getProdutos(): Promise<Produto[]> {
  return apiFetch<Produto[]>("/produtos/");
}

export async function createProduto(data: Partial<Produto>): Promise<Produto> {
  return apiFetch<Produto>("/produtos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduto(
  id: number,
  data: Partial<Produto>
): Promise<Produto> {
  return apiFetch<Produto>(`/produtos/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduto(id: number): Promise<void> {
  return apiFetch<void>(`/produtos/${id}/`, { method: "DELETE" });
}

export async function getHistoricoPrecos(
  produtoId: number
): Promise<HistoricoPreco[]> {
  return apiFetch<HistoricoPreco[]>(`/produtos/${produtoId}/historico-precos/`);
}

export async function getComparativoMarcas(
  produtoId: number
): Promise<ComparativoMarca[]> {
  return apiFetch<ComparativoMarca[]>(
    `/produtos/${produtoId}/comparativo-marcas/`
  );
}

// Compras
export async function getCompras(): Promise<Compra[]> {
  return apiFetch<Compra[]>("/compras/");
}

export async function createCompra(data: Partial<Compra>): Promise<Compra> {
  return apiFetch<Compra>("/compras/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Estoque
export async function getEstoque(): Promise<EstoqueItem[]> {
  return apiFetch<EstoqueItem[]>("/estoque/");
}

// Simulador
export async function getSimulador(cestas: number): Promise<SimuladorResponse> {
  return apiFetch<SimuladorResponse>(`/simulador/?cestas=${cestas}`);
}

// Promoções
export async function getPromocoes(): Promise<Promocao[]> {
  return apiFetch<Promocao[]>("/promocoes/");
}

export async function createPromocao(data: Partial<Promocao>): Promise<Promocao> {
  return apiFetch<Promocao>("/promocoes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Fornecedores
export async function getFornecedores(): Promise<Fornecedor[]> {
  return apiFetch<Fornecedor[]>("/fornecedores/");
}

export async function createFornecedor(
  data: Partial<Fornecedor>
): Promise<Fornecedor> {
  return apiFetch<Fornecedor>("/fornecedores/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFornecedor(
  id: number,
  data: Partial<Fornecedor>
): Promise<Fornecedor> {
  return apiFetch<Fornecedor>(`/fornecedores/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFornecedor(id: number): Promise<void> {
  return apiFetch<void>(`/fornecedores/${id}/`, { method: "DELETE" });
}

// Inteligência
export async function getOportunidades(): Promise<Oportunidade[]> {
  return apiFetch<Oportunidade[]>("/inteligencia/oportunidades/");
}
