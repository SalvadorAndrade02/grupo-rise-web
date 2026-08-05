import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Clock,
    ExternalLink,
    Mail,
    MapPin,
    Share2,
    MessageCircle,
    Phone,
    ShieldCheck,
} from "lucide-react";
import {
    VehicleCondition,
    VehicleStatus,
} from "@prisma/client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
} from "react-icons/fa";

export const dynamic = "force-dynamic";

type BranchDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};

function cleanPhone(value?: string | null) {
    return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(
    phone?: string | null,
    message?: string
) {
    const phoneNumber = cleanPhone(phone);

    if (!phoneNumber) {
        return "";
    }

    const finalPhone = phoneNumber.startsWith("52")
        ? phoneNumber
        : `52${phoneNumber}`;

    const text = message
        ? `?text=${encodeURIComponent(message)}`
        : "";

    return `https://wa.me/${finalPhone}${text}`;
}

function splitServices(value?: string | null) {
    return String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getBranchLocationText(branch: {
    address: string;
    city: string;
    state: string;
}) {
    return [
        branch.address,
        branch.city,
        branch.state,
    ]
        .filter(Boolean)
        .join(", ");
}

function getMapEmbedUrl(branch: {
    address: string;
    city: string;
    state: string;
    googleMapsUrl?: string | null;
}) {
    const googleMapsUrl =
        branch.googleMapsUrl?.trim();

    if (googleMapsUrl?.includes("/embed")) {
        return googleMapsUrl;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(
        getBranchLocationText(branch)
    )}&output=embed`;
}

function getMapExternalUrl(branch: {
    address: string;
    city: string;
    state: string;
    googleMapsUrl?: string | null;
}) {
    const googleMapsUrl =
        branch.googleMapsUrl?.trim();

    if (
        googleMapsUrl &&
        !googleMapsUrl.includes("/embed")
    ) {
        return googleMapsUrl;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        getBranchLocationText(branch)
    )}`;
}

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
        "Triumph Motorcycles":
            "triumph-motorcycles",

        "Royal Enfield": "royal-enfield",

        Indian: "indian-motorcycle",
        "Indian Motorcycle":
            "indian-motorcycle",

        Zeekr: "zeekrlife",
        Zeekrlife: "zeekrlife",

        "Lynk & Co": "lynk-co",
    };

    return (
        customSlugs[brandName] ??
        slugifyBrand(brandName)
    );
}

export default async function BranchDetailPage({
    params,
}: BranchDetailPageProps) {
    const { id } = await params;
    const branchId = Number(id);

    if (!branchId) {
        notFound();
    }

    const branch = await prisma.branch.findFirst({
        where: {
            id: branchId,
            active: true,
        },

        include: {
            /*
             * Vehículos cuya sucursal principal es esta.
             * Solo necesitamos su marca.
             */
            vehicles: {
                where: {
                    active: true,
                    status: VehicleStatus.DISPONIBLE,
                    condition: VehicleCondition.NUEVO,

                    brand: {
                        active: true,
                    },
                },

                select: {
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },

            /*
             * Vehículos vinculados como disponibilidad
             * adicional mediante VehicleBranch.
             */
            vehicleAvailabilities: {
                where: {
                    vehicle: {
                        active: true,
                        status: VehicleStatus.DISPONIBLE,
                        condition: VehicleCondition.NUEVO,

                        brand: {
                            active: true,
                        },
                    },
                },

                select: {
                    vehicle: {
                        select: {
                            brand: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!branch) {
        notFound();
    }

    const services = splitServices(
        branch.services
    );

    const mapEmbedUrl =
        getMapEmbedUrl(branch);

    const mapExternalUrl =
        getMapExternalUrl(branch);

    const whatsappMessage =
        `Hola, me gustaría recibir información de ${branch.name}.`;

    const whatsappHref =
        getWhatsAppHref(
            branch.whatsapp,
            whatsappMessage
        );

    const phone = cleanPhone(branch.phone);

    const socialLinks = [
        {
            label: "Facebook",
            href: branch.facebookUrl,
            Icon: FaFacebookF,
        },
        {
            label: "Instagram",
            href: branch.instagramUrl,
            Icon: FaInstagram,
        },
        {
            label: "LinkedIn",
            href: branch.linkedinUrl,
            Icon: FaLinkedinIn,
        },
    ].filter(
        (social) => Boolean(social.href)
    );

    /*
     * Combina las marcas de la sucursal principal
     * y de las disponibilidades adicionales.
     * Map evita mostrar una marca repetida.
     */
    const branchBrands = Array.from(
        new Map(
            [
                ...branch.vehicles.map(
                    (vehicle) => vehicle.brand
                ),

                ...branch.vehicleAvailabilities.map(
                    (availability) =>
                        availability.vehicle.brand
                ),
            ].map((brand) => [
                brand.id,
                brand,
            ])
        ).values()
    ).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return (
        <>
            <Header />

            <main className="public-home pb-24 lg:pb-0">
                {/* Portada de la agencia */}
                <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
                    <div className="absolute inset-0">
                        {branch.coverImageUrl ? (
                            <img
                                src={branch.coverImageUrl}
                                alt={`Fachada de ${branch.name}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="grid h-full place-items-center bg-[var(--public-header)]">
                                <Building2
                                    size={110}
                                    strokeWidth={1}
                                    className="text-white/10"
                                />
                            </div>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f14]/95 via-[#0a0f14]/80 to-[#0a0f14]/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-transparent to-[#0a0f14]/25" />

                    <div className="public-container relative flex min-h-[500px] items-end py-12 md:min-h-[580px] md:py-16">
                        <div className="w-full">
                            <Link
                                href="/sucursales"
                                className="inline-flex items-center gap-3 border-b border-white/25 pb-2 text-xs font-black uppercase tracking-[0.17em] !text-white/65 transition hover:border-white hover:!text-white"
                            >
                                <ArrowLeft size={16} />
                                Volver a sucursales
                            </Link>

                            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_190px] lg:items-end">
                                <div className="max-w-5xl">
                                    <div className="flex items-center gap-4">
                                        <span className="h-px w-10 bg-white" />

                                        <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                                            Agencia Grupo RISE
                                        </p>
                                    </div>

                                    <h1 className="mt-6 text-4xl font-black leading-[0.94] tracking-[-0.05em] text-white md:text-6xl xl:text-7xl">
                                        {branch.name}
                                    </h1>

                                    <p className="mt-7 flex items-start gap-3 text-base font-bold text-white/65">
                                        <MapPin
                                            size={20}
                                            className="mt-0.5 shrink-0 text-[var(--public-accent)]"
                                        />

                                        {branch.city}, {branch.state}
                                    </p>
                                </div>

                                {branch.logoUrl && (
                                    <div className="flex h-[130px] w-full max-w-[190px] items-center justify-center border border-white/20 bg-[#eef0ee] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
                                        <img
                                            src={branch.logoUrl}
                                            alt={`Logo ${branch.name}`}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Información y mapa */}
                <section className="border-b border-[var(--home-border)] bg-[var(--home-surface)]">
                    <div className="public-container py-14 md:py-20">
                        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
                            <div className="space-y-8">
                                {/* Datos de la agencia */}
                                <section className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8">
                                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                                        <div>
                                            <div className="flex items-center gap-4">
                                                <span className="h-px w-10 bg-[var(--public-accent)]" />

                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                                                    Información
                                                </p>
                                            </div>

                                            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                                                Datos de la agencia
                                            </h2>

                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                                                Consulta la dirección, medios de
                                                contacto y horarios disponibles.
                                            </p>
                                        </div>

                                        <span className="grid h-14 w-14 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
                                            <Building2 size={24} />
                                        </span>
                                    </div>

                                    <div className="mt-8 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] md:grid-cols-3">
                                        <InfoBox
                                            icon={<MapPin size={20} />}
                                            title="Dirección"
                                            value={branch.address}
                                            description={`${branch.city}, ${branch.state}`}
                                        />

                                        {branch.phone && (
                                            <InfoBox
                                                icon={<Phone size={20} />}
                                                title="Teléfono"
                                                value={branch.phone}
                                                href={
                                                    phone
                                                        ? `tel:${phone}`
                                                        : undefined
                                                }
                                            />
                                        )}

                                        {branch.whatsapp &&
                                            whatsappHref && (
                                                <InfoBox
                                                    icon={
                                                        <MessageCircle size={20} />
                                                    }
                                                    title="WhatsApp"
                                                    value={branch.whatsapp}
                                                    href={whatsappHref}
                                                    external
                                                />
                                            )}

                                        {branch.email && (
                                            <InfoBox
                                                icon={<Mail size={20} />}
                                                title="Correo electrónico"
                                                value={branch.email}
                                                href={`mailto:${branch.email}`}
                                            />
                                        )}

                                        {branch.schedule && (
                                            <InfoBox
                                                icon={<Clock size={20} />}
                                                title="Horario"
                                                value={branch.schedule}
                                            />
                                        )}
                                    </div>

                                    {services.length > 0 && (
                                        <div className="mt-9 border-t border-[var(--home-border)] pt-8">
                                            <div className="flex items-center gap-4">
                                                <span className="h-px w-10 bg-[var(--public-accent)]" />

                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--public-muted)]">
                                                    Atención
                                                </p>
                                            </div>

                                            <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                                                Servicios disponibles
                                            </h3>

                                            <div className="mt-6 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2">
                                                {services.map((service) => (
                                                    <div
                                                        key={service}
                                                        className="flex min-h-[70px] items-center gap-3 bg-[var(--home-surface-strong)] px-5 py-4"
                                                    >
                                                        <ShieldCheck
                                                            size={18}
                                                            className="shrink-0 text-[var(--public-accent)]"
                                                        />

                                                        <p className="text-sm font-black text-[var(--public-ink)]">
                                                            {service}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {socialLinks.length > 0 && (
                                                <div className="mt-8 border-t border-[var(--home-border)] pt-8">
                                                    <div className="flex items-center gap-4">
                                                        <span className="grid h-11 w-11 place-items-center bg-[var(--public-header)] text-white">
                                                            <Share2 size={19} />
                                                        </span>

                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                                                                Canales oficiales
                                                            </p>

                                                            <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--public-ink)]">
                                                                Sigue a esta sucursal
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 flex flex-wrap gap-3">
                                                        {socialLinks.map(
                                                            ({
                                                                label,
                                                                href,
                                                                Icon,
                                                            }) => (
                                                                <a
                                                                    key={label}
                                                                    href={href!}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    aria-label={`${label} de ${branch.name}`}
                                                                    className="inline-flex h-12 items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-5 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                                                                >
                                                                    <Icon size={18} />
                                                                    {label}
                                                                </a>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-8 flex flex-col gap-3 border-t border-[var(--home-border)] pt-7 sm:flex-row sm:flex-wrap">
                                        {whatsappHref && (
                                            <a
                                                href={whatsappHref}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-12 items-center justify-center gap-3 bg-emerald-600 px-6 text-sm font-black !text-white transition hover:bg-emerald-700"
                                            >
                                                <MessageCircle size={18} />
                                                Contactar por WhatsApp
                                            </a>
                                        )}

                                        <a
                                            href={mapExternalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-12 items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-6 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                                        >
                                            <MapPin size={18} />
                                            Abrir ubicación
                                        </a>

                                        <Link
                                            href="/servicios"
                                            className="group inline-flex h-12 items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-6 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:!text-white"
                                        >
                                            Solicitar servicio

                                            <ArrowRight
                                                size={17}
                                                className="transition-transform group-hover:translate-x-0.5"
                                            />
                                        </Link>
                                    </div>
                                </section>

                                {/* Catálogos por marca */}
                                <section
                                    id="marcas-agencia"
                                    className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="h-px w-10 bg-[var(--public-accent)]" />

                                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                                            Catálogos relacionados
                                        </p>
                                    </div>

                                    <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                                        Marcas disponibles
                                    </h2>

                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                                        Consulta cada marca desde su catálogo
                                        independiente. Los vehículos no se mezclan
                                        entre diferentes marcas.
                                    </p>

                                    {branchBrands.length > 0 ? (
                                        <div className="mt-8 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2">
                                            {branchBrands.map((brand) => (
                                                <Link
                                                    key={brand.id}
                                                    href={`/catalogo/${getBrandSlug(
                                                        brand.name
                                                    )}`}
                                                    className="group flex min-h-[130px] items-center justify-between gap-6 bg-[var(--home-surface-strong)] p-6 transition hover:bg-[var(--home-card-hover)]"
                                                >
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                                                            Catálogo de marca
                                                        </p>

                                                        <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                                                            {brand.name}
                                                        </h3>
                                                    </div>

                                                    <span className="grid h-12 w-12 shrink-0 place-items-center border border-[var(--home-border-strong)] text-[var(--public-ink)] transition group-hover:border-[var(--public-accent)] group-hover:bg-[var(--public-accent)] group-hover:!text-white">
                                                        <ArrowRight
                                                            size={18}
                                                            className="transition-transform group-hover:translate-x-0.5"
                                                        />
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-8 border border-dashed border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] p-8">
                                            <p className="text-xl font-black text-[var(--public-ink)]">
                                                Catálogos en preparación
                                            </p>

                                            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--public-muted)]">
                                                Esta agencia todavía no tiene marcas
                                                relacionadas mediante unidades nuevas
                                                publicadas.
                                            </p>

                                            <Link
                                                href="/catalogo"
                                                className="mt-6 inline-flex h-11 items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                                            >
                                                Consultar marcas
                                                <ArrowRight size={17} />
                                            </Link>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Mapa */}
                            <aside className="xl:sticky xl:top-[120px] xl:self-start">
                                <div className="overflow-hidden border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_18px_45px_rgba(18,24,28,0.09)]">
                                    <div className="h-[350px] bg-[var(--home-surface-alt)]">
                                        <iframe
                                            src={mapEmbedUrl}
                                            title={`Mapa de ${branch.name}`}
                                            className="h-full w-full"
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>

                                    <div className="border-t border-[var(--home-border)] p-6">
                                        <div className="flex items-center gap-4">
                                            <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
                                                <MapPin size={19} />
                                            </span>

                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                                                    Ubicación
                                                </p>

                                                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                                                    Cómo llegar
                                                </h2>
                                            </div>
                                        </div>

                                        <p className="mt-5 text-sm leading-7 text-[var(--public-muted)]">
                                            {getBranchLocationText(branch)}
                                        </p>

                                        <a
                                            href={mapExternalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 bg-[var(--public-header)] px-5 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                                        >
                                            Abrir en Google Maps
                                            <ExternalLink size={17} />
                                        </a>

                                        {branchBrands.length > 0 && (
                                            <a
                                                href="#marcas-agencia"
                                                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-5 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                                            >
                                                Ver marcas
                                                <ArrowRight size={17} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                {/* Barra fija móvil */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--home-border)] bg-[var(--home-card)]/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(18,24,28,0.12)] backdrop-blur-md lg:hidden">
                    <div
                        className={`mx-auto grid max-w-xl gap-2 ${whatsappHref
                            ? "grid-cols-2"
                            : "grid-cols-1"
                            }`}
                    >
                        {whatsappHref && (
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-12 items-center justify-center gap-2 bg-emerald-600 px-4 text-xs font-black !text-white transition active:bg-emerald-700"
                            >
                                <MessageCircle size={17} />
                                WhatsApp
                            </a>
                        )}

                        <a
                            href={mapExternalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-12 items-center justify-center gap-2 bg-[var(--public-header)] px-4 text-xs font-black !text-white transition active:bg-[var(--public-accent-dark)]"
                        >
                            <MapPin size={17} />
                            Cómo llegar
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}

function InfoBox({
    icon,
    title,
    value,
    description,
    href,
    external = false,
}: {
    icon: ReactNode;
    title: string;
    value: string;
    description?: string;
    href?: string;
    external?: boolean;
}) {
    const content = (
        <div className="h-full min-h-[130px] bg-[var(--home-surface-strong)] p-5 transition hover:bg-[var(--home-card-hover)]">
            <div className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
                    {icon}
                </span>

                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--public-muted)]">
                        {title}
                    </p>

                    <p className="mt-2 break-words text-sm font-black leading-6 text-[var(--public-ink)]">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-sm leading-6 text-[var(--public-muted)]">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    if (!href) {
        return content;
    }

    return (
        <a
            href={href}
            target={
                external ? "_blank" : undefined
            }
            rel={
                external ? "noreferrer" : undefined
            }
            className="block h-full"
        >
            {content}
        </a>
    );
}