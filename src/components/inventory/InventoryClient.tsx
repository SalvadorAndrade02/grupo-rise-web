"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Car,
  Gauge,
  ImageIcon,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

type InventoryBrand = {
  id: number;
  name: string;
};

type InventoryVehicle = {
  id: number;
  name: string;
  brandName: string;
  category: "AUTO" | "MOTO" | "TODOTERRENO" | "NAUTICA";
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
  brands: InventoryBrand[];
};

const VEHICLES_PER_PAGE = 12;

const priceFilters = [
  {
    label: "Todos los precios",
    value: "TODOS",
    min: null,
    max: null,
  },
  {
    label: "Hasta $250 mil",
    value: "0-250000",
    min: 0,
    max: 250000,
  },
  {
    label: "$250 mil a $500 mil",
    value: "250000-500000",
    min: 250000,
    max: 500000,
  },
  {
    label: "$500 mil a $800 mil",
    value: "500000-800000",
    min: 500000,
    max: 800000,
  },
  {
    label: "Más de $800 mil",
    value: "800000",
    min: 800000,
    max: null,
  },
];

const mileageFilters = [
  {
    label: "Todos los kilometrajes",
    value: "TODOS",
    min: null,
    max: null,
  },
  {
    label: "Hasta 5,000 km",
    value: "0-5000",
    min: 0,
    max: 5000,
  },
  {
    label: "5,000 a 15,000 km",
    value: "5000-15000",
    min: 5000,
    max: 15000,
  },
  {
    label: "15,000 a 30,000 km",
    value: "15000-30000",
    min: 15000,
    max: 30000,
  },
  {
    label: "Más de 30,000 km",
    value: "30000",
    min: 30000,
    max: null,
  },
];

const orderOptions = [
  {
    label: "Más recientes",
    value: "recientes",
  },
  {
    label: "Precio menor a mayor",
    value: "precio-asc",
  },
  {
    label: "Precio mayor a menor",
    value: "precio-desc",
  },
  {
    label: "Año más nuevo",
    value: "anio-desc",
  },
  {
    label: "Menor kilometraje",
    value: "km-asc",
  },
];

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Motocicleta",
    TODOTERRENO: "Todoterreno",
    NAUTICA: "Náutica",
  };

  return labels[category] ?? category;
}

function getBrandLogo(brandName: string) {
  const logos: Record<string, string> = {
    "Can-Am": "/catalog/brands/can-am.png",
    Polaris: "/catalog/brands/polaris.jpg",

    "Sea-Doo": "/catalog/brands/sea-doo.png",
    "Sea Doo": "/catalog/brands/sea-doo.png",
    SeaDoo: "/catalog/brands/sea-doo.png",

    Triumph: "/catalog/brands/triumph.jpg",
    "Triumph Motorcycles": "/catalog/brands/triumph.jpg",

    "Royal Enfield": "/catalog/brands/royal-enfield.jpg",

    Indian: "/catalog/brands/indian.jpg",
    "Indian Motorcycle": "/catalog/brands/indian.jpg",

    Zeekr: "/catalog/brands/zeekr.jpg",
    Zeekrlife: "/catalog/brands/zeekr.jpg",

    "Lynk & Co": "/catalog/brands/lynkco.jpg",
  };

  return logos[brandName] ?? null;
}

function formatMileage(value: number | null) {
  if (value === null || value === undefined) {
    return "Kilometraje por confirmar";
  }

  return `${new Intl.NumberFormat("es-MX").format(value)} km`;
}

function getPriceFilter(value: string) {
  return (
    priceFilters.find((filter) => filter.value === value) ??
    priceFilters[0]
  );
}

function getMileageFilter(value: string) {
  return (
    mileageFilters.find((filter) => filter.value === value) ??
    mileageFilters[0]
  );
}

function getMileageValue(value: number | null) {
  return value ?? Number.MAX_SAFE_INTEGER;
}

export function InventoryClient({
  vehicles,
  brands: availableBrands,
}: InventoryClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("TODAS");
  const [selectedCategory, setSelectedCategory] =
    useState("TODAS");
  const [selectedYear, setSelectedYear] = useState("TODOS");
  const [selectedBranch, setSelectedBranch] =
    useState("TODAS");
  const [selectedPrice, setSelectedPrice] = useState("TODOS");
  const [selectedMileage, setSelectedMileage] =
    useState("TODOS");
  const [selectedOrder, setSelectedOrder] =
    useState("recientes");
  const [currentPage, setCurrentPage] = useState(1);

  const brands = useMemo(() => {
    return availableBrands
      .map((brand) => brand.name)
      .sort((a, b) => a.localeCompare(b));
  }, [availableBrands]);
  const years = useMemo(() => {
    return Array.from(
      new Set(vehicles.map((vehicle) => vehicle.year))
    )
      .filter(Boolean)
      .sort((a, b) => b - a);
  }, [vehicles]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        vehicles.map(
          (vehicle) =>
            `${vehicle.branchName}|${vehicle.branchCity}`
        )
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
    const priceFilter = getPriceFilter(selectedPrice);
    const mileageFilter = getMileageFilter(selectedMileage);

    const results = vehicles.filter((vehicle) => {
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

      const matchesSearch = search.trim()
        ? searchableText.includes(search.trim().toLowerCase())
        : true;

      const matchesBrand =
        selectedBrand === "TODAS" ||
        vehicle.brandName === selectedBrand;

      const matchesCategory =
        selectedCategory === "TODAS" ||
        vehicle.category === selectedCategory;

      const matchesYear =
        selectedYear === "TODOS" ||
        vehicle.year === Number(selectedYear);

      const branchValue =
        `${vehicle.branchName}|${vehicle.branchCity}`;

      const matchesBranch =
        selectedBranch === "TODAS" ||
        branchValue === selectedBranch;

      const matchesPriceMin =
        priceFilter.min !== null
          ? vehicle.price >= priceFilter.min
          : true;

      const matchesPriceMax =
        priceFilter.max !== null
          ? vehicle.price <= priceFilter.max
          : true;

      const vehicleMileage = vehicle.mileage;

      const matchesMileageMin =
        mileageFilter.min !== null
          ? vehicleMileage !== null &&
          vehicleMileage >= mileageFilter.min
          : true;

      const matchesMileageMax =
        mileageFilter.max !== null
          ? vehicleMileage !== null &&
          vehicleMileage <= mileageFilter.max
          : true;

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesYear &&
        matchesBranch &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesMileageMin &&
        matchesMileageMax
      );
    });

    return [...results].sort((a, b) => {
      if (selectedOrder === "precio-asc") {
        return a.price - b.price;
      }

      if (selectedOrder === "precio-desc") {
        return b.price - a.price;
      }

      if (selectedOrder === "anio-desc") {
        return b.year - a.year;
      }

      if (selectedOrder === "km-asc") {
        return (
          getMileageValue(a.mileage) -
          getMileageValue(b.mileage)
        );
      }

      return b.id - a.id;
    });
  }, [
    vehicles,
    search,
    selectedBrand,
    selectedCategory,
    selectedYear,
    selectedBranch,
    selectedPrice,
    selectedMileage,
    selectedOrder,
  ]);

  /*
   * Cada vez que cambia un filtro se regresa a la página uno.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [
    search,
    selectedBrand,
    selectedCategory,
    selectedYear,
    selectedBranch,
    selectedPrice,
    selectedMileage,
    selectedOrder,
  ]);

  const totalVehicles = filteredVehicles.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalVehicles / VEHICLES_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    (safeCurrentPage - 1) * VEHICLES_PER_PAGE;

  const endIndex = startIndex + VEHICLES_PER_PAGE;

  const paginatedVehicles = filteredVehicles.slice(
    startIndex,
    endIndex
  );

  const firstVisibleVehicle =
    totalVehicles === 0 ? 0 : startIndex + 1;

  const lastVisibleVehicle = Math.min(
    endIndex,
    totalVehicles
  );

  function clearFilters() {
    setSearch("");
    setSelectedBrand("TODAS");
    setSelectedCategory("TODAS");
    setSelectedYear("TODOS");
    setSelectedBranch("TODAS");
    setSelectedPrice("TODOS");
    setSelectedMileage("TODOS");
    setSelectedOrder("recientes");
    setCurrentPage(1);
  }

  const hasFilters =
    Boolean(search.trim()) ||
    selectedBrand !== "TODAS" ||
    selectedCategory !== "TODAS" ||
    selectedYear !== "TODOS" ||
    selectedBranch !== "TODAS" ||
    selectedPrice !== "TODOS" ||
    selectedMileage !== "TODOS" ||
    selectedOrder !== "recientes";

  const selectedOrderLabel =
    orderOptions.find(
      (option) => option.value === selectedOrder
    )?.label ?? "Más recientes";
    
return (
  <section className="relative z-10 -mt-6 px-5 pb-14 md:px-8 md:pb-20 lg:px-10">
    <div className="mx-auto w-full max-w-[1440px]">
      {/* Selector de marcas */}
      {brands.length > 0 && (
        <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#192a3a]" />

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                  Seminuevos por marca
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                Explora nuestras marcas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBrand("TODAS")}
              className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-xs font-black uppercase tracking-[0.13em] transition active:scale-[0.98] ${selectedBrand === "TODAS"
                ? "border-[#192a3a] bg-[#192a3a] text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#192a3a] hover:bg-white hover:text-[#192a3a]"
                }`}
            >
              Todas
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {brands.map((brand) => {
              const active = selectedBrand === brand;
              const logo = getBrandLogo(brand);

              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() =>
                    setSelectedBrand(active ? "TODAS" : brand)
                  }
                  aria-label={`Filtrar seminuevos de ${brand}`}
                  aria-pressed={active}
                  className={`group relative flex min-h-[118px] items-center justify-center overflow-hidden border-b border-r px-5 py-6 transition duration-300 hover:z-10 hover:bg-[#f1f5f7] active:bg-[#e7edf1] ${active
                    ? "border-[#192a3a] bg-[#e7edf1]"
                    : "border-slate-200 bg-white"
                    }`}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={`Logo ${brand}`}
                      className={`max-h-[56px] w-full object-contain transition duration-300 group-hover:scale-105 group-active:scale-105 ${active
                        ? "grayscale-0"
                        : "grayscale group-hover:grayscale-0 group-active:grayscale-0"
                        }`}
                    />
                  ) : (
                    <span className="text-center text-sm font-black text-[#192a3a]">
                      {brand}
                    </span>
                  )}

                  <span
                    className={`absolute bottom-0 left-0 h-[3px] bg-[#192a3a] transition-all duration-300 ${active
                      ? "w-full"
                      : "w-0 group-hover:w-full group-active:w-full"
                      }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Filtros */}
      <section className="mt-7 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#192a3a]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                Buscar y filtrar
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
              Encuentra tu seminuevo
            </h2>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase tracking-[0.13em] text-slate-600 transition hover:border-[#192a3a] hover:bg-white hover:text-[#192a3a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Marca, modelo o sucursal"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
              />
            </div>
          </label>

          <FilterSelect
            label="Marca"
            value={selectedBrand}
            onChange={setSelectedBrand}
          >
            <option value="TODAS">Todas</option>

            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Categoría"
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            <option value="TODAS">Todas</option>
            <option value="AUTO">Autos</option>
            <option value="MOTO">Motocicletas</option>
            <option value="TODOTERRENO">
              Todoterreno
            </option>
          </FilterSelect>

          <FilterSelect
            label="Año"
            value={selectedYear}
            onChange={setSelectedYear}
          >
            <option value="TODOS">Todos</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Precio"
            value={selectedPrice}
            onChange={setSelectedPrice}
          >
            {priceFilters.map((filter) => (
              <option
                key={filter.value}
                value={filter.value}
              >
                {filter.label}
              </option>
            ))}
          </FilterSelect>

         {/*  <FilterSelect
            label="Kilometraje"
            value={selectedMileage}
            onChange={setSelectedMileage}
          >
            {mileageFilters.map((filter) => (
              <option
                key={filter.value}
                value={filter.value}
              >
                {filter.label}
              </option>
            ))}
          </FilterSelect> */}

          <FilterSelect
            label="Sucursal"
            value={selectedBranch}
            onChange={setSelectedBranch}
          >
            <option value="TODAS">Todas</option>

            {branches.map((branch) => (
              <option
                key={branch.value}
                value={branch.value}
              >
                {branch.label}
              </option>
            ))}
          </FilterSelect>

          {/* <FilterSelect
            label="Ordenar"
            value={selectedOrder}
            onChange={setSelectedOrder}
          >
            {orderOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </FilterSelect> */}
        </div>
      </section>

      {/* Resultados */}
      <div className="mt-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#192a3a]" />

            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
              Resultados
            </p>
          </div>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
            {totalVehicles} seminuevo
            {totalVehicles === 1 ? "" : "s"} disponible
            {totalVehicles === 1 ? "" : "s"}
          </h2>

          {totalVehicles > 0 && (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Mostrando {firstVisibleVehicle}–
              {lastVisibleVehicle} de {totalVehicles} unidades
            </p>
          )}
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">
          <ArrowUpDown size={17} />
          {selectedOrderLabel}
        </div>
      </div>

      {/* Vehículos */}
      {totalVehicles > 0 ? (
        <>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedVehicles.map((vehicle) => (
              <InventoryVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <InventoryPagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="mt-8 rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <Car
            className="mx-auto text-slate-400"
            size={48}
          />

          <h3 className="mt-4 text-2xl font-black">
            No encontramos seminuevos con esos filtros
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Intenta limpiar los filtros o buscar por otra marca,
            categoría, año, sucursal, precio o kilometraje.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#0a0f14] px-5 text-sm font-black text-white transition hover:bg-[#192a3a] active:scale-[0.98]"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  </section>
);
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#192a3a] focus:bg-white"
      >
        {children}
      </select>
    </label>
  );
}

function InventoryVehicleCard({
  vehicle,
}: {
  vehicle: InventoryVehicle;
}) {
  const vehicleName =
    `${vehicle.brandName} ${vehicle.name}`;

  return (
    <Link
      href={`/vehiculos/${vehicle.id}`}
      className="group block overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/50 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] active:border-[#192a3a]/50"
    >
      <div className="relative h-[250px] overflow-hidden bg-[#e8ecef]">
        {vehicle.mainImage ? (
          <img
            src={vehicle.mainImage}
            alt={vehicleName}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <ImageIcon size={46} />
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#192a3a] shadow-sm backdrop-blur-sm">
          Seminuevo
        </span>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#0a0f14] shadow-lg transition duration-300 group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-active:translate-x-0.5"
          />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
          {vehicle.brandName}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[58px] text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14]">
          {vehicle.name}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#e7edf1] px-3 py-1.5 text-xs font-black text-[#192a3a]">
            {vehicle.year}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
            <Gauge size={14} />
            {formatMileage(vehicle.mileage)}
          </span>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Precio
          </p>

          <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#0a0f14]">
            {formatCurrency(vehicle.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function InventoryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageNumbers = Array.from(
    new Set([
      1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      totalPages,
    ])
  )
    .filter(
      (page) =>
        page >= 1 && page <= totalPages
    )
    .sort((a, b) => a - b);

  function changePage(page: number) {
    onPageChange(page);

    window.scrollTo({
      top: 500,
      behavior: "smooth",
    });
  }

  return (
    <nav
      aria-label="Paginación de seminuevos"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#192a3a] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-slate-100"
      >
        Anterior
      </button>

      {pageNumbers.map((page, index) => {
        const previousPage = pageNumbers[index - 1];

        const showSeparator =
          previousPage !== undefined &&
          page - previousPage > 1;

        return (
          <div
            key={page}
            className="flex items-center gap-2"
          >
            {showSeparator && (
              <span className="px-1 text-sm font-black text-slate-400">
                …
              </span>
            )}

            <button
              type="button"
              onClick={() => changePage(page)}
              aria-current={
                page === currentPage ? "page" : undefined
              }
              className={`grid h-11 w-11 place-items-center rounded-xl border text-sm font-black transition active:scale-95 ${page === currentPage
                ? "border-[#192a3a] bg-[#192a3a] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#192a3a] hover:text-[#192a3a]"
                }`}
            >
              {page}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#192a3a] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-slate-100"
      >
        Siguiente
      </button>
    </nav>
  );
}