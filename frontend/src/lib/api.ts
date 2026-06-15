import { apiFetch } from "@/lib/auth";
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

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.status === 503 && options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

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
export async function getDashboard(signal?: AbortSignal): Promise<DashboardResumo> {
  return fetchJson<DashboardResumo>("/api/dashboard/resumo", signal ? { signal } : {});
}

// Produtos
export async function getProdutos(): Promise<Produto[]> {
  const data = await fetchJson<{ results: Produto[] }>("/api/produtos");
  return data.results;
}

export async function createProduto(data: Partial<Produto>): Promise<Produto> {
  return fetchJson<Produto>("/api/produtos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduto(
  id: number,
  data: Partial<Produto>
): Promise<Produto> {
  return fetchJson<Produto>(`/api/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduto(id: number): Promise<void> {
  return fetchJson<void>(`/api/produtos/${id}`, { method: "DELETE" });
}

export async function getHistoricoPrecos(
  produtoId: number
): Promise<HistoricoPreco[]> {
  return fetchJson<HistoricoPreco[]>(
    `/api/produtos/${produtoId}/historico-precos`
  );
}

export async function getUltimaCompra(produtoId: number): Promise<HistoricoPreco | null> {
  const historico = await getHistoricoPrecos(produtoId);
  if (historico.length === 0) return null;
  // historico já vem ordenado por data, id crescente do backend
  return historico[historico.length - 1];
}

export async function getProduto(id: number): Promise<Produto> {
  return fetchJson<Produto>(`/api/produtos/${id}`);
}

export async function getComparativoMarcas(
  produtoId: number
): Promise<ComparativoMarca[]> {
  return fetchJson<ComparativoMarca[]>(
    `/api/produtos/${produtoId}/comparativo-marcas`
  );
}

// Compras
export async function getCompras(): Promise<Compra[]> {
  const data = await fetchJson<{ results: Compra[] }>("/api/compras");
  return data.results;
}

export async function createCompra(data: Partial<Compra>): Promise<Compra> {
  return fetchJson<Compra>("/api/compras", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Estoque
export async function getEstoque(signal?: AbortSignal): Promise<EstoqueItem[]> {
  return fetchJson<EstoqueItem[]>("/api/estoque", signal ? { signal } : {});
}

// Simulador
export async function getSimulador(cestas: number): Promise<SimuladorResponse> {
  const data = await fetchJson<
    {
      produto_id: number;
      produto: string;
      unidade: string;
      quantidade_por_cesta: number;
      necessario: number;
      em_estoque: number;
      falta_comprar: number;
      preco_medio?: number;
      custo_estimado?: number;
    }[]
  >(`/api/simulador?cestas=${cestas}`);
  return {
    cestas,
    itens: data.map((item) => ({
      produto_id: item.produto_id,
      produto: item.produto,
      unidade: item.unidade,
      quantidade_por_cesta: item.quantidade_por_cesta,
      necessario: item.necessario,
      em_estoque: item.em_estoque,
      faltara: item.falta_comprar,
      preco_medio: item.preco_medio,
      custo_estimado: item.custo_estimado,
    })),
  };
}

// Promoções
export async function getPromocoes(): Promise<Promocao[]> {
  const data = await fetchJson<{ results: Promocao[] }>("/api/promocoes");
  return data.results;
}

export async function createPromocao(data: Partial<Promocao>): Promise<Promocao> {
  return fetchJson<Promocao>("/api/promocoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Fornecedores
export async function getFornecedores(): Promise<Fornecedor[]> {
  const data = await fetchJson<{ results: Fornecedor[] }>("/api/fornecedores");
  return data.results;
}

export async function createFornecedor(
  data: Partial<Fornecedor>
): Promise<Fornecedor> {
  return fetchJson<Fornecedor>("/api/fornecedores", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFornecedor(
  id: number,
  data: Partial<Fornecedor>
): Promise<Fornecedor> {
  return fetchJson<Fornecedor>(`/api/fornecedores/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFornecedor(id: number): Promise<void> {
  return fetchJson<void>(`/api/fornecedores/${id}`, { method: "DELETE" });
}

// Inteligência
export async function getOportunidades(signal?: AbortSignal): Promise<Oportunidade[]> {
  return fetchJson<Oportunidade[]>("/api/inteligencia/oportunidades", signal ? { signal } : {});
}
