import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  Gauge,
  MapPin,
  Palette,
  ShieldCheck,
  Tag,
  Wrench,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { VehicleMediaGallery } from "@/components/vehicles/VehicleMediaGallery";
import { VehicleDetailActions } from "@/components/vehicles/VehicleDetailActions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[value] ?? value;
}

function getConditionLabel(value: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[value] ?? value;
}

function getStatusLabel(value: string) {
  const labels: Record<string, string> = {
    DISPONIBLE: "Disponible",
    APARTADO: "Apartado",
    VENDIDO: "Vendido",
    EN_TRANSITO: "En tránsito",
    PROXIMAMENTE: "Próximamente",
    INACTIVO: "Inactivo",
  };

  return labels[value] ?? value;
}

function splitList(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMileage(value?: number | null) {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const vehicleId = Number(id);

  if (Number.isNaN(vehicleId)) {
    notFound();
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      active: true,
      branch: {
        active: true,
      },
    },
    include: {
      brand: true,
      branch: true,
      images: {
        orderBy: {
          order: "asc",
        },
      },
      branchAvailabilities: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  const relatedVehicles = await prisma.vehicle.findMany({
    where: {
      id: {
        not: vehicle.id,
      },
      active: true,
      branch: {
        active: true,
      },
      OR: [
        {
          brandId: vehicle.brandId,
        },
        {
          category: vehicle.category,
        },
      ],
    },
    include: {
      brand: true,
      branch: true,
      images: {
        where: {
          type: "IMAGE",
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  const specs = splitList(vehicle.specs);
  const features = splitList(vehicle.features);

  const mainTitle = `${vehicle.brand.name} ${vehicle.name}`;
  const availableBranches =
    vehicle.branchAvailabilities.length > 0
      ? vehicle.branchAvailabilities
      : [
        {
          id: vehicle.branch.id,
          branchId: vehicle.branch.id,
          vehicleId: vehicle.id,
          createdAt: new Date(),
          branch: vehicle.branch,
        },
      ];

  const summaryItems = [
    {
      label: "Categoría",
      value: getCategoryLabel(vehicle.category),
      icon: Car,
    },
    {
      label: "Condición",
      value: getConditionLabel(vehicle.condition),
      icon: ShieldCheck,
    },
    {
      label: "Año",
      value: String(vehicle.year),
      icon: CalendarDays,
    },
    {
      label: "Kilometraje",
      value: `${formatMileage(vehicle.mileage)} km`,
      icon: Gauge,
    },
    {
      label: "Color",
      value: vehicle.color || "No especificado",
      icon: Palette,
    },
    {
      label: "Estado",
      value: getStatusLabel(vehicle.status),
      icon: BadgeCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container>
          <div className="py-6">
            <Link
              href="/inventario"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
            >
              <ArrowLeft size={17} />
              Volver al inventario
            </Link>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                    {getCategoryLabel(vehicle.category)}
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                    {getConditionLabel(vehicle.condition)}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
                    {getStatusLabel(vehicle.status)}
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                  {mainTitle}
                </h1>

                <p className="mt-3 text-base font-bold text-slate-500">
                  {vehicle.model} · {vehicle.version || "Versión estándar"} ·{" "}
                  {vehicle.year}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-[var(--rise-navy)] px-6 py-5 text-white shadow-xl shadow-slate-900/10">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                  Precio
                </p>
                <p className="mt-1 text-3xl font-black">
                  {formatCurrency(vehicle.price)}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid gap-8 xl:grid-cols-[1fr_390px]">
            <div className="space-y-8">
              <VehicleMediaGallery
                items={vehicle.images}
                fallbackImage={vehicle.mainImage}
                vehicleName={mainTitle}
              />

              <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Descripción
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Conoce esta unidad
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                  {vehicle.description ||
                    "Unidad disponible en Grupo Rise. Solicita información para conocer disponibilidad, precio, condiciones y opciones de financiamiento."}
                </p>
              </section>

              <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                      Información
                    </p>

                    <h2 className="mt-3 text-3xl font-black">
                      Datos principales
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {summaryItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl bg-slate-50 p-5"
                      >
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                          <Icon size={21} />
                        </div>

                        <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          {item.label}
                        </p>

                        <p className="mt-1 text-base font-black text-[var(--rise-navy)]">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {(specs.length > 0 || features.length > 0) && (
                <section className="grid gap-6 lg:grid-cols-2">
                  {specs.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        <Wrench size={16} />
                        Especificaciones
                      </p>

                      <div className="mt-6 grid gap-3">
                        {specs.map((spec) => (
                          <div
                            key={spec}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-[var(--rise-blue)]"
                            />
                            <span className="text-sm font-bold text-slate-600">
                              {spec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {features.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        <Tag size={16} />
                        Características
                      </p>

                      <div className="mt-6 grid gap-3">
                        {features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-emerald-600"
                            />
                            <span className="text-sm font-bold text-slate-600">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Disponibilidad
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Sucursales disponibles
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {availableBranches.map((item) => (
                    <div
                      key={`${item.branch.id}-${item.branch.name}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                    >
                      <div className="flex gap-3">
                        <MapPin
                          size={22}
                          className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                        />

                        <div>
                          <p className="font-black text-[var(--rise-navy)]">
                            {item.branch.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {item.branch.city}, {item.branch.state}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {item.branch.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {relatedVehicles.length > 0 && (
                <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        También te puede interesar
                      </p>

                      <h2 className="mt-3 text-3xl font-black">
                        Vehículos relacionados
                      </h2>
                    </div>

                    <Link
                      href="/inventario"
                      className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                    >
                      Ver inventario
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {relatedVehicles.map((related) => {
                      const relatedImage =
                        related.images[0]?.url || related.mainImage || "";

                      return (
                        <Link
                          key={related.id}
                          href={`/vehiculos/${related.id}`}
                          className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-900/10"
                        >
                          <div className="h-36 overflow-hidden bg-slate-200">
                            {relatedImage ? (
                              <img
                                src={relatedImage}
                                alt={related.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xs font-black text-slate-400">
                                Sin imagen
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <p className="text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                              {related.brand.name}
                            </p>

                            <h3 className="mt-2 line-clamp-2 text-sm font-black text-[var(--rise-navy)]">
                              {related.name}
                            </h3>

                            <p className="mt-2 text-sm font-black text-[var(--rise-blue)]">
                              {formatCurrency(related.price)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-xl shadow-slate-900/10">
                <div className="bg-[var(--rise-navy)] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                    Solicita información
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    {formatCurrency(vehicle.price)}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Un asesor puede ayudarte con cotización, disponibilidad o
                    prueba de manejo.
                  </p>
                </div>

                <div className="p-6">
                  <VehicleDetailActions
                    vehicleId={vehicle.id}
                    branchId={vehicle.branchId}
                    vehicleName={mainTitle}
                    whatsapp={vehicle.branch.whatsapp}
                  />

                  <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Sucursal principal
                    </p>

                    <p className="mt-2 text-sm font-black text-[var(--rise-navy)]">
                      {vehicle.branch.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {vehicle.branch.city}, {vehicle.branch.state}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-black text-emerald-700">
                      <CheckCircle2 size={18} />
                      Unidad visible y disponible para cotización
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}