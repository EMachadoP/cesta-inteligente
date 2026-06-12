"use client";

import { useEffect, useState } from "react";
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
import { Loader2, AlertCircle, Award } from "lucide-react";
import { getProdutos, getComparativoMarcas } from "@/lib/api";
import { Produto, ComparativoMarca } from "@/types";

export default function MarcasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [comparativo, setComparativo] = useState<ComparativoMarca[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
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
    async function loadComparativo() {
      try {
        setLoadingMarcas(true);
        const data = await getComparativoMarcas(selected!);
        setComparativo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar marcas");
      } finally {
        setLoadingMarcas(false);
      }
    }
    loadComparativo();
  }, [selected]);

  const melhorMarca = comparativo.length
    ? comparativo.reduce((min, item) =>
        item.menor_preco < min.menor_preco ? item : min
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Comparativo de Marcas</h2>
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

      {loadingMarcas ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando comparativo...
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Menor Preço</TableHead>
                <TableHead>Preço Médio</TableHead>
                <TableHead>Melhor Custo-Benefício</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparativo.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma marca registrada para este produto.
                  </TableCell>
                </TableRow>
              ) : (
                comparativo.map((item) => {
                  const isBest = melhorMarca && item.marca === melhorMarca.marca;
                  return (
                    <TableRow key={item.marca}>
                      <TableCell className="font-medium">{item.marca}</TableCell>
                      <TableCell>
                        R${" "}
                        {Number(item.menor_preco).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>
                        R${" "}
                        {Number(item.preco_medio).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>
                        {isBest ? (
                          <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                            <Award className="h-3 w-3" />
                            Melhor custo-benefício
                          </Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
