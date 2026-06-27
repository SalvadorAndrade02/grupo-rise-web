"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Car,
  Gauge,
  ImageIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { VehicleLeadActions } from "@/components/vehicles/VehicleLeadActions";

type InventoryVehicle = {
  id: number;
  name: string;
  brandName: string;
  category: "AUTO" | "MOTO" | "TODOTERRENO";
  condition: "NUEVO" | "SEMINUEVO";
  status: string;
  year: number;
  price: number;
  mileage: number | null;
  branchId: number;
  branchName: string;
  branchCity: string;
  branchWhatsapp: string | null;
  mainImage: string;
};

type InventoryClientProps = {
  vehicles: InventoryVehicle[];
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

function formatMileage(value: number | null) {
  if (value === null || value === undefined) {
    return "Kilometraje por confirmar";
  }

  return `${new Intl.NumberFormat("es-MX").format(value)} km`;
}

export function InventoryClient({ vehicles }: InventoryClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("TODAS");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedYear, setSelectedYear] = useState("TODOS");
  const [selectedBranch, setSelectedBranch] = useState("TODAS");

  const brands = useMemo(() => {
    return Array.from(new Set(vehicles.map((vehicle) => vehicle.brandName))).sort();
  }, [vehicles]);

  const years = useMemo(() => {
    return Array.from(new Set(vehicles.map((vehicle) => vehicle.year)))
      .filter(Boolean)
      .sort((a, b) => b - a);
  }, [vehicles]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        vehicles.map((vehicle) => `${vehicle.branchName}|${vehicle.branchCity}`)
      )
    )
      .map((value) => {
        const [name, city] = value.split("|");

        return {
          value,
          label: `${name} · ${city}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const searchableText = [
        vehicle.brandName,
        vehicle.name,
        vehicle.year,
        vehicle.branchName,
        vehicle.branchCity,
        getCategoryLabel(vehicle.category),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = search
        ? searchableText.includes(search.trim().toLowerCase())
        : true;

      const matchesBrand =
        selectedBrand === "TODAS" || vehicle.brandName === selectedBrand;

      const matchesCategory =
        selectedCategory === "TODAS" || vehicle.category === selectedCategory;

      const matchesYear =
        selectedYear === "TODOS" || vehicle.year === Number(selectedYear);

      const branchValue = `${vehicle.branchName}|${vehicle.branchCity}`;
      const matchesBranch =
        selectedBranch === "TODAS" || branchValue === selectedBranch;

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesYear &&
        matchesBranch
      );
    });
  }, [vehicles, search, selectedBrand, selectedCategory, selectedYear, selectedBranch]);

  const groupedVehicles = useMemo(() => {
    return brands
      .map((brand) => ({
        brand,
        vehicles: filteredVehicles.filter((vehicle) => vehicle.brandName === brand),
      }))
      .filter((group) => group.vehicles.length > 0);
  }, [brands, filteredVehicles]);

  const brandCards = useMemo(() => {
    return brands.map((brand) => {
      const brandVehicles = vehicles.filter((vehicle) => vehicle.brandName === brand);
      const firstImage = brandVehicles.find((vehicle) => vehicle.mainImage)?.mainImage;

      return {
        brand,
        total: brandVehicles.length,
        image: firstImage || "",
      };
    });
  }, [brands, vehicles]);

  function clearFilters() {
    setSearch("");
    setSelectedBrand("TODAS");
    setSelectedCategory("TODAS");
    setSelectedYear("TODOS");
    setSelectedBranch("TODAS");
  }

  const hasFilters =
    Boolean(search) ||
    selectedBrand !== "TODAS" ||
    selectedCategory !== "TODAS" ||
    selectedYear !== "TODOS" ||
    selectedBranch !== "TODAS";

  return (
    <section className="pb-12 md:pb-16">
      <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Seminuevos por marca
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Inventario disponible
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Explora unidades seminuevas reales, agrupadas por marca, sucursal,
              año y tipo de vehículo.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
            <SlidersHorizontal size={17} />
            {filteredVehicles.length} resultado(s)
          </div>
        </div>

        {brandCards.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {brandCards.map((brand) => {
              const active = selectedBrand === brand.brand;

              return (
                <button
                  key={brand.brand}
                  type="button"
                  onClick={() =>
                    setSelectedBrand(active ? "TODAS" : brand.brand)
                  }
                  className={`group overflow-hidden rounded-[2rem] border text-left transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                    active
                      ? "border-[var(--rise-blue)] bg-[var(--rise-blue-soft)]"
                      : "border-slate-100 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="h-36 overflow-hidden bg-slate-100">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={brand.brand}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-400">
                        <ImageIcon size={36} />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                      Marca
                    </p>

                    <h3 className="mt-2 text-xl font-black text-[var(--rise-navy)]">
                      {brand.brand}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {brand.total} seminuevo(s) disponible(s)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-slate-100 bg-slate-50 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Buscar
              </span>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ej. Classic, RZR, Defender..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Marca
              </span>

              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)]"
              >
                <option value="TODAS">Todas</option>

                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Tipo
              </span>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)]"
              >
                <option value="TODAS">Todos</option>
                <option value="AUTO">Autos</option>
                <option value="MOTO">Motos</option>
                <option value="TODOTERRENO">Todo terreno</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Año
              </span>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)]"
              >
                <option value="TODOS">Todos</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sucursal
              </span>

              <select
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)]"
              >
                <option value="TODAS">Todas</option>

                {branches.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 xl:self-end"
            >
              Limpiar
            </button>
          </div>
        </div>

        {groupedVehicles.length > 0 ? (
          <div className="mt-10 grid gap-10">
            {groupedVehicles.map((group) => (
              <section key={group.brand}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                      {group.brand}
                    </p>

                    <h3 className="mt-2 text-3xl font-black tracking-tight">
                      {group.vehicles.length} seminuevo(s) disponible(s)
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {group.vehicles.map((vehicle) => {
                    const vehicleName = `${vehicle.brandName} ${vehicle.name}`;

                    return (
                      <article
                        key={vehicle.id}
                        className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                      >
                        <Link href={`/vehiculos/${vehicle.id}`}>
                          <div className="relative h-56 overflow-hidden bg-slate-100">
                            {vehicle.mainImage ? (
                              <img
                                src={vehicle.mainImage}
                                alt={vehicleName}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-slate-400">
                                <ImageIcon size={46} />
                              </div>
                            )}

                            <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)] shadow-sm">
                              Seminuevo
                            </div>
                          </div>
                        </Link>

                        <div className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                                {vehicle.brandName}
                              </p>

                              <Link href={`/vehiculos/${vehicle.id}`}>
                                <h4 className="mt-2 line-clamp-2 text-2xl font-black text-[var(--rise-navy)] transition hover:text-[var(--rise-blue)]">
                                  {vehicle.name}
                                </h4>
                              </Link>
                            </div>

                            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                              {vehicle.year}
                            </p>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-2">
                              <Tags size={16} className="text-[var(--rise-blue)]" />
                              {getCategoryLabel(vehicle.category)}
                            </div>

                            <div className="flex items-center gap-2">
                              <Gauge size={16} className="text-[var(--rise-blue)]" />
                              {formatMileage(vehicle.mileage)}
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-[var(--rise-blue)]" />
                              {vehicle.branchCity}
                            </div>

                            <div className="flex items-center gap-2">
                              <Building2
                                size={16}
                                className="text-[var(--rise-blue)]"
                              />
                              {vehicle.branchName}
                            </div>
                          </div>

                          <p className="mt-5 text-2xl font-black text-[var(--rise-blue)]">
                            {formatCurrency(vehicle.price)}
                          </p>

                          <div className="mt-5 grid gap-3">
                            <VehicleLeadActions
                              vehicleId={vehicle.id}
                              branchId={vehicle.branchId}
                              vehicleName={vehicleName}
                              whatsapp={vehicle.branchWhatsapp}
                              mode="stack"
                            />

                            <Link
                              href={`/vehiculos/${vehicle.id}`}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                            >
                              Ver detalle
                              <ArrowRight size={17} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Car className="mx-auto text-slate-400" size={50} />

            <h3 className="mt-4 text-2xl font-black">
              No encontramos seminuevos con esos filtros.
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Intenta buscar por otra marca, año, tipo o sucursal.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}