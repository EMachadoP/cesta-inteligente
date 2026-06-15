"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Minus, Package, Plus } from "lucide-react";
import { Compra, Fornecedor, HistoricoPreco, Produto, SimuladorItem } from "@/types";
import { createCompra, getFornecedores, getHistoricoPrecos, getProdutos } from "@/lib/api";

interface CompraRapidaDialogProps {
  open: boolean;
  item: SimuladorItem | null;
  produtoAtual: Produto | null;
  onClose: () => void;
  onSave: () => void;
}

function formatCurrency(value: number | string | undefined): string {
  const num = Number(value || 0);
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatDateBR(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR");
}

export function CompraRapidaDialog({
  open,
  item,
  produtoAtual,
  onClose,
  onSave,
}: CompraRapidaDialogProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modoNovoProduto, setModoNovoProduto] = useState<"substituir" | "acrescentar" | null>(null);

  const [form, setForm] = useState<Partial<Compra>>({
    data: new Date().toISOString().split("T")[0],
    produto: undefined,
    marca: "",
    quantidade: 1,
    valor_total: 0,
    fornecedor: null,
    observacao: "",
  });

  const ultimaCompra = useMemo(() => {
    if (historico.length === 0) return null;
    return historico[historico.length - 1];
  }, [historico]);

  const precoMedio = useMemo(() => {
    if (historico.length === 0) return 0;
    const total = historico.reduce((acc, h) => acc + Number(h.valor_unitario || 0), 0);
    return total / historico.length;
  }, [historico]);

  const menorPreco = useMemo(() => {
    if (historico.length === 0) return 0;
    return Math.min(...historico.map((h) => Number(h.valor_unitario || 0)));
  }, [historico]);

  const valorUnitarioAtual = useMemo(() => {
    const qtd = Number(form.quantidade) || 1;
    const total = Number(form.valor_total) || 0;
    return qtd > 0 ? total / qtd : 0;
  }, [form.quantidade, form.valor_total]);

  useEffect(() => {
    if (!open || !item) return;

    async function load() {
      setLoading(true);
      try {
        const [prods, forns, hist] = await Promise.all([
          getProdutos(),
          getFornecedores(),
          getHistoricoPrecos(item!.produto_id),
        ]);
        setProdutos(prods);
        setFornecedores(forns);
        setHistorico(hist);

        const ultimo = hist.length > 0 ? hist[hist.length - 1] : null;
        setForm({
          data: new Date().toISOString().split("T")[0],
          produto: item!.produto_id,
          marca: ultimo?.marca || "",
          quantidade: item!.faltara > 0 ? item!.faltara : 1,
          valor_total: 0,
          fornecedor:
            typeof ultimo?.fornecedor === "object"
              ? ultimo?.fornecedor?.id ?? null
              : ultimo?.fornecedor ?? null,
          observacao: "",
        });
        setModoNovoProduto(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Erro ao carregar dados da compra rápida:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, item]);

  const handleChange = (field: keyof Compra, value: string | number | null | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value === null ? undefined : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.produto || !form.quantidade || form.valor_total == null) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        produto_id: form.produto,
      };
      delete payload.produto;
      if (form.fornecedor != null) {
        payload.fornecedor_id = form.fornecedor;
        delete payload.fornecedor;
      } else {
        payload.fornecedor_id = null;
        delete payload.fornecedor;
      }

      await createCompra(payload as Partial<Compra>);

      if (modoNovoProduto === "acrescentar" && item && form.produto !== item.produto_id) {
        // Cria também a compra do produto original com os dados iniciais sugeridos
        const originalPayload: Record<string, unknown> = {
          data: form.data,
          produto_id: item.produto_id,
          marca: "",
          quantidade: item.faltara > 0 ? item.faltara : 1,
          valor_total: 0,
          fornecedor_id: null,
          observacao: "Adicionado via simulador",
        };
        await createCompra(originalPayload as Partial<Compra>);
      }

      onSave();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Erro ao salvar compra:", err);
    } finally {
      setSaving(false);
    }
  };

  const comparativo = useMemo(() => {
    if (!ultimaCompra) return null;
    const ultimo = Number(ultimaCompra.valor_unitario || 0);
    const atual = valorUnitarioAtual;
    if (ultimo === 0 || atual === 0) return null;
    const diff = atual - ultimo;
    const percent = ultimo > 0 ? (diff / ultimo) * 100 : 0;
    return { diff, percent, maisBarato: diff < 0 };
  }, [ultimaCompra, valorUnitarioAtual]);

  const produtoSelecionado = useMemo(() => {
    return produtos.find((p) => p.id === Number(form.produto)) || produtoAtual;
  }, [produtos, form.produto, produtoAtual]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Compra — {produtoSelecionado?.nome || item?.produto}</DialogTitle>
          <DialogDescription>
            Quantidade sugerida: {item?.faltara} {item?.unidade}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando dados...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Última compra e comparativo */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Última compra</p>
                <p className="font-semibold">{ultimaCompra?.marca || "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateBR(ultimaCompra?.data)}
                </p>
                <p className="text-sm font-medium">
                  {formatCurrency(ultimaCompra?.valor_unitario)} / {item?.unidade}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Preço médio histórico</p>
                <p className="text-lg font-semibold">{formatCurrency(precoMedio)}</p>
                <p className="text-xs text-muted-foreground">Menor: {formatCurrency(menorPreco)}</p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Novo valor unitário</p>
                <p className="text-lg font-semibold">{formatCurrency(valorUnitarioAtual)}</p>
                {comparativo ? (
                  <div className="flex items-center gap-1 text-sm">
                    {comparativo.maisBarato ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">
                          {comparativo.percent.toFixed(1).replace(".", ",")}% mais barato
                        </span>
                      </>
                    ) : comparativo.diff === 0 ? (
                      <>
                        <Minus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Mesmo preço</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">
                          {comparativo.percent.toFixed(1).replace(".", ",")}% mais caro
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem histórico</p>
                )}
              </div>
            </div>

            {/* Ações de novo produto */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setModoNovoProduto((prev) => (prev === "substituir" ? null : "substituir"))
                }
              >
                <Package className="mr-2 h-4 w-4" />
                {modoNovoProduto === "substituir" ? "Manter produto" : "Substituir produto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setModoNovoProduto((prev) => (prev === "acrescentar" ? null : "acrescentar"))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {modoNovoProduto === "acrescentar" ? "Não acrescentar" : "Acrescentar produto"}
              </Button>
              {modoNovoProduto && (
                <Badge variant="secondary">
                  {modoNovoProduto === "substituir" ? "Substituindo" : "Acrescentando"}
                </Badge>
              )}
            </div>

            {modoNovoProduto && (
              <div className="space-y-2">
                <Label>Produto {modoNovoProduto === "substituir" ? "substituto" : "extra"}</Label>
                <Select
                  value={form.produto != null ? String(form.produto) : ""}
                  onValueChange={(value) => handleChange("produto", Number(value))}
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
            )}

            {/* Formulário */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={form.marca || ""}
                  onChange={(e) => handleChange("marca", e.target.value)}
                  placeholder="Marca"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.quantidade}
                  onChange={(e) => handleChange("quantidade", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total (R$)</Label>
                <Input
                  id="valor_total"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valor_total}
                  onChange={(e) => handleChange("valor_total", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={form.fornecedor != null ? String(form.fornecedor) : "none"}
                  onValueChange={(value) =>
                    handleChange("fornecedor", value === "none" ? null : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={form.data}
                  onChange={(e) => handleChange("data", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Input
                  id="observacao"
                  value={form.observacao || ""}
                  onChange={(e) => handleChange("observacao", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Compra
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
