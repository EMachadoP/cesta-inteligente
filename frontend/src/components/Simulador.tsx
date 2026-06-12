"use client";

import { SimuladorItem } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SimuladorProps {
  itens: SimuladorItem[];
}

export function Simulador({ itens }: SimuladorProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Necessário</TableHead>
            <TableHead>Em Estoque</TableHead>
            <TableHead>Faltará Comprar</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Informe a quantidade de cestas para simular.
              </TableCell>
            </TableRow>
          ) : (
            itens.map((item) => (
              <TableRow key={item.produto}>
                <TableCell className="font-medium">{item.produto}</TableCell>
                <TableCell>{item.unidade}</TableCell>
                <TableCell>{item.necessario}</TableCell>
                <TableCell>{item.em_estoque}</TableCell>
                <TableCell>
                  {item.faltara > 0 ? (
                    <span className="font-semibold text-destructive">
                      {item.faltara}
                    </span>
                  ) : (
                    <span className="text-green-600">0</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.faltara > 0 ? (
                    <Badge variant="destructive">Falta comprar</Badge>
                  ) : (
                    <Badge className="bg-green-600 hover:bg-green-600">
                      Suficiente
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
