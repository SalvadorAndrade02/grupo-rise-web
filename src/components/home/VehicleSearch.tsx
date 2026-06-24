"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function VehicleSearch() {
  const router = useRouter();

  const [category, setCategory] = useState("TODOS");
  const [condition, setCondition] = useState("TODOS");
  const [maxPrice, setMaxPrice] = useState("TODOS");
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (category !== "TODOS") {
      params.set("categoria", category);
    }

    if (condition !== "TODOS") {
      params.set("condicion", condition);
    }

    if (maxPrice !== "TODOS") {
      params.set("precioMax", maxPrice);
    }

    if (query.trim()) {
      params.set("q", query.trim());
    }

    const queryString = params.toString();

    router.push(queryString ? `/inventario?${queryString}` : "/inventario");
  }

  return (
    <Container>
      <form
        onSubmit={handleSearch}
        className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-6"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
              Buscar
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Marca, modelo o versión"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
              Categoría
            </span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            >
              <option value="TODOS">Todas</option>
              <option value="AUTO">Autos</option>
              <option value="MOTO">Motos</option>
              <option value="TODOTERRENO">Todo terreno</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
              Condición
            </span>

            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            >
              <option value="TODOS">Todas</option>
              <option value="NUEVO">Nuevo</option>
              <option value="SEMINUEVO">Seminuevo</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
              Precio máximo
            </span>

            <select
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            >
              <option value="TODOS">Sin límite</option>
              <option value="150000">$150,000</option>
              <option value="300000">$300,000</option>
              <option value="500000">$500,000</option>
              <option value="800000">$800,000</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] xl:self-end"
          >
            <Search size={18} />
            Buscar
          </button>
        </div>
      </form>
    </Container>
  );
}