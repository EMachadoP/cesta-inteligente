"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/produtos", label: "Produtos" },
  { href: "/compras", label: "Compras" },
  { href: "/estoque", label: "Estoque" },
  { href: "/precos", label: "Preços" },
  { href: "/marcas", label: "Marcas" },
  { href: "/simulador", label: "Simulador" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/inteligencia", label: "Inteligência" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <span className="font-bold text-primary">Cesta Inteligente</span>
      </div>

      <div className="hidden md:block">
        <h1 className="text-lg font-semibold">
          {navItems.find((i) => i.href === pathname)?.label || "Cesta Inteligente"}
        </h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <span className="font-bold text-primary">Cesta Inteligente</span>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
