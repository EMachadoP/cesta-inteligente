"use client";

import { useEffect, useState } from "react";
import { KPIs } from "@/components/KPIs";
import { RankingOportunidades } from "@/components/RankingOportunidades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { getDashboard, getOportunidades } from "@/lib/api";
import { DashboardResumo, Oportunidade } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockCustoCesta = [
  { mes: "Jan", custo: 145.0 },
  { mes: "Fev", custo: 148.5 },
  { mes: "Mar", custo: 142.3 },
  { mes: "Abr", custo: 139.9 },
  { mes: "Mai", custo: 143.2 },
  { mes: "Jun", custo: 140.5 },
];

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [resumoData, oportunidadesData] = await Promise.all([
          getDashboard(),
          getOportunidades(),
        ]);
        setResumo(resumoData);
        setOportunidades(oportunidadesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando dashboard...
      </div>
    );
  }

  if (error || !resumo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          {error || "Não foi possível carregar os dados do dashboard."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <KPIs data={resumo} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Oportunidades de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingOportunidades oportunidades={oportunidades} limit={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custo da Cesta nos Últimos Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockCustoCesta}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${Number(value).toFixed(0)}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${Number(value).toFixed(2).replace(".", ",")}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="custo"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#16a34a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
