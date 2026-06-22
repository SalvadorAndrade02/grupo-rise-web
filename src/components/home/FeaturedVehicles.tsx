"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Heart, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RequestModal } from "@/components/ui/RequestModal";
import { vehicles } from "@/data/vehicles";
import { Vehicle, VehicleCategory } from "@/types/vehicle";
import Link from "next/link";

type FilterTab = "todos" | VehicleCategory;

const tabs: { label: string; value: FilterTab }[] = [
  { label: "Todos", value: "todos" },
  { label: "Autos", value: "auto" },
  { label: "Motos", value: "moto" },
  { label: "Todo terreno", value: "todoterreno" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FeaturedVehicles() {
  const [activeTab, setActiveTab] = useState<FilterTab>("todos");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = useMemo(() => {
    const featured = vehicles.filter((vehicle) => vehicle.isFeatured);

    if (activeTab === "todos") {
      return featured;
    }

    return featured.filter((vehicle) => vehicle.category === activeTab);
  }, [activeTab]);

  return (
    <section id="vehiculos-destacados" className="py-16">
      <Container>
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              Inventario seleccionado
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Vehículos destacados
            </h2>

            <div className="mt-5 flex gap-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${isActive
                      ? "bg-blue-700 text-white shadow-sm shadow-blue-900/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/inventario"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--rise-blue)] hover:text-[var(--rise-navy)]"
          >
            Ver todo el inventario
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {filteredVehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  {vehicle.type}
                </span>

                <button
                  type="button"
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:text-blue-700"
                  aria-label="Agregar a favoritos"
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-black text-slate-950">
                  {vehicle.name}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  {vehicle.specs.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full bg-slate-100 px-3 py-1"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <p className="mt-5 text-2xl font-black text-slate-950">
                  {formatCurrency(vehicle.price)}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-blue-700" />
                  Disponible en {vehicle.location}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href={`/vehiculos/${vehicle.id}`}
                    className="rounded-xl border border-blue-200 px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                  >
                    Ver detalles
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-800"
                  >
                    Cotizar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <RequestModal
        isOpen={Boolean(selectedVehicle)}
        title="Solicita una cotización"
        description="Déjanos tus datos y un asesor te contactará para compartirte información del vehículo, disponibilidad y opciones de financiamiento."
        requestType="Cotización"
        vehicleName={selectedVehicle?.name}
        onClose={() => setSelectedVehicle(null)}
      />
    </section>
  );
}