"use client";

import { useState } from "react";
import { Compra, Produto, Fornecedor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormCompraProps {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  onSubmit: (data: Partial<Compra>) => void;
}

export function FormCompra({ produtos, fornecedores, onSubmit }: FormCompraProps) {
  const [form, setForm] = useState<Partial<Compra>>({
    data: new Date().toISOString().split("T")[0],
    marca: "",
    quantidade: 1,
    valor_total: 0,
    observacao: "",
  });

  const handleChange = (field: keyof Compra, value: string | number | null | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value === null ? undefined : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({
      data: new Date().toISOString().split("T")[0],
      quantidade: 1,
      valor_total: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Produto</Label>
          <Select
            value={form.produto != null ? String(form.produto) : ""}
            onValueChange={(value) => handleChange("produto", Number(value))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input
            id="marca"
            value={form.marca || ""}
            onChange={(e) => handleChange("marca", e.target.value)}
            placeholder="Marca"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input
            id="quantidade"
            type="number"
            min={1}
            step="0.01"
            value={form.quantidade}
            onChange={(e) =>
              handleChange("quantidade", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_total">Valor Total (R$)</Label>
          <Input
            id="valor_total"
            type="number"
            min={0}
            step="0.01"
            value={form.valor_total}
            onChange={(e) =>
              handleChange("valor_total", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select
            value={form.fornecedor != null ? String(form.fornecedor) : ""}
            onValueChange={(value) =>
              handleChange("fornecedor", value ? Number(value) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={form.data}
            onChange={(e) => handleChange("data", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="observacao">Observação</Label>
          <Input
            id="observacao"
            value={form.observacao || ""}
            onChange={(e) => handleChange("observacao", e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Registrar Compra</Button>
      </div>
    </form>
  );
}
