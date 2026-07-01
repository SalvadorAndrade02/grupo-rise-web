import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Gauge,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  VehicleCategory,
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

const categoryLabels: Record<VehicleCategory, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  TODOTERRENO: "Todo terreno",
};

const conditionLabels: Record<VehicleCondition, string> = {
  NUEVO: "Nuevo",
  SEMINUEVO: "Seminuevo",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugifyBrand(value: string) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getBrandSlug(brandName: string) {
  const customSlugs: Record<string, string> = {
    "Can-Am": "can-am",
    Polaris: "polaris",
    "Sea-Doo": "sea-doo",
    "Sea Doo": "sea-doo",
    SeaDoo: "sea-doo",
    Triumph: "triumph-motorcycles",
    "Triumph Motorcycles": "triumph-motorcycles",
    "Royal Enfield": "royal-enfield",
    Indian: "indian-motorcycle",
    "Indian Motorcycle": "indian-motorcycle",
    Zeekr: "zeekrlife",
    Zeekrlife: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return customSlugs[brandName] ?? slugifyBrand(brandName);
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

function getBackHref(condition: VehicleCondition, brandName: string) {
  if (condition === VehicleCondition.SEMINUEVO) {
    return "/inventario";
  }

  return `/catalogo/${getBrandSlug(brandName)}`;
}

function getBackLabel(condition: VehicleCondition, brandName: string) {
  return condition === VehicleCondition.SEMINUEVO
    ? "Volver a seminuevos"
    : `Volver a ${brandName}`;
}

function getWhatsAppHref(phone?: string | null, message?: string) {
  const phoneNumber = phone?.replace(/\D/g, "") ?? "";

  if (!phoneNumber) {
    return "";
  }

  const finalPhone = phoneNumber.length === 10 ? `52${phoneNumber}` : phoneNumber;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${finalPhone}${text}`;
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
      brand: {
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
      brand: {
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
  const backHref = getBackHref(vehicle.condition, vehicle.brand.name);
  const backLabel = getBackLabel(vehicle.condition, vehicle.brand.name);

  const specs = splitText(vehicle.specs);
  const features = splitText(vehicle.features);

  const orderedImages = [...vehicle.images].sort((a, b) => {
    if (vehicle.mainImage) {
      if (a.url === vehicle.mainImage) {
        return -1;
      }

      if (b.url === vehicle.mainImage) {
        return 1;
      }
    }

    return a.order - b.order;
  });

  const availableBranches = [
    vehicle.branch,
    ...vehicle.branchAvailabilities
      .map((item) => item.branch)
      .filter((branch) => branch.active && branch.id !== vehicle.branchId),
  ];

  const whatsappMessage = `Hola, me interesa recibir información de ${title} ${vehicle.year}.`;
  const branchWhatsappHref = getWhatsAppHref(
    vehicle.branch.whatsapp,
    whatsappMessage
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
        <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-12 text-white md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

          <Container>
            <div className="relative">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 transition hover:bg-white/15"
              >
                <ArrowLeft size={18} />
                {backLabel}
              </Link>

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
                    <Sparkles size={16} />
                    {isUsed ? "Unidad seminueva" : "Unidad nueva"}
                  </div>

                  <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
                    {title}
                  </h1>

                  <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100 md:text-lg">
                    {vehicle.description ||
                      "Unidad disponible en Grupo Rise. Solicita información y un asesor se pondrá en contacto contigo."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--rise-navy)]">
                      {vehicle.year}
                    </span>

                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-blue-100">
                      {categoryLabels[vehicle.category]}
                    </span>

                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-blue-100">
                      {conditionLabels[vehicle.condition]}
                    </span>

                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-blue-100">
                      {vehicle.branch.city}
                    </span>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-black uppercase tracking-wider text-blue-100">
                    Precio
                  </p>

                  <p className="mt-2 text-4xl font-black text-white">
                    {formatCurrency(vehicle.price)}
                  </p>

                  <p className="mt-2 text-sm font-bold text-blue-100">
                    {vehicle.branch.name}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-10 md:py-14">
          <Container>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="space-y-6">
                <VehicleMediaGallery
                  items={orderedImages}
                  fallbackImage={vehicle.mainImage}
                  vehicleName={title}
                />

                <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        {vehicle.brand.name}
                      </p>

                      <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                        Información de la unidad
                      </h2>

                      <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                        {vehicle.year} · {categoryLabels[vehicle.category]} ·{" "}
                        {conditionLabels[vehicle.condition]}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${isUsed
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
                        {categoryLabels[vehicle.category]}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <CalendarDays
                        className="text-[var(--rise-blue)]"
                        size={23}
                      />
                      <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                        Año
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {vehicle.year}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <Building2
                        className="text-[var(--rise-blue)]"
                        size={23}
                      />
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
                      {availableBranches.map((branch) => {
                        const whatsappHref = getWhatsAppHref(
                          branch.whatsapp,
                          whatsappMessage
                        );

                        return (
                          <div
                            key={branch.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                          >
                            <p className="font-black">{branch.name}</p>
                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {branch.city}, {branch.state}
                            </p>

                            {whatsappHref && (
                              <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex text-sm font-black text-[var(--rise-blue)] hover:underline"
                              >
                                Contactar por WhatsApp
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <aside className="xl:sticky xl:top-6 xl:self-start">
                <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-6">
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${isUsed
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
                      <BadgeCheck
                        size={18}
                        className="text-[var(--rise-blue)]"
                      />
                      Estado: Disponible
                    </div>

                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <MapPin size={18} className="text-[var(--rise-blue)]" />
                      {vehicle.branch.city}
                    </div>

                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <Building2
                        size={18}
                        className="text-[var(--rise-blue)]"
                      />
                      {vehicle.branch.name}
                    </div>
                  </div>

                  {branchWhatsappHref && (
                    <a
                      href={branchWhatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Contactar por WhatsApp
                    </a>
                  )}
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
                  const image = item.mainImage || item.images[0]?.url || "";

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
                            <ImageIcon size={40} />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                          {item.brand.name}
                        </p>

                        <h3 className="mt-2 text-xl font-black">
                          {item.name}
                        </h3>

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
      </main>

      <Footer />
    </>
  );
}