"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardResumo } from "@/types";
import {
  Boxes,
  PackageCheck,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  Percent,
} from "lucide-react";

interface KPIsProps {
  data: DashboardResumo;
}

export function KPIs({ data }: KPIsProps) {
  const items = [
    {
      title: "Cestas previstas no mês",
      value: data.cestas_previstas_mes,
      icon: Boxes,
    },
    {
      title: "Cestas possíveis com estoque",
      value: data.cestas_possiveis_estoque,
      icon: PackageCheck,
    },
    {
      title: "Custo médio da cesta",
      value: `R$ ${Number(data.custo_medio_cesta).toFixed(2)}`,
      icon: DollarSign,
    },
    {
      title: "Economia acumulada",
      value: `R$ ${Number(data.economia_acumulada).toFixed(2)}`,
      icon: PiggyBank,
    },
    {
      title: "Produtos em falta",
      value: data.produtos_em_falta,
      icon: AlertTriangle,
      variant: data.produtos_em_falta > 0 ? "destructive" : "default",
    },
    {
      title: "Promoções ativas",
      value: data.promocoes_ativas,
      icon: Percent,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
