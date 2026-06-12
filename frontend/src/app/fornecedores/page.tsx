"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import {
  getFornecedores,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
} from "@/lib/api";
import { Fornecedor } from "@/types";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState<Partial<Fornecedor>>({});

  async function load() {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setFornecedores(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateFornecedor(editing.id, form);
        setEditing(null);
      } else {
        await createFornecedor(form);
      }
      setForm({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar fornecedor");
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditing(fornecedor);
    setForm({ ...fornecedor });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    try {
      await deleteFornecedor(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir fornecedor");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({});
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border bg-card p-6 shadow sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={form.nome || ""}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome do fornecedor"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={form.telefone || ""}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={form.endereco || ""}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            placeholder="Endereço"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            {editing ? "Atualizar" : "Cadastrar"}
          </Button>
          {editing && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando fornecedores...
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum fornecedor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">
                      {fornecedor.nome}
                    </TableCell>
                    <TableCell>{fornecedor.telefone || "—"}</TableCell>
                    <TableCell>{fornecedor.email || "—"}</TableCell>
                    <TableCell>{fornecedor.endereco || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(fornecedor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
