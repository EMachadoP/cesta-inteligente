"use client";

import { useEffect, useState } from "react";
import { FormCompra } from "@/components/FormCompra";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { getCompras, createCompra, getProdutos, getFornecedores } from "@/lib/api";
import { Compra, Produto, Fornecedor } from "@/types";

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [comprasData, produtosData, fornecedoresData] = await Promise.all([
        getCompras(),
        getProdutos(),
        getFornecedores(),
      ]);
      setCompras(comprasData);
      setProdutos(produtosData);
      setFornecedores(fornecedoresData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (data: Partial<Compra>) => {
    try {
      await createCompra(data);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar compra");
    }
  };

  const produtoNome = (produto?: number | Produto | null) => {
    if (!produto) return "—";
    if (typeof produto === "object") return produto.nome;
    return produtos.find((p) => p.id === produto)?.nome || `#${produto}`;
  };

  const fornecedorNome = (fornecedor?: number | Fornecedor | null) => {
    if (!fornecedor) return "—";
    if (typeof fornecedor === "object") return fornecedor.nome;
    return fornecedores.find((f) => f.id === fornecedor)?.nome || "—";
  };

  const formatCurrency = (value?: string | number) => {
    const num = Number(value || 0);
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Compras</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormCompra
        produtos={produtos}
        fornecedores={fornecedores}
        onSubmit={handleSubmit}
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando compras...
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead>Fornecedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma compra registrada.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell>
                      {new Date(compra.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {compra.produto_nome || produtoNome(compra.produto)}
                    </TableCell>
                    <TableCell>{compra.marca}</TableCell>
                    <TableCell>{compra.quantidade}</TableCell>
                    <TableCell>{formatCurrency(compra.valor_total)}</TableCell>
                    <TableCell>{formatCurrency(compra.valor_unitario)}</TableCell>
                    <TableCell>
                      {compra.fornecedor_nome ||
                        fornecedorNome(compra.fornecedor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
