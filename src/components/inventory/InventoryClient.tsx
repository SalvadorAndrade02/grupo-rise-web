"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RequestModal } from "@/components/ui/RequestModal";
import { VehicleLeadActions } from "@/components/vehicles/VehicleLeadActions";

type DbVehicleCategory = "AUTO" | "MOTO" | "TODOTERRENO";
type DbVehicleCondition = "NUEVO" | "SEMINUEVO";
type DbVehicleStatus =
  | "DISPONIBLE"
  | "APARTADO"
  | "VENDIDO"
  | "EN_TRANSITO"
  | "PROXIMAMENTE"
  | "INACTIVO";

type PublicVehicle = {
  id: number;
  category: DbVehicleCategory;
  condition: DbVehicleCondition;
  status: DbVehicleStatus;
  brandId: number;
  brandName: string;
  branchId: number;
  branchName: string;
  branchCity: string;
  branchWhatsapp?: string | null;
  name: string;
  model: string;
  version: string | null;
  year: number;
  price: number;
  type: string;
  color: string | null;
  mileage: number | null;
  specs: string[];
  mainImage: string | null;
  isFeatured: boolean;
};

type PublicBrand = {
  id: number;
  name: string;
  category: DbVehicleCategory;
};

type PublicBranch = {
  id: number;
  name: string;
  city: string;
  state: string;
};

type CategoryFilter = "TODOS" | DbVehicleCategory;
type ConditionFilter = "TODOS" | DbVehicleCondition;

type InventoryClientProps = {
  vehicles: PublicVehicle[];
  brands: PublicBrand[];
  branches: PublicBranch[];
  initialCategory?: CategoryFilter;
  initialCondition?: ConditionFilter;
  initialSearch?: string;
  initialMaxPrice?: string;
};


const categoryLabels: Record<DbVehicleCategory, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  TODOTERRENO: "Todo terreno",
};

const conditionLabels: Record<DbVehicleCondition, string> = {
  NUEVO: "Nuevo",
  SEMINUEVO: "Seminuevo",
};

const statusLabels: Record<DbVehicleStatus, string> = {
  DISPONIBLE: "Disponible",
  APARTADO: "Apartado",
  VENDIDO: "Vendido",
  EN_TRANSITO: "En tránsito",
  PROXIMAMENTE: "Próximamente",
  INACTIVO: "Inactivo",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function InventoryClient({
  vehicles,
  brands,
  branches,
  initialCategory = "TODOS",
  initialCondition = "TODOS",
  initialSearch = "",
  initialMaxPrice = "TODOS",
}: InventoryClientProps) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [condition, setCondition] = useState<ConditionFilter>(initialCondition);
  const [brandId, setBrandId] = useState("TODOS");
  const [branchId, setBranchId] = useState("TODOS");
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [search, setSearch] = useState(initialSearch);
  const [selectedVehicle, setSelectedVehicle] = useState<PublicVehicle | null>(
    null

  );


  const availableBrands = useMemo(() => {
    if (category === "TODOS") {
      return brands;
    }

    return brands.filter((brand) => brand.category === category);
  }, [brands, category]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesCategory =
        category === "TODOS" || vehicle.category === category;

      const matchesBrand =
        brandId === "TODOS" || vehicle.brandId === Number(brandId);

      const matchesBranch =
        branchId === "TODOS" || vehicle.branchId === Number(branchId);

      const matchesPrice =
        maxPrice === "TODOS" || vehicle.price <= Number(maxPrice);

      const searchText = [
        vehicle.name,
        vehicle.brandName,
        vehicle.model,
        vehicle.version,
        vehicle.type,
        vehicle.branchCity,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        search.trim() === "" ||
        searchText.includes(search.trim().toLowerCase());

      return (
        matchesCategory &&
        matchesBrand &&
        matchesBranch &&
        matchesPrice &&
        matchesSearch
      );
    });
  }, [vehicles, category, condition, brandId, branchId, maxPrice, search]);

  function resetFilters() {
    setCategory("TODOS");
    setCondition("TODOS");
    setBrandId("TODOS");
    setBranchId("TODOS");
    setMaxPrice("TODOS");
    setSearch("");
  }

  return (
    <>
      <section className="bg-[var(--rise-navy)] py-14 text-white md:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Inventario Grupo Rise
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              Explora autos, motos y todo terreno.
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">
              Consulta unidades seminuevas disponibles.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <SlidersHorizontal size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-[var(--rise-navy)]">
                  Filtros de búsqueda
                </h2>
                <p className="text-sm text-slate-500">
                  Encuentra el vehículo ideal por categoría, marca, condición y
                  sucursal.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label className="block xl:col-span-2">
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
                    placeholder="Marca, modelo, versión o sucursal"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría
                </span>

                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as CategoryFilter);
                    setBrandId("TODOS");
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todas</option>
                  <option value="AUTO">Auto</option>
                  <option value="MOTO">Moto</option>
                  <option value="TODOTERRENO">Todo terreno</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Condición
                </span>

                <select
                  value={condition}
                  onChange={(event) =>
                    setCondition(event.target.value as ConditionFilter)
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todas</option>
                  <option value="NUEVO">Nuevo</option>
                  <option value="SEMINUEVO">Seminuevo</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Marca
                </span>

                <select
                  value={brandId}
                  onChange={(event) => setBrandId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todas</option>
                  {availableBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sucursal
                </span>

                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todas</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.city}
                    </option>
                  ))}
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
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {filteredVehicles.length} resultado(s) encontrados
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-black text-[var(--rise-blue)] hover:text-[var(--rise-navy)]"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-16 pt-4">
        <Container>
          {filteredVehicles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredVehicles.map((vehicle) => (
                <article
                  key={vehicle.id}
                  className="group overflow-hidden rounded-3xl border border-[var(--rise-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    {vehicle.mainImage ? (
                      <img
                        src={vehicle.mainImage}
                        alt={vehicle.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[var(--rise-blue-soft)] text-sm font-black text-[var(--rise-blue)]">
                        Sin imagen
                      </div>
                    )}

                    <span className="absolute left-4 top-4 rounded-full bg-[var(--rise-navy)]/90 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {vehicle.type}
                    </span>

                    <button
                      type="button"
                      className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:text-[var(--rise-blue)]"
                      aria-label="Agregar a favoritos"
                    >
                      <Heart size={18} />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                        {conditionLabels[vehicle.condition]}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {statusLabels[vehicle.status]}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-[var(--rise-navy)]">
                      {vehicle.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {vehicle.brandName} · {vehicle.year} ·{" "}
                      {categoryLabels[vehicle.category]}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                      {vehicle.specs.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-slate-100 px-3 py-1"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-2xl font-black text-[var(--rise-navy)]">
                      {formatCurrency(vehicle.price)}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-[var(--rise-blue)]" />
                      {vehicle.branchCity}
                    </div>

                    <div className="mt-5 grid gap-3">
                      <Link
                        href={`/vehiculos/${vehicle.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-[var(--rise-border)] px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                      >
                        Ver detalles
                      </Link>

                      <VehicleLeadActions
                        vehicleId={vehicle.id}
                        branchId={vehicle.branchId}
                        vehicleName={`${vehicle.brandName} ${vehicle.name}`}
                        whatsapp={vehicle.branchWhatsapp}
                        mode="compact"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-black text-[var(--rise-navy)]">
                No encontramos resultados
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                Intenta cambiar los filtros o limpiar la búsqueda para ver más
                unidades disponibles.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </Container>
      </section>

      <RequestModal
        isOpen={Boolean(selectedVehicle)}
        title="Solicita una cotización"
        description="Déjanos tus datos y un asesor de Grupo Rise te contactará para compartirte disponibilidad, precio y opciones de financiamiento."
        requestType="Cotización"
        vehicleName={selectedVehicle?.name}
        onClose={() => setSelectedVehicle(null)}
      />
    </>
  );
}