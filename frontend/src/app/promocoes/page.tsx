"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import {
  getPromocoes,
  createPromocao,
  getProdutos,
  getFornecedores,
} from "@/lib/api";
import { Promocao, Produto, Fornecedor } from "@/types";

export default function PromocoesPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Promocao>>({
    validade: new Date().toISOString().split("T")[0],
  });

  async function load() {
    try {
      setLoading(true);
      const [promocoesData, produtosData, fornecedoresData] = await Promise.all([
        getPromocoes(),
        getProdutos(),
        getFornecedores(),
      ]);
      setPromocoes(promocoesData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.produto != null) {
        payload.produto_id = typeof form.produto === "object" ? form.produto.id : form.produto;
        delete payload.produto;
      }
      if (form.fornecedor !== undefined) {
        payload.fornecedor_id = form.fornecedor === null ? null : typeof form.fornecedor === "object" ? form.fornecedor.id : form.fornecedor;
        delete payload.fornecedor;
      }
      await createPromocao(payload as Partial<Promocao>);
      setForm({ validade: new Date().toISOString().split("T")[0] });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar promoção");
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Promoções</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border bg-card p-6 shadow sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label>Produto</Label>
          <Select
            value={form.produto ? String(form.produto) : ""}
            onValueChange={(value) => setForm({ ...form, produto: Number(value) })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select
            value={form.fornecedor ? String(form.fornecedor) : ""}
            onValueChange={(value) =>
              setForm({ ...form, fornecedor: value ? Number(value) : null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco">Preço Promocional (R$)</Label>
          <Input
            id="preco"
            type="number"
            min={0}
            step="0.01"
            value={form.preco || ""}
            onChange={(e) =>
              setForm({ ...form, preco: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validade">Validade</Label>
          <Input
            id="validade"
            type="date"
            value={form.validade || ""}
            onChange={(e) => setForm({ ...form, validade: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacao">Observação</Label>
          <div className="flex gap-2">
            <Input
              id="observacao"
              value={form.observacao || ""}
              onChange={(e) =>
                setForm({ ...form, observacao: e.target.value })
              }
              placeholder="Opcional"
            />
            <Button type="submit">Salvar</Button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando promoções...
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Alerta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promocoes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma promoção cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                promocoes.map((promocao) => (
                  <TableRow key={promocao.id}>
                    <TableCell className="font-medium">
                      {promocao.produto_nome || produtoNome(promocao.produto)}
                    </TableCell>
                    <TableCell>
                      {promocao.fornecedor_nome ||
                        fornecedorNome(promocao.fornecedor)}
                    </TableCell>
                    <TableCell>
                      R${" "}
                      {Number(promocao.preco).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      {new Date(promocao.validade).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{promocao.observacao || "—"}</TableCell>
                    <TableCell>
                      {promocao.menor_historico ? (
                        <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                          <Sparkles className="h-3 w-3" />
                          Menor preço histórico
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
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
