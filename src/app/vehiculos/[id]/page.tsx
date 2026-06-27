import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Gauge,
  MapPin,
  ShieldCheck,
  Tags,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { VehicleMediaGallery } from "@/components/vehicles/VehicleMediaGallery";
import { VehicleDetailActions } from "@/components/vehicles/VehicleDetailActions";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

function getConditionLabel(condition: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition] ?? condition;
}

function formatMileage(value: number | null) {
  if (value === null || value === undefined) {
    return "Kilometraje por confirmar";
  }

  return `${new Intl.NumberFormat("es-MX").format(value)} km`;
}

function splitText(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBackHref(condition: VehicleCondition) {
  return condition === VehicleCondition.SEMINUEVO ? "/inventario" : "/catalogo";
}

function getBackLabel(condition: VehicleCondition) {
  return condition === VehicleCondition.SEMINUEVO
    ? "Volver a seminuevos"
    : "Volver al catálogo";
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const vehicleId = Number(id);

  if (!vehicleId) {
    notFound();
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      active: true,
      status: VehicleStatus.DISPONIBLE,
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
      status: VehicleStatus.DISPONIBLE,
      condition: vehicle.condition,
      brandId: vehicle.brandId,
      branch: {
        active: true,
      },
    },
    include: {
      brand: true,
      branch: true,
      images: {
        where: {
          type: VehicleMediaType.IMAGE,
        },
        orderBy: {
          order: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 3,
  });

  const title = `${vehicle.brand.name} ${vehicle.name}`;
  const isUsed = vehicle.condition === VehicleCondition.SEMINUEVO;
  const backHref = getBackHref(vehicle.condition);
  const backLabel = getBackLabel(vehicle.condition);

  const specs = splitText(vehicle.specs);
  const features = splitText(vehicle.features);

  const availableBranches = [
    vehicle.branch,
    ...vehicle.branchAvailabilities
      .map((item) => item.branch)
      .filter((branch) => branch.active && branch.id !== vehicle.branchId),
  ];

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-10 md:py-14">
        <Container>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            {backLabel}
          </Link>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6">
              <VehicleMediaGallery
                items={vehicle.images}
                fallbackImage={vehicle.mainImage}
                vehicleName={title}
              />

              <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                      {vehicle.brand.name}
                    </p>

                    <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                      {vehicle.name}
                    </h1>

                    <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                      {vehicle.year} · {getCategoryLabel(vehicle.category)} ·{" "}
                      {getConditionLabel(vehicle.condition)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                      isUsed
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {isUsed ? "Seminuevo disponible" : "Nuevo disponible"}
                  </span>
                </div>

                {vehicle.description && (
                  <p className="mt-6 text-sm leading-7 text-slate-600 md:text-base">
                    {vehicle.description}
                  </p>
                )}

                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Gauge className="text-[var(--rise-blue)]" size={23} />
                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Kilometraje
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {formatMileage(vehicle.mileage)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Tags className="text-[var(--rise-blue)]" size={23} />
                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Tipo
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {getCategoryLabel(vehicle.category)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <MapPin className="text-[var(--rise-blue)]" size={23} />
                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Ciudad
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {vehicle.branch.city}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Building2 className="text-[var(--rise-blue)]" size={23} />
                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Sucursal
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {vehicle.branch.name}
                    </p>
                  </div>
                </div>
              </section>

              {(features.length > 0 || specs.length > 0) && (
                <section className="grid gap-6 lg:grid-cols-2">
                  {features.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
                      <h2 className="text-2xl font-black">
                        Características principales
                      </h2>

                      <div className="mt-5 grid gap-3">
                        {features.map((feature) => (
                          <div
                            key={feature}
                            className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                          >
                            <CheckCircle2
                              className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                              size={18}
                            />
                            <p className="text-sm font-bold leading-6 text-slate-600">
                              {feature}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {specs.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
                      <h2 className="text-2xl font-black">
                        Especificaciones
                      </h2>

                      <div className="mt-5 grid gap-3">
                        {specs.map((spec) => (
                          <div
                            key={spec}
                            className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                          >
                            <ShieldCheck
                              className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                              size={18}
                            />
                            <p className="text-sm font-bold leading-6 text-slate-600">
                              {spec}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {availableBranches.length > 0 && (
                <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
                  <h2 className="text-2xl font-black">
                    Disponibilidad por sucursal
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Consulta la sucursal principal o puntos donde esta unidad
                    puede estar disponible.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {availableBranches.map((branch) => (
                      <div
                        key={branch.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <p className="font-black">{branch.name}</p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {branch.city}, {branch.state}
                        </p>

                        {branch.whatsapp && (
                          <a
                            href={`https://wa.me/${branch.whatsapp.replace(
                              /\D/g,
                              ""
                            )}`}
                            target="_blank"
                            className="mt-3 inline-flex text-sm font-black text-[var(--rise-blue)] hover:underline"
                          >
                            Contactar por WhatsApp
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-6">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                    isUsed
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {isUsed ? "Unidad seminueva" : "Unidad nueva"}
                </span>

                <p className="mt-5 text-sm font-black uppercase tracking-wider text-slate-400">
                  Precio
                </p>

                <p className="mt-1 text-4xl font-black text-[var(--rise-blue)]">
                  {formatCurrency(vehicle.price)}
                </p>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-[var(--rise-navy)]">
                    {isUsed
                      ? "Seminuevo listo para cotizar"
                      : "Nuevo disponible para información"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Solicita información y un asesor de Grupo Rise se pondrá en
                    contacto contigo.
                  </p>
                </div>

                <div className="mt-5">
                  <VehicleDetailActions
                    vehicleId={vehicle.id}
                    branchId={vehicle.branchId}
                    vehicleName={title}
                    whatsapp={vehicle.branch.whatsapp}
                  />
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <BadgeCheck size={18} className="text-[var(--rise-blue)]" />
                    Estado: Disponible
                  </div>

                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <MapPin size={18} className="text-[var(--rise-blue)]" />
                    {vehicle.branch.city}
                  </div>

                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Building2 size={18} className="text-[var(--rise-blue)]" />
                    {vehicle.branch.name}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {relatedVehicles.length > 0 && (
        <section className="pb-14 md:pb-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  También te puede interesar
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Más unidades {vehicle.brand.name}
                </h2>
              </div>

              <Link
                href={backHref}
                className="text-sm font-black text-[var(--rise-blue)] hover:underline"
              >
                Ver más
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {relatedVehicles.map((item) => {
                const image = item.images[0]?.url || item.mainImage || "";

                return (
                  <Link
                    key={item.id}
                    href={`/vehiculos/${item.id}`}
                    className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    <div className="h-44 overflow-hidden bg-slate-100">
                      {image ? (
                        <img
                          src={image}
                          alt={`${item.brand.name} ${item.name}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <Car size={40} />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                        {item.brand.name}
                      </p>

                      <h3 className="mt-2 text-xl font-black">{item.name}</h3>

                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {item.year} · {item.branch.city}
                      </p>

                      <p className="mt-4 text-xl font-black text-[var(--rise-blue)]">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      <Footer />
    </main>
  );
}