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
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle2 } from "lucide-react";

interface SimuladorProps {
  itens: SimuladorItem[];
  comprados?: number[];
  onComprar?: (item: SimuladorItem) => void;
  onFinalizar?: () => void;
}

export function Simulador({ itens, comprados = [], onComprar, onFinalizar }: SimuladorProps) {
  const faltam = itens.filter((i) => i.faltara > 0 && !comprados.includes(i.produto_id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {faltam.length === 0 ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Todos os itens foram programados
            </span>
          ) : (
            <span>
              Faltam <strong>{faltam.length}</strong> item(s) para programar
            </span>
          )}
        </div>
        {onFinalizar && (
          <Button variant="secondary" onClick={onFinalizar}>
            Finalizar
          </Button>
        )}
      </div>

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
              {onComprar && <TableHead className="text-right">Ação</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onComprar ? 7 : 6}
                  className="text-center text-muted-foreground py-8"
                >
                  Informe a quantidade de cestas para simular.
                </TableCell>
              </TableRow>
            ) : (
              itens.map((item) => {
                const jaComprado = comprados.includes(item.produto_id);
                return (
                  <TableRow
                    key={item.produto_id}
                    className={jaComprado ? "bg-green-50/50" : undefined}
                  >
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell>{item.unidade}</TableCell>
                    <TableCell>{item.necessario}</TableCell>
                    <TableCell>{item.em_estoque}</TableCell>
                    <TableCell>
                      {item.faltara > 0 ? (
                        <span className="font-semibold text-destructive">{item.faltara}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {jaComprado ? (
                        <Badge className="bg-green-600 hover:bg-green-600">Comprado</Badge>
                      ) : item.faltara > 0 ? (
                        <Badge variant="destructive">Falta comprar</Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-600">Suficiente</Badge>
                      )}
                    </TableCell>
                    {onComprar && (
                      <TableCell className="text-right">
                        {item.faltara > 0 && !jaComprado ? (
                          <Button size="sm" onClick={() => onComprar(item)}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Comprar
                          </Button>
                        ) : jaComprado ? (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-green-600" />
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
