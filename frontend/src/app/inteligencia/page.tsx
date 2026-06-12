"use client";

import { useEffect, useState } from "react";
import { RankingOportunidades } from "@/components/RankingOportunidades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Brain, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";
import { getOportunidades } from "@/lib/api";
import { Oportunidade } from "@/types";

export default function InteligenciaPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOportunidades();
        setOportunidades(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar inteligência");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const topOportunidade = oportunidades[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Inteligência de Compras</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando inteligência de compras...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Recomendação da IA</CardTitle>
              </CardHeader>
              <CardContent>
                {topOportunidade ? (
                  <p className="text-sm text-muted-foreground">
                    A melhor oportunidade atual é comprar{" "}
                    <strong className="text-foreground">
                      {topOportunidade.produto}
                    </strong>
                    , com índice de oportunidade{" "}
                    <Badge className="bg-green-600 hover:bg-green-600">
                      {topOportunidade.indice}/100
                    </Badge>
                    . {topOportunidade.motivo}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma recomendação disponível no momento.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Preços em Queda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oportunidades com preço atual abaixo da média histórica são
                  priorizadas. Quanto maior a diferença, maior o índice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Estoque Crítico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Produtos abaixo do estoque mínimo recebem pontuação extra no
                  índice de oportunidade, pois demandam reposição urgente.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Como é calculado o Índice de Oportunidade?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                O índice varia de <strong>0 a 100</strong> e considera:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Variação de preço:</strong> diferença percentual entre
                  o preço atual e a média histórica.
                </li>
                <li>
                  <strong>Necessidade de reposição:</strong> produtos abaixo do
                  estoque mínimo ganham pontos extras.
                </li>
                <li>
                  <strong>Criticidade:</strong> produtos em falta (estoque zero)
                  têm peso maior.
                </li>
                <li>
                  <strong>Promoções:</strong> preços promocionais abaixo do
                  histórico aumentam a pontuação.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de Oportunidades</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingOportunidades oportunidades={oportunidades} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
