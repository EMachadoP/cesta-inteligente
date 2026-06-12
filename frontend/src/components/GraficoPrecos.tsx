"use client";

import { HistoricoPreco } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GraficoPrecosProps {
  dados: HistoricoPreco[];
}

export function GraficoPrecos({ dados }: GraficoPrecosProps) {
  const agrupado = dados.reduce<Record<string, { data: string; [marca: string]: number | string }>>(
    (acc, item) => {
      if (!acc[item.data]) acc[item.data] = { data: item.data };
      acc[item.data][item.marca] = Number(item.preco);
      return acc;
    },
    {}
  );

  const chartData = Object.values(agrupado).sort((a, b) =>
    a.data.localeCompare(b.data)
  );
  const marcas = Array.from(new Set(dados.map((d) => d.marca)));

  const colors = ["#16a34a", "#2563eb", "#dc2626", "#f59e0b", "#7c3aed"];

  return (
    <div className="h-80 w-full">
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Sem dados de preço para exibir.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis
              tickFormatter={(value) =>
                `R$ ${Number(value).toFixed(2).replace(".", ",")}`
              }
            />
            <Tooltip
              formatter={(value: number) =>
                `R$ ${Number(value).toFixed(2).replace(".", ",")}`
              }
            />
            <Legend />
            {marcas.map((marca, index) => (
              <Line
                key={marca}
                type="monotone"
                dataKey={marca}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
