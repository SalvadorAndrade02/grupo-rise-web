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
  NAUTICA: "Náutica"
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

function getBackHref(
  condition: VehicleCondition,
  brandName: string
) {
  if (condition === VehicleCondition.SEMINUEVO) {
    return "/certificados-rise";
  }

  return `/catalogo/${getBrandSlug(brandName)}`;
}

function getBackLabel(
  condition: VehicleCondition,
  brandName: string
) {
  return condition === VehicleCondition.SEMINUEVO
    ? "Volver"
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

      <main className="public-home">
        {/* Navegación y contexto */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%)]" />

          <Container>
            <div className="relative py-10 md:py-12">
              <Link
                href={backHref}
                className="inline-flex items-center gap-3 border-b border-white/20 pb-2 text-xs font-black uppercase tracking-[0.18em] !text-white/60 transition hover:border-white hover:!text-white"
              >
                <ArrowLeft size={16} />
                {backLabel}
              </Link>

              <div className="mt-9 flex items-center gap-4">
                <span className="h-px w-10 bg-white" />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                  {vehicle.brand.name}
                </p>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-end">
                <div>
                  <p className="text-sm font-bold text-white">
                    {vehicle.model}
                  </p>

                  <h1 className="mt-2 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-6xl">
                    {vehicle.name}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
                  <HeaderStat
                    label="Condición"
                    value={conditionLabels[vehicle.condition]}
                  />

                  <HeaderStat
                    label="Año"
                    value={String(vehicle.year)}
                  />

                  <HeaderStat
                    label="Categoría"
                    value={categoryLabels[vehicle.category]}
                  />

                  <HeaderStat
                    label="Ubicación"
                    value={vehicle.branch.city}
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Galería + resumen */}
        <section className="border-b border-[var(--home-border)] py-10 md:py-14 lg:py-16">
          <Container>
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
              <div className="space-y-6">
                <VehicleMediaGallery
                  items={galleryItems}
                  fallbackImage={vehicle.mainImage}
                  vehicleName={title}
                />

                <section className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="h-px w-10 bg-[var(--public-accent)]" />

                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                          {vehicle.brand.name}
                        </p>
                      </div>

                      <h2 className="mt-4 max-w-4xl text-3xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-5xl">
                        {vehicle.name}
                      </h2>

                      <p className="mt-4 text-sm font-bold text-[var(--public-muted)] md:text-base">
                        {vehicle.model} · {vehicle.year} ·{" "}
                        {conditionLabels[vehicle.condition]}
                      </p>
                    </div>

                    <span className="w-fit border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[var(--public-ink)]">
                      Disponible
                    </span>
                  </div>

                  {vehicle.description && (
                    <p className="mt-7 max-w-4xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                      {vehicle.description}
                    </p>
                  )}

                  <div className="mt-8 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2 lg:grid-cols-4">
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

                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
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
                            className="border border-[var(--home-border)] bg-[var(--home-surface-strong)] p-5 transition hover:border-[var(--home-border-strong)] hover:bg-[var(--home-card-hover)]"                          >
                            <div className="flex items-start gap-3">
                              <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-ink)]">
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
                                className="mt-5 inline-flex items-center gap-2 border-b border-[var(--home-border-strong)] pb-1 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-accent)] hover:text-[var(--public-accent)]"                              >
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
                <div className="border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_18px_45px_rgba(18,24,28,0.09)]">
                  <div className="border-b border-[var(--home-border)] p-6">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                      {vehicle.brand.name}
                    </p>

                    <h2 className="mt-3 text-3xl font-black leading-[0.98] tracking-[-0.04em] text-[var(--public-ink)]">
                      {vehicle.name}
                    </h2>
                  </div>

                  <div className="border-b border-[var(--home-border)] bg-[var(--home-surface-strong)] p-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                      Precio
                    </p>

                    <p className="mt-2 text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)]">
                      {formatCurrency(vehicle.price)}
                    </p>
                  </div>

                  <div className="grid gap-px border-b border-[var(--home-border)] bg-[var(--home-border)]">
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

                  <div className="border-b border-[var(--home-border)] p-6">
                    <p className="text-sm font-black text-[var(--public-ink)]">
                      {isUsed
                        ? "Unidad disponible para información"
                        : "Vehículo nuevo disponible"}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                      Solicita información y un asesor de Grupo RISE se pondrá en
                      contacto contigo.
                    </p>
                  </div>

                  <div className="p-6">
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
                  className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[var(--public-ink)]"
                >
                  Ver más

                  <span className="grid h-10 w-10 place-items-center border border-[var(--home-border-strong)] transition group-hover:border-[var(--public-accent)] group-hover:bg-[var(--public-accent)] group-hover:!text-white">
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
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
    <div className="min-h-[150px] bg-[var(--home-surface-strong)] p-5">
      <Icon
        className="text-[var(--public-accent)]"
        size={22}
      />

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-[var(--public-muted)]">
        {label}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-[var(--public-ink)]">
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
    <div className="flex min-h-[82px] items-center gap-4 bg-[var(--home-card)] px-6 py-4">
      <Icon
        size={19}
        className="shrink-0 text-[var(--public-accent)]"
      />

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--public-muted)]">
          {label}
        </p>

        <p className="mt-1 font-black text-[var(--public-ink)]">
          {value}
        </p>
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
  const Icon =
    icon === "check" ? CheckCircle2 : ShieldCheck;

  return (
    <section className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_10px_28px_rgba(18,24,28,0.04)] md:p-8">
      <div className="flex items-center gap-4">
        <span className="h-px w-10 bg-[var(--public-accent)]" />

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--public-muted)]">
          Información
        </p>
      </div>

      <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)] md:text-3xl">
        {title}
      </h2>

      <div className="mt-6 border-t border-[var(--home-border)]">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-4 border-b border-[var(--home-border)] py-4"
          >
            <Icon
              className="mt-0.5 shrink-0 text-[var(--public-accent)]"
              size={18}
            />

            <p className="text-sm font-bold leading-6 text-[var(--public-muted)]">
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
  const image =
    vehicle.mainImage || vehicle.images[0]?.url || "";

  return (
    <Link
      href={`/vehiculos/${vehicle.id}`}
      className="group relative block overflow-hidden border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[var(--home-border-strong)] hover:shadow-[var(--home-shadow)]"
    >
      <div className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative h-[230px] overflow-hidden bg-[var(--home-surface-alt)]">
        {image ? (
          <img
            src={image}
            alt={`${vehicle.brand.name} ${vehicle.name}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        ) : (
          <div className="grid h-full place-items-center text-[var(--public-muted)]">
            <ImageIcon size={40} />
          </div>
        )}

        <span className="absolute bottom-0 right-0 grid h-12 w-12 place-items-center bg-[var(--public-header)] !text-white transition group-hover:bg-[var(--public-accent)]">
          <ArrowRight
            size={18}
            className="text-white transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
          {vehicle.brand.name}
        </p>

        <h3 className="mt-3 line-clamp-2 min-h-[56px] text-2xl font-black leading-tight tracking-[-0.035em] text-[var(--public-ink)]">
          {vehicle.name}
        </h3>

        <div className="mt-5 border-t border-[var(--home-border)] pt-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
            Precio
          </p>

          <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
            {formatCurrency(vehicle.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function HeaderStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-[88px] bg-[var(--public-header)] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-white/35">
        {label}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-white">
        {value}
      </p>
    </div>
  );
}