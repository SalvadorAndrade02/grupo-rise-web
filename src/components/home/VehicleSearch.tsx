"use client";

import { Search } from "lucide-react";
import { Container } from "@/components/ui/Container";

const fields = [
  {
    label: "Categoría",
    options: ["Auto / Moto", "Auto", "Moto"],
  },
  {
    label: "Tipo",
    options: ["Nuevo / Seminuevo", "Nuevo", "Seminuevo"],
  },
  {
    label: "Marca",
    options: ["Todas las marcas", "Volkswagen", "Yamaha", "Kawasaki"],
  },
  {
    label: "Modelo",
    options: ["Todos los modelos", "SUV", "Sedán", "Deportiva"],
  },
  {
    label: "Precio máximo",
    options: ["Sin límite", "$250,000", "$500,000", "$750,000"],
  },
  {
    label: "Sucursal o Estado",
    options: ["Todas las sucursales", "Guadalajara", "CDMX", "Monterrey"],
  },
];

export function VehicleSearch() {
  function handleSearch() {
    const section = document.getElementById("vehiculos-destacados");
    section?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <Container>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {fields.map((field) => (
            <label key={field.label} className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                {field.label}
              </span>

              <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white">
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}

          <button
            type="button"
            onClick={handleSearch}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 lg:self-end"
          >
            <Search size={18} />
            Buscar
          </button>
        </div>
      </div>
    </Container>
  );
}