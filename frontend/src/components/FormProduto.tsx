"use client";

import { useState, useEffect } from "react";
import { Produto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormProdutoProps {
  produto?: Produto | null;
  onSubmit: (data: Partial<Produto>) => void;
  onCancel: () => void;
}

const emptyState: Partial<Produto> = {
  nome: "",
  categoria: "",
  quantidade_por_cesta: 0,
  unidade: "",
  estoque_atual: 0,
  estoque_minimo: 0,
};

export function FormProduto({ produto, onSubmit, onCancel }: FormProdutoProps) {
  const [form, setForm] = useState<Partial<Produto>>(emptyState);

  useEffect(() => {
    setForm(produto ? { ...produto } : emptyState);
  }, [produto]);

  const handleChange = (field: keyof Produto, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          value={form.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          placeholder="Ex: Arroz"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Input
          id="categoria"
          value={form.categoria}
          onChange={(e) => handleChange("categoria", e.target.value)}
          placeholder="Ex: Grãos"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantidade_por_cesta">Qtd por Cesta</Label>
          <Input
            id="quantidade_por_cesta"
            type="number"
            min={0}
            step="0.01"
            value={form.quantidade_por_cesta}
            onChange={(e) =>
              handleChange("quantidade_por_cesta", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Input
            id="unidade"
            value={form.unidade}
            onChange={(e) => handleChange("unidade", e.target.value)}
            placeholder="Ex: kg"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estoque_atual">Estoque Atual</Label>
          <Input
            id="estoque_atual"
            type="number"
            min={0}
            step="0.01"
            value={form.estoque_atual}
            onChange={(e) =>
              handleChange("estoque_atual", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
          <Input
            id="estoque_minimo"
            type="number"
            min={0}
            step="0.01"
            value={form.estoque_minimo}
            onChange={(e) =>
              handleChange("estoque_minimo", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
