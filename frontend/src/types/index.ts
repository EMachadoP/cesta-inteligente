export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  quantidade_por_cesta: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
}

export interface Compra {
  id: number;
  data: string;
  produto: number;
  produto_nome?: string;
  marca: string;
  quantidade: number;
  valor_total: string | number;
  valor_unitario: string | number;
  fornecedor?: number | null;
  fornecedor_nome?: string;
  observacao?: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Promocao {
  id: number;
  produto: number;
  produto_nome?: string;
  fornecedor?: number | null;
  fornecedor_nome?: string;
  preco: string | number;
  validade: string;
  observacao?: string;
  menor_historico?: boolean;
}

export interface EstoqueItem {
  produto_id: number;
  produto: string;
  categoria: string;
  quantidade_por_cesta: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  status: "ok" | "alerta" | "critico";
}

export interface DashboardResumo {
  cestas_previstas_mes: number;
  cestas_possiveis_estoque: number;
  custo_medio_cesta: number;
  economia_acumulada: number;
  produtos_em_falta: number;
  promocoes_ativas: number;
}

export interface CustoCestaMes {
  mes: string;
  custo: number;
}

export interface HistoricoPreco {
  id: number;
  data: string;
  produto: number;
  marca: string;
  mercado?: string;
  preco: number;
}

export interface ComparativoMarca {
  marca: string;
  menor_preco: number;
  preco_medio: number;
}

export interface SimuladorItem {
  produto: string;
  unidade: string;
  quantidade_por_cesta: number;
  necessario: number;
  em_estoque: number;
  faltara: number;
}

export interface SimuladorResponse {
  cestas: number;
  itens: SimuladorItem[];
}

export interface Oportunidade {
  id: number;
  produto: string;
  indice: number;
  motivo: string;
  preco_atual?: number;
  preco_medio?: number;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
