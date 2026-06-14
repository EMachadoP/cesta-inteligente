"use client";

import { useEffect, useState } from "react";
import { GraficoPrecos } from "@/components/GraficoPrecos";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { getProdutos, getHistoricoPrecos } from "@/lib/api";
import { Produto, HistoricoPreco } from "@/types";

export default function PrecosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProdutos() {
      try {
        const data = await getProdutos();
        setProdutos(data);
        if (data.length > 0) {
          setSelected(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
      } finally {
        setLoadingProdutos(false);
      }
    }
    loadProdutos();
  }, []);

  useEffect(() => {
    if (!selected) return;
    async function loadHistorico() {
      try {
        setLoadingHistorico(true);
        const data = await getHistoricoPrecos(selected!);
        setHistorico(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
      } finally {
        setLoadingHistorico(false);
      }
    }
    loadHistorico();
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Histórico de Preços</h2>
        <Select
          value={selected ? String(selected) : ""}
          onValueChange={(value) => setSelected(Number(value))}
          disabled={loadingProdutos}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecione um produto" />
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loadingHistorico ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando histórico...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Preços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Mercado</TableHead>
                      <TableHead>Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum preço registrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      historico.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.data).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.marca}
                          </TableCell>
                          <TableCell>{item.mercado || "—"}</TableCell>
                          <TableCell>
                            R${" "}
                            {Number(item.valor_unitario || item.preco || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Preços</CardTitle>
            </CardHeader>
            <CardContent>
              <GraficoPrecos dados={historico} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
