"use client";

import { Oportunidade } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RankingOportunidadesProps {
  oportunidades: Oportunidade[];
  limit?: number;
}

export function RankingOportunidades({
  oportunidades,
  limit,
}: RankingOportunidadesProps) {
  const data = limit ? oportunidades.slice(0, limit) : oportunidades;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Índice</TableHead>
            <TableHead>Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                Nenhuma oportunidade encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.produto}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-8">{item.indice}</span>
                    <Progress
                      value={item.indice}
                      className="h-2 w-24"
                    />
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate">{item.motivo}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
