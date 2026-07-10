import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
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
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const categoryLabels: Record<VehicleCategory, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  TODOTERRENO: "Todoterreno",
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
    return "Por confirmar";
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

  const finalPhone =
    phoneNumber.length === 10 ? `52${phoneNumber}` : phoneNumber;

  const text = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function getAbsoluteUrl(path: string) {
  if (!path) {
    return `${getSiteUrl()}/brand/logo-rise.jpeg`;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function getSeoDescription(value: string) {
  return value.length > 155 ? `${value.slice(0, 152)}...` : value;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicleId = Number(id);

  if (!vehicleId) {
    return {
      title: "Vehículo no encontrado | Grupo Rise",
      robots: {
        index: false,
        follow: false,
      },
    };
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
        where: {
          type: VehicleMediaType.IMAGE,
        },
        orderBy: {
          order: "asc",
        },
        take: 1,
      },
    },
  });

  if (!vehicle) {
    return {
      title: "Vehículo no encontrado | Grupo Rise",
      description:
        "La unidad que buscas no está disponible actualmente en Grupo Rise.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${vehicle.brand.name} ${vehicle.name} ${vehicle.year} | Grupo Rise`;
  const price = formatCurrency(vehicle.price);

  const description = getSeoDescription(
    vehicle.description?.trim() ||
    `${vehicle.brand.name} ${vehicle.name} ${vehicle.year} disponible en ${vehicle.branch.name}. Precio ${price}. Solicita información en Grupo Rise.`
  );

  const image =
    vehicle.mainImage || vehicle.images[0]?.url || "/brand/logo-rise.jpeg";

  const absoluteImage = getAbsoluteUrl(image);
  const canonicalUrl = getAbsoluteUrl(`/vehiculos/${vehicle.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Grupo Rise",
      type: "website",
      locale: "es_MX",
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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

  const galleryItems = orderedImages.map((item) => ({
    id: item.id,
    url: item.url,
    alt: item.alt,
    type: item.type as "IMAGE" | "VIDEO",
  }));

  const availableBranches = [
    vehicle.branch,
    ...vehicle.branchAvailabilities
      .map((item) => item.branch)
      .filter((branch) => branch.active && branch.id !== vehicle.branchId),
  ];

  const whatsappMessage = `Hola, me interesa recibir información de ${title} ${vehicle.year}.`;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        {/* Encabezado compacto */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <Container>
            <div className="relative py-8 md:py-10">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-[#dfe7ec] transition hover:bg-white/15 active:scale-[0.98]"
              >
                <ArrowLeft size={16} />
                {backLabel}
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#dfe7ec]">
                  <Sparkles size={14} />
                  {isUsed ? "Unidad seminueva" : "Unidad nueva"}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white/80">
                  {vehicle.year}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white/80">
                  {categoryLabels[vehicle.category]}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white/80">
                  {vehicle.branch.city}
                </span>
              </div>
            </div>
          </Container>
        </section>

        {/* Galería + resumen */}
        <section className="py-8 md:py-10 lg:py-12">
          <Container>
            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
              <div className="space-y-6">
                <VehicleMediaGallery
                  items={galleryItems}
                  fallbackImage={vehicle.mainImage}
                  vehicleName={title}
                />

                <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-[#192a3a]" />

                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                          {vehicle.brand.name}
                        </p>
                      </div>

                      <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-0.045em] md:text-4xl lg:text-5xl">
                        {vehicle.name}
                      </h1>

                      <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                        {vehicle.model} · {vehicle.year} ·{" "}
                        {conditionLabels[vehicle.condition]}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${isUsed
                          ? "bg-amber-50 text-amber-700"
                          : "bg-[#e7edf1] text-[#192a3a]"
                        }`}
                    >
                      Disponible
                    </span>
                  </div>

                  {vehicle.description && (
                    <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                      {vehicle.description}
                    </p>
                  )}

                  <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoStat
                      icon={Gauge}
                      label="Kilometraje"
                      value={formatMileage(vehicle.mileage)}
                    />

                    <InfoStat
                      icon={Tags}
                      label="Categoría"
                      value={categoryLabels[vehicle.category]}
                    />

                    <InfoStat
                      icon={CalendarDays}
                      label="Año"
                      value={String(vehicle.year)}
                    />

                    <InfoStat
                      icon={Building2}
                      label="Sucursal"
                      value={vehicle.branch.name}
                    />
                  </div>
                </section>

                {(features.length > 0 || specs.length > 0) && (
                  <section className="grid gap-5 lg:grid-cols-2">
                    {features.length > 0 && (
                      <DetailList
                        title="Características principales"
                        items={features}
                        icon="check"
                      />
                    )}

                    {specs.length > 0 && (
                      <DetailList
                        title="Especificaciones"
                        items={specs}
                        icon="shield"
                      />
                    )}
                  </section>
                )}

                {availableBranches.length > 0 && (
                  <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-7">
                    <div className="flex items-center gap-3">
                      <span className="h-px w-8 bg-[#192a3a]" />

                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                        Disponibilidad
                      </p>
                    </div>

                    <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                      Sucursales disponibles
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      Consulta la sucursal principal o puntos donde esta unidad
                      puede estar disponible.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {availableBranches.map((branch) => {
                        const whatsappHref = getWhatsAppHref(
                          branch.whatsapp,
                          whatsappMessage
                        );

                        return (
                          <article
                            key={branch.id}
                            className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/35 active:border-[#192a3a]/35"
                          >
                            <div className="flex items-start gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                                <Building2 size={18} />
                              </span>

                              <div>
                                <p className="font-black text-[#0a0f14]">
                                  {branch.name}
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-500">
                                  {branch.city}, {branch.state}
                                </p>
                              </div>
                            </div>

                            {whatsappHref && (
                              <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#192a3a] transition hover:underline active:opacity-75"
                              >
                                Contactar por WhatsApp
                                <ArrowRight size={15} />
                              </a>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              {/* Resumen lateral */}
              <aside className="xl:sticky xl:top-[120px] xl:self-start">
                <div className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.1)] md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#192a3a]">
                    {vehicle.brand.name}
                  </p>

                  <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14]">
                    {vehicle.name}
                  </h2>

                  <div className="mt-5 border-y border-slate-100 py-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Precio
                    </p>

                    <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-[#192a3a]">
                      {formatCurrency(vehicle.price)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl bg-[#f8fafb] p-4">
                    <SummaryLine
                      icon={BadgeCheck}
                      label="Estado"
                      value="Disponible"
                    />

                    <SummaryLine
                      icon={MapPin}
                      label="Ubicación"
                      value={vehicle.branch.city}
                    />

                    <SummaryLine
                      icon={Building2}
                      label="Agencia"
                      value={vehicle.branch.name}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#e7edf1] p-4">
                    <p className="text-sm font-black text-[#192a3a]">
                      {isUsed
                        ? "Seminuevo listo para cotizar"
                        : "Nuevo disponible para información"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
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
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {relatedVehicles.length > 0 && (
          <section className="pb-14 md:pb-20">
            <Container>
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[#192a3a]" />

                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                      También te puede interesar
                    </p>
                  </div>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                    Más unidades {vehicle.brand.name}
                  </h2>
                </div>

                <Link
                  href={backHref}
                  className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[#0a0f14]"
                >
                  Ver más

                  <span className="grid h-9 w-9 place-items-center rounded-full border border-black/15 bg-white transition group-hover:border-[#192a3a] group-hover:bg-[#192a3a] group-hover:text-white group-active:border-[#192a3a] group-active:bg-[#192a3a] group-active:text-white">
                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </span>
                </Link>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {relatedVehicles.map((item) => (
                  <RelatedVehicleCard key={item.id} vehicle={item} />
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fafb] p-4">
      <Icon className="text-[#192a3a]" size={22} />

      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={18} className="shrink-0 text-[#192a3a]" />

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          {label}
        </p>

        <p className="font-black text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function DetailList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "check" | "shield";
}) {
  const Icon = icon === "check" ? CheckCircle2 : ShieldCheck;

  return (
    <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] md:p-7">
      <h2 className="text-2xl font-black tracking-[-0.035em]">{title}</h2>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-3 rounded-2xl bg-[#f8fafb] p-4"
          >
            <Icon className="mt-0.5 shrink-0 text-[#192a3a]" size={18} />

            <p className="text-sm font-bold leading-6 text-slate-600">
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelatedVehicleCard({
  vehicle,
}: {
  vehicle: {
    id: number;
    name: string;
    price: number;
    mainImage: string | null;
    brand: {
      name: string;
    };
    images: {
      url: string;
    }[];
  };
}) {
  const image = vehicle.mainImage || vehicle.images[0]?.url || "";

  return (
    <Link
      href={`/vehiculos/${vehicle.id}`}
      className="group block overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/50 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] active:border-[#192a3a]/50"
    >
      <div className="relative h-[230px] overflow-hidden bg-[#e8ecef]">
        {image ? (
          <img
            src={image}
            alt={`${vehicle.brand.name} ${vehicle.name}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <ImageIcon size={40} />
          </div>
        )}

        <div className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#0a0f14] shadow-lg transition duration-300 group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-active:translate-x-0.5"
          />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
          {vehicle.brand.name}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[56px] text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14]">
          {vehicle.name}
        </h3>

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