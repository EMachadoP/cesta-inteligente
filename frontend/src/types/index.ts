export interface Categoria {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: Categoria;
  quantidade_por_cesta: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  ativo?: boolean;
  preco_medio?: number | null;
  menor_preco?: number | null;
  consumo_mensal_medio?: number | null;
}

export interface Compra {
  id: number;
  data: string;
  produto: number | Produto;
  produto_nome?: string;
  marca: string;
  quantidade: number;
  valor_total: string | number;
  valor_unitario: string | number;
  fornecedor?: number | Fornecedor | null;
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
  produto: number | Produto;
  produto_nome?: string;
  fornecedor?: number | Fornecedor | null;
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
  produto: number | string;
  marca: string;
  mercado?: string;
  preco?: number;
  valor_unitario?: number | string;
  quantidade?: number;
  valor_total?: number | string;
  fornecedor?: Fornecedor | null;
}

export interface ComparativoMarca {
  marca: string;
  menor_preco: number;
  preco_medio: number;
}

export interface SimuladorItem {
  produto_id: number;
  produto: string;
  unidade: string;
  quantidade_por_cesta: number;
  necessario: number;
  em_estoque: number;
  faltara: number;
  preco_medio?: number;
  custo_estimado?: number;
}

export interface UltimaCompra {
  id: number;
  data: string;
  produto: number | string;
  produto_nome?: string;
  marca: string;
  mercado?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor?: number | Fornecedor | null;
  fornecedor_nome?: string;
  observacao?: string;
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
