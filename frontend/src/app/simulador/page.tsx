"use client";

import { useState } from "react";
import { Simulador } from "@/components/Simulador";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Calculator } from "lucide-react";
import { getSimulador } from "@/lib/api";
import { SimuladorItem } from "@/types";

export default function SimuladorPage() {
  const [cestas, setCestas] = useState<number>(1);
  const [itens, setItens] = useState<SimuladorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const handleSimular = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSimulador(cestas);
      setItens(data.itens);
      setSimulated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao simular");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Simulador de Cestas</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="cestas">Quantas cestas deseja entregar?</Label>
          <Input
            id="cestas"
            type="number"
            min={1}
            value={cestas}
            onChange={(e) => setCestas(parseInt(e.target.value) || 0)}
          />
        </div>
        <Button
          onClick={handleSimular}
          disabled={loading || cestas <= 0}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Simular
        </Button>
      </div>

      {simulated && <Simulador itens={itens} />}
    </div>
  );
}
