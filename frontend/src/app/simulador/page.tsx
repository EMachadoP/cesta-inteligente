"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Simulador } from "@/components/Simulador";
import { CompraRapidaDialog } from "@/components/CompraRapidaDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Calculator } from "lucide-react";
import { getProduto, getSimulador } from "@/lib/api";
import { Produto, SimuladorItem } from "@/types";

export default function SimuladorPage() {
  const router = useRouter();
  const [cestas, setCestas] = useState<number>(1);
  const [itens, setItens] = useState<SimuladorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SimuladorItem | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [comprados, setComprados] = useState<number[]>([]);

  const handleSimular = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSimulador(cestas);
      setItens(data.itens);
      setSimulated(true);
      setComprados([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao simular");
    } finally {
      setLoading(false);
    }
  };

  const handleComprar = async (item: SimuladorItem) => {
    setSelectedItem(item);
    try {
      const produto = await getProduto(item.produto_id);
      setSelectedProduto(produto);
    } catch {
      setSelectedProduto(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    setDialogOpen(false);
    setComprados((prev) => [...prev, selectedItem.produto_id]);
    setSelectedItem(null);
    setSelectedProduto(null);
    // Recarrega a simulação para refletir estoque atualizado
    await handleSimular();
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setSelectedProduto(null);
  };

  const handleFinalizar = () => {
    setSimulated(false);
    setItens([]);
    setComprados([]);
    setCestas(1);
    router.push("/compras");
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

      {simulated && (
        <Simulador
          itens={itens}
          comprados={comprados}
          onComprar={handleComprar}
          onFinalizar={handleFinalizar}
        />
      )}

      <CompraRapidaDialog
        open={dialogOpen}
        item={selectedItem}
        produtoAtual={selectedProduto}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
