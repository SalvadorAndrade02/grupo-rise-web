import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    Car,
    Clock,
    ExternalLink,
    Gauge,
    ImageIcon,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    ShieldCheck,
    Sparkles,
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
    if (branch.googleMapsUrl?.trim()) {
        return branch.googleMapsUrl;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        getBranchLocationText(branch)
    )}`;
}

function getConditionLabel(
    condition: VehicleCondition
) {
    return condition === VehicleCondition.NUEVO
        ? "Nuevo"
        : "Seminuevo";
}

function formatMileage(value: number | null) {
    if (value === null || value === undefined) {
        return "Km por confirmar";
    }

    return `${new Intl.NumberFormat("es-MX").format(
        value
    )} km`;
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
            vehicles: {
                where: {
                    active: true,
                    status: VehicleStatus.DISPONIBLE,

                    brand: {
                        active: true,
                    },
                },

                include: {
                    brand: true,

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

                take: 9,
            },
        },
    });

    if (!branch) {
        notFound();
    }

    const services = splitServices(branch.services);
    const mapEmbedUrl = getMapEmbedUrl(branch);
    const mapExternalUrl = getMapExternalUrl(branch);

    const whatsappMessage =
        `Hola, me gustaría recibir información de ${branch.name}.`;

    const whatsappHref = getWhatsAppHref(
        branch.whatsapp,
        whatsappMessage
    );

    const phone = cleanPhone(branch.phone);

    const newVehicles = branch.vehicles.filter(
        (vehicle) =>
            vehicle.condition === VehicleCondition.NUEVO
    );

    const usedVehicles = branch.vehicles.filter(
        (vehicle) =>
            vehicle.condition === VehicleCondition.SEMINUEVO
    );

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#f4f6f7] pb-24 text-[#0a0f14] lg:pb-0">
                {/* Portada */}
                <section className="relative overflow-hidden bg-[#192a3a] text-white">
                    <div className="relative h-[390px] md:h-[470px]">
                        {branch.coverImageUrl ? (
                            <img
                                src={branch.coverImageUrl}
                                alt={`Fachada de ${branch.name}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="grid h-full place-items-center bg-[#192a3a]">
                                <Building2
                                    size={92}
                                    strokeWidth={1.1}
                                    className="text-white/15"
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-[#101c27]/95 via-[#192a3a]/65 to-[#192a3a]/15" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101c27] via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0">
                            <Container>
                                <div className="pb-8 md:pb-10">
                                    <Link
                                        href="/sucursales"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-black text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98]"
                                    >
                                        <ArrowLeft size={16} />
                                        Volver a sucursales
                                    </Link>

                                    <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                                        <div className="max-w-4xl">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.23em] text-[#dfe7ec] backdrop-blur-sm">
                                                <Sparkles size={14} />
                                                Agencia Grupo Rise
                                            </div>

                                            <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                                                {branch.name}
                                            </h1>

                                            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-white/75 md:text-base">
                                                <MapPin
                                                    size={18}
                                                    className="shrink-0"
                                                />

                                                {branch.city}, {branch.state}
                                            </p>
                                        </div>

                                        {branch.logoUrl && (
                                            <div className="flex h-20 w-28 items-center justify-center rounded-2xl border border-white/70 bg-white p-3 shadow-xl md:h-24 md:w-32">
                                                <img
                                                    src={branch.logoUrl}
                                                    alt={`Logo ${branch.name}`}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Container>
                        </div>
                    </div>
                </section>

                {/* Contenido */}
                <section className="py-8 md:py-10 lg:py-12">
                    <Container>
                        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
                            <div className="space-y-7">
                                {/* Información */}
                                <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] md:p-7">
                                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="h-px w-8 bg-[#192a3a]" />

                                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                                                    Información
                                                </p>
                                            </div>

                                            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                                                Datos de la agencia
                                            </h2>

                                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                                                Consulta los medios de contacto,
                                                dirección y horarios disponibles.
                                            </p>
                                        </div>

                                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                                            <Building2 size={22} />
                                        </span>
                                    </div>

                                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                                        <InfoBox
                                            icon={<MapPin size={19} />}
                                            title="Dirección"
                                            value={branch.address}
                                            description={`${branch.city}, ${branch.state}`}
                                        />

                                        {branch.phone && (
                                            <InfoBox
                                                icon={<Phone size={19} />}
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
                                                        <MessageCircle size={19} />
                                                    }
                                                    title="WhatsApp"
                                                    value={branch.whatsapp}
                                                    href={whatsappHref}
                                                    external
                                                />
                                            )}

                                        {branch.email && (
                                            <InfoBox
                                                icon={<Mail size={19} />}
                                                title="Correo electrónico"
                                                value={branch.email}
                                                href={`mailto:${branch.email}`}
                                            />
                                        )}

                                        {branch.schedule && (
                                            <InfoBox
                                                icon={<Clock size={19} />}
                                                title="Horario"
                                                value={branch.schedule}
                                            />
                                        )}

                                        <InfoBox
                                            icon={<Car size={19} />}
                                            title="Inventario"
                                            value={`${branch.vehicles.length} unidades`}
                                            description={`${newVehicles.length} nuevas · ${usedVehicles.length} seminuevas`}
                                        />
                                    </div>

                                    {services.length > 0 && (
                                        <div className="mt-8 border-t border-slate-100 pt-7">
                                            <h3 className="text-xl font-black tracking-[-0.025em]">
                                                Servicios disponibles
                                            </h3>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {services.map((service) => (
                                                    <span
                                                        key={service}
                                                        className="inline-flex items-center gap-2 rounded-full bg-[#e7edf1] px-4 py-2 text-xs font-black text-[#192a3a]"
                                                    >
                                                        <ShieldCheck size={15} />
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-7 sm:flex-row sm:flex-wrap">
                                        {whatsappHref && (
                                            <a
                                                href={whatsappHref}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                                            >
                                                <MessageCircle size={18} />
                                                Contactar por WhatsApp
                                            </a>
                                        )}

                                        <a
                                            href={mapExternalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                                        >
                                            <MapPin size={18} />
                                            Abrir ubicación
                                        </a>

                                        <Link
                                            href="/servicios"
                                            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                                        >
                                            Solicitar servicio

                                            <ArrowRight
                                                size={17}
                                                className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                                            />
                                        </Link>
                                    </div>
                                </section>

                                {/* Vehículos */}
                                <section
                                    id="inventario-sucursal"
                                    className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] md:p-7"
                                >
                                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="h-px w-8 bg-[#192a3a]" />

                                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                                                    Inventario
                                                </p>
                                            </div>

                                            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                                                Vehículos disponibles
                                            </h2>

                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                Unidades publicadas actualmente en
                                                esta agencia.
                                            </p>
                                        </div>

                                        <span className="w-fit rounded-full bg-[#e7edf1] px-4 py-2 text-xs font-black text-[#192a3a]">
                                            {branch.vehicles.length} unidades
                                        </span>
                                    </div>

                                    {branch.vehicles.length > 0 ? (
                                        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                            {branch.vehicles.map(
                                                (vehicle) => (
                                                    <BranchVehicleCard
                                                        key={vehicle.id}
                                                        vehicle={vehicle}
                                                    />
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-7 rounded-[20px] border border-dashed border-slate-300 bg-[#f8fafb] p-10 text-center">
                                            <Car
                                                size={46}
                                                className="mx-auto text-slate-400"
                                            />

                                            <h3 className="mt-4 text-xl font-black">
                                                Sin vehículos publicados
                                            </h3>

                                            <p className="mt-2 text-sm text-slate-500">
                                                Esta sucursal todavía no tiene
                                                unidades disponibles en el sitio.
                                            </p>

                                            <Link
                                                href="/catalogo"
                                                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                                            >
                                                Ver catálogo general
                                            </Link>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Mapa */}
                            <aside className="xl:sticky xl:top-[120px] xl:self-start">
                                <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.1)]">
                                    <div className="h-[330px] bg-slate-100">
                                        <iframe
                                            src={mapEmbedUrl}
                                            title={`Mapa de ${branch.name}`}
                                            className="h-full w-full"
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>

                                    <div className="p-5 md:p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                                                <MapPin size={18} />
                                            </span>

                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                    Ubicación
                                                </p>

                                                <h2 className="mt-1 text-xl font-black">
                                                    Cómo llegar
                                                </h2>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm leading-7 text-slate-600">
                                            {getBranchLocationText(branch)}
                                        </p>

                                        <a
                                            href={mapExternalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                                        >
                                            Abrir en Google Maps
                                            <ExternalLink size={17} />
                                        </a>

                                        <a
                                            href="#inventario-sucursal"
                                            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                                        >
                                            Ver inventario
                                            <ArrowRight size={17} />
                                        </a>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </Container>
                </section>

                {/* Barra fija móvil */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:hidden">
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
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition active:scale-[0.98] active:bg-emerald-700"
                            >
                                <MessageCircle size={17} />
                                WhatsApp
                            </a>
                        )}

                        <a
                            href={mapExternalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition active:scale-[0.98] active:bg-[#29465c]"
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
        <div className="h-full rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/30 hover:bg-white active:border-[#192a3a]/30">
            <div className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                    {icon}
                </span>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {title}
                    </p>

                    <p className="mt-1 break-words text-sm font-black leading-6 text-[#192a3a]">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
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
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="block h-full"
        >
            {content}
        </a>
    );
}

function BranchVehicleCard({
    vehicle,
}: {
    vehicle: {
        id: number;
        name: string;
        year: number;
        price: number;
        mileage: number | null;
        condition: VehicleCondition;
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
        vehicle.mainImage ||
        vehicle.images[0]?.url ||
        "";

    const title =
        `${vehicle.brand.name} ${vehicle.name}`;

    return (
        <Link
            href={`/vehiculos/${vehicle.id}`}
            className="group block overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/45 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] active:border-[#192a3a]/45"
        >
            <div className="relative h-[190px] overflow-hidden bg-[#e8ecef]">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
                    />
                ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                        <ImageIcon size={40} />
                    </div>
                )}

                <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#192a3a] shadow-sm backdrop-blur-sm">
                    {getConditionLabel(vehicle.condition)}
                </span>

                <div className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#192a3a] shadow-lg transition group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
                    <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                </div>
            </div>

            <div className="p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
                    {vehicle.brand.name}
                </p>

                <h3 className="mt-2 line-clamp-2 min-h-[48px] text-lg font-black leading-tight tracking-[-0.025em]">
                    {vehicle.name}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7edf1] px-3 py-1.5 text-[10px] font-black text-[#192a3a]">
                        <CalendarDays size={13} />
                        {vehicle.year}
                    </span>

                    {vehicle.condition ===
                        VehicleCondition.SEMINUEVO && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                                <Gauge size={13} />
                                {formatMileage(vehicle.mileage)}
                            </span>
                        )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Precio
                    </p>

                    <p className="mt-1 text-xl font-black tracking-[-0.03em]">
                        {formatCurrency(vehicle.price)}
                    </p>
                </div>
            </div>
        </Link>
    );
}