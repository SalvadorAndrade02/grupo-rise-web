"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Heart, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RequestModal } from "@/components/ui/RequestModal";
import { SectionTitle } from "@/components/ui/SectionTitle";
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

type HomeVehicle = {
  id: number;
  category: DbVehicleCategory;
  condition: DbVehicleCondition;
  status: DbVehicleStatus;
  brandName: string;
  branchId: number;
  branchCity: string;
  branchWhatsapp?: string | null;
  name: string;
  model: string;
  year: number;
  price: number;
  type: string;
  specs: string[];
  mainImage: string | null;
};

type FeaturedVehiclesProps = {
  vehicles: HomeVehicle[];
};

type FilterTab = "TODOS" | DbVehicleCategory;

const tabs: { label: string; value: FilterTab }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "Autos", value: "AUTO" },
  { label: "Motos", value: "MOTO" },
  { label: "Todo terreno", value: "TODOTERRENO" },
];

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

export function FeaturedVehicles({ vehicles }: FeaturedVehiclesProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("TODOS");
  const [selectedVehicle, setSelectedVehicle] = useState<HomeVehicle | null>(
    null
  );

  const filteredVehicles = useMemo(() => {
    if (activeTab === "TODOS") {
      return vehicles;
    }

    return vehicles.filter((vehicle) => vehicle.category === activeTab);
  }, [activeTab, vehicles]);

  return (
    <section id="vehiculos-destacados" className="py-12 md:py-16">
      <Container>
        <SectionTitle
          eyebrow="Inventario destacado"
          title="Unidades seleccionadas por Grupo Rise"
          description="Vehículos activos marcados como destacados desde el módulo administrativo."
          action={
            <Link
              href="/inventario"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--rise-blue)] hover:text-[var(--rise-navy)]"
            >
              Ver todo el inventario
              <ChevronRight size={18} />
            </Link>
          }
        />

        <div className="mb-8 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${activeTab === tab.value
                  ? "bg-[var(--rise-navy)] text-white"
                  : "bg-white text-slate-600 hover:bg-[var(--rise-blue-soft)] hover:text-[var(--rise-blue)]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                    {vehicle.brandName} · {vehicle.year}
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
              No hay vehículos destacados
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Marca unidades como destacadas desde el módulo administrativo para
              mostrarlas en esta sección.
            </p>

            <Link
              href="/admin/inventario"
              className="mt-6 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              Ir al inventario admin
            </Link>
          </div>
        )}
      </Container>

      <RequestModal
        isOpen={Boolean(selectedVehicle)}
        title="Solicita una cotización"
        description="Déjanos tus datos y un asesor de Grupo Rise te contactará para compartirte disponibilidad, precio y opciones de financiamiento."
        requestType="Cotización"
        vehicleName={selectedVehicle?.name}
        onClose={() => setSelectedVehicle(null)}
      />
    </section>
  );
}