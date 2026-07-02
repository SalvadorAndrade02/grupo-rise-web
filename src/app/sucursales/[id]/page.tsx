import Link from "next/link";
import { notFound } from "next/navigation";
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
import { BranchCoverViewer } from "@/components/branches/BranchCoverViewer";

export const dynamic = "force-dynamic";

type BranchDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};

function cleanPhone(value?: string | null) {
    return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(phone?: string | null, message?: string) {
    const phoneNumber = cleanPhone(phone);

    if (!phoneNumber) {
        return "";
    }

    const finalPhone = phoneNumber.startsWith("52")
        ? phoneNumber
        : `52${phoneNumber}`;

    const text = message ? `?text=${encodeURIComponent(message)}` : "";

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
    return `${branch.address}, ${branch.city}, ${branch.state}`;
}

function getMapEmbedUrl(branch: {
    address: string;
    city: string;
    state: string;
    googleMapsUrl?: string | null;
}) {
    const googleMapsUrl = branch.googleMapsUrl?.trim();

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

function getCategoryLabel(category: string) {
    const labels: Record<string, string> = {
        AUTO: "Auto",
        MOTO: "Moto",
        TODOTERRENO: "Todo terreno",
    };

    return labels[category] ?? category;
}

function getConditionLabel(condition: VehicleCondition) {
    return condition === VehicleCondition.NUEVO ? "Nuevo" : "Seminuevo";
}

function formatMileage(value: number | null) {
    if (value === null || value === undefined) {
        return "Km por confirmar";
    }

    return `${new Intl.NumberFormat("es-MX").format(value)} km`;
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

    const whatsappHref = getWhatsAppHref(
        branch.whatsapp,
        `Hola, me gustaría recibir información de ${branch.name}.`
    );

    const phone = cleanPhone(branch.phone);

    const newVehicles = branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.NUEVO
    );

    const usedVehicles = branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.SEMINUEVO
    );

    return (
        <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
            <Header />

            <section className="relative overflow-hidden bg-[var(--rise-navy)] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

                <div className="relative h-[420px] overflow-hidden">
                    {branch.coverImageUrl ? (
                        <img
                            src={branch.coverImageUrl}
                            alt={`Fachada de ${branch.name}`}
                            className="h-full w-full object-cover opacity-70"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-[var(--rise-navy)]">
                            <Building2 size={90} className="text-white/20" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--rise-navy)] via-[var(--rise-navy)]/40 to-transparent" />

                    <Container>
                        <div className="absolute bottom-10 left-4 right-4 mx-auto max-w-7xl">
                            <Link
                                href="/sucursales"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 backdrop-blur transition hover:bg-white/15"
                            >
                                <ArrowLeft size={18} />
                                Volver a sucursales
                            </Link>

                            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
                                <div className="max-w-3xl">
                                    <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
                                        Agencia Grupo Rise
                                    </p>

                                    <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
                                        {branch.name}
                                    </h1>

                                    <p className="mt-4 flex items-center gap-2 text-base font-bold text-blue-100">
                                        <MapPin size={19} />
                                        {branch.city}, {branch.state}
                                    </p>
                                </div>

                                {branch.logoUrl && (
                                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-white/50 bg-white p-3 shadow-xl">
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
            </section>

            <section className="relative z-10 -mt-8 px-4 pb-16 md:-mt-12 md:pb-20">
                <Container>
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="space-y-8">
                            <section className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-8">
                                <div className="flex flex-wrap items-start justify-between gap-5">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                                            Información
                                        </p>

                                        <h2 className="mt-3 text-3xl font-black">
                                            Datos de la agencia
                                        </h2>
                                    </div>

                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                                        <Building2 size={24} />
                                    </div>
                                </div>

                                <div className="mt-7 grid gap-4 md:grid-cols-2">
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
                                            href={phone ? `tel:${phone}` : undefined}
                                        />
                                    )}

                                    {branch.whatsapp && (
                                        <InfoBox
                                            icon={<MessageCircle size={20} />}
                                            title="WhatsApp"
                                            value={branch.whatsapp}
                                            href={whatsappHref}
                                            external
                                        />
                                    )}

                                    {branch.email && (
                                        <InfoBox
                                            icon={<Mail size={20} />}
                                            title="Correo"
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

                                    <InfoBox
                                        icon={<Car size={20} />}
                                        title="Inventario disponible"
                                        value={`${branch.vehicles.length} unidad(es)`}
                                        description={`${newVehicles.length} nuevos · ${usedVehicles.length} seminuevos`}
                                    />
                                </div>

                                {services.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-xl font-black">
                                            Servicios disponibles
                                        </h3>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {services.map((service) => (
                                                <span
                                                    key={service}
                                                    className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-600"
                                                >
                                                    <ShieldCheck
                                                        size={15}
                                                        className="text-[var(--rise-blue)]"
                                                    />
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex flex-wrap gap-3">
                                    {whatsappHref && (
                                        <a
                                            href={whatsappHref}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                                        >
                                            <MessageCircle size={18} />
                                            Contactar por WhatsApp
                                        </a>
                                    )}

                                    <a
                                        href={mapExternalUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                                    >
                                        <MapPin size={18} />
                                        Abrir ubicación
                                    </a>

                                    <Link
                                        href="/servicios"
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                                    >
                                        Solicitar servicio
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-[2.5rem] border border-[var(--rise-border)] bg-white shadow-xl shadow-slate-900/10">
                                <BranchCoverViewer
                                    coverImageUrl={branch.coverImageUrl}
                                    logoUrl={branch.logoUrl}
                                    branchName={branch.name}
                                    heightClassName="h-[420px]"
                                />
                            </section>

                            <section className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8">
                                <div className="flex flex-wrap items-end justify-between gap-5">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                                            Inventario
                                        </p>

                                        <h2 className="mt-3 text-3xl font-black">
                                            Vehículos en esta sucursal
                                        </h2>

                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Consulta unidades disponibles relacionadas con esta
                                            agencia.
                                        </p>
                                    </div>

                                    <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                                        {branch.vehicles.length} disponible(s)
                                    </div>
                                </div>

                                {branch.vehicles.length > 0 ? (
                                    <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        {branch.vehicles.map((vehicle) => {
                                            const image =
                                                vehicle.mainImage || vehicle.images[0]?.url || "";
                                            const vehicleTitle = `${vehicle.brand.name} ${vehicle.name}`;

                                            return (
                                                <Link
                                                    key={vehicle.id}
                                                    href={`/vehiculos/${vehicle.id}`}
                                                    className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                                                >
                                                    <div className="relative h-44 overflow-hidden bg-slate-100">
                                                        {image ? (
                                                            <img
                                                                src={image}
                                                                alt={vehicleTitle}
                                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="grid h-full place-items-center text-slate-400">
                                                                <ImageIcon size={40} />
                                                            </div>
                                                        )}

                                                        <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--rise-blue)] shadow-sm">
                                                            {getConditionLabel(vehicle.condition)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4">
                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                                                            {vehicle.brand.name}
                                                        </p>

                                                        <h3 className="mt-2 line-clamp-2 text-lg font-black text-[var(--rise-navy)]">
                                                            {vehicle.name}
                                                        </h3>

                                                        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
                                                            <span className="flex items-center gap-2">
                                                                <CalendarDays size={14} />
                                                                {vehicle.year}
                                                            </span>

                                                            <span className="flex items-center gap-2">
                                                                <Tags size={14} />
                                                                {getCategoryLabel(vehicle.category)}
                                                            </span>

                                                            <span className="flex items-center gap-2">
                                                                <Gauge size={14} />
                                                                {formatMileage(vehicle.mileage)}
                                                            </span>
                                                        </div>

                                                        <p className="mt-4 text-xl font-black text-[var(--rise-blue)]">
                                                            {formatCurrency(vehicle.price)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-7 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                                        <Car size={46} className="mx-auto text-slate-400" />

                                        <h3 className="mt-4 text-xl font-black">
                                            Sin vehículos publicados
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Esta sucursal aún no tiene unidades disponibles en el
                                            sitio.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="xl:sticky xl:top-6 xl:self-start">
                            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--rise-border)] bg-white shadow-xl shadow-slate-900/10">
                                <div className="h-80 bg-slate-100">
                                    <iframe
                                        src={mapEmbedUrl}
                                        title={`Mapa de ${branch.name}`}
                                        className="h-full w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>

                                <div className="p-5 md:p-6">
                                    <h2 className="text-2xl font-black">Ubicación</h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {branch.address}, {branch.city}, {branch.state}
                                    </p>

                                    <a
                                        href={mapExternalUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                                    >
                                        Abrir en Google Maps
                                        <ExternalLink size={17} />
                                    </a>
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

function InfoBox({
    icon,
    title,
    value,
    description,
    href,
    external = false,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    description?: string;
    href?: string;
    external?: boolean;
}) {
    const content = (
        <div className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
            <div className="flex gap-3">
                <div className="mt-0.5 shrink-0 text-[var(--rise-blue)]">{icon}</div>

                <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {title}
                    </p>

                    <p className="mt-1 text-sm font-black leading-6 text-[var(--rise-navy)]">
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
            className="block"
        >
            {content}
        </a>
    );
}