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

interface FormData {
  nome: string;
  categoria_nome: string;
  quantidade_por_cesta: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
}

const emptyState: FormData = {
  nome: "",
  categoria_nome: "",
  quantidade_por_cesta: 1,
  unidade: "un",
  estoque_atual: 0,
  estoque_minimo: 0,
};

export function FormProduto({ produto, onSubmit, onCancel }: FormProdutoProps) {
  const [form, setForm] = useState<FormData>(emptyState);

  useEffect(() => {
    if (produto) {
      setForm({
        nome: produto.nome || "",
        categoria_nome: produto.categoria?.nome || "",
        quantidade_por_cesta: Number(produto.quantidade_por_cesta) || 1,
        unidade: produto.unidade || "un",
        estoque_atual: Number(produto.estoque_atual) || 0,
        estoque_minimo: Number(produto.estoque_minimo) || 0,
      });
    } else {
      setForm(emptyState);
    }
  }, [produto]);

  const handleChange = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form as Partial<Produto>);
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
          value={form.categoria_nome}
          onChange={(e) => handleChange("categoria_nome", e.target.value)}
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
