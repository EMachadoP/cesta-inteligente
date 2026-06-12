"use client";

import { EstoqueItem } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TabelaEstoqueProps {
  itens: EstoqueItem[];
}

function statusBadge(status: EstoqueItem["status"]) {
  switch (status) {
    case "ok":
      return <Badge className="bg-green-600 hover:bg-green-600">Acima do mínimo</Badge>;
    case "alerta":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-500 text-black">
          Abaixo do mínimo
        </Badge>
      );
    case "critico":
      return <Badge variant="destructive">Em falta</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
}

export function TabelaEstoque({ itens }: TabelaEstoqueProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Qtd/Cesta</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Estoque Atual</TableHead>
            <TableHead>Estoque Mínimo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum item em estoque.
              </TableCell>
            </TableRow>
          ) : (
            itens.map((item) => (
              <TableRow key={item.produto_id}>
                <TableCell className="font-medium">{item.produto}</TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.quantidade_por_cesta}</TableCell>
                <TableCell>{item.unidade}</TableCell>
                <TableCell>{item.estoque_atual}</TableCell>
                <TableCell>{item.estoque_minimo}</TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
