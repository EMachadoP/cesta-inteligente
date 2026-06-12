"use client";

import { useEffect, useState } from "react";
import { TabelaProdutos } from "@/components/TabelaProdutos";
import { FormProduto } from "@/components/FormProduto";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
} from "@/lib/api";
import { Produto } from "@/types";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  async function loadProdutos() {
    try {
      setLoading(true);
      const data = await getProdutos();
      setProdutos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProdutos();
  }, []);

  const handleSubmit = async (data: Partial<Produto>) => {
    try {
      if (editing) {
        await updateProduto(editing.id, data);
      } else {
        await createProduto(data);
      }
      setOpen(false);
      setEditing(null);
      await loadProdutos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto");
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditing(produto);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteProduto(id);
      await loadProdutos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir produto");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <FormProduto
              produto={editing}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

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
          Carregando produtos...
        </div>
      ) : (
        <TabelaProdutos
          produtos={produtos}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
