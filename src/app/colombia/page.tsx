import Link from "next/link";
import {
    ArrowRight,
    Building2,
    ExternalLink,
    MapPin,
    Phone,
    ShieldCheck,
} from "lucide-react";
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
} from "react-icons/fa";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const motorcycleFamilies = [
    "Scout",
    "Chief",
    "Bagger",
    "Touring",
];

function cleanPhone(
    value?: string | null
) {
    return value?.replace(/\D/g, "") ?? "";
}

function getMapUrl(branch: {
    address: string;
    city: string;
    state: string;
    googleMapsUrl?: string | null;
}) {
    if (branch.googleMapsUrl?.trim()) {
        return branch.googleMapsUrl;
    }

    const location = [
        branch.address,
        branch.city,
        branch.state,
        "Colombia",
    ]
        .filter(Boolean)
        .join(", ");

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location
    )}`;
}

export default async function ColombiaPage() {
    const branch =
        await prisma.branch.findFirst({
            where: {
                active: true,
                countryCode: "CO",
            },

            orderBy: {
                sortOrder: "asc",
            },
        });

    const socialLinks = branch
        ? [
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
            (social) =>
                Boolean(social.href)
        )
        : [];

    const phone = branch
        ? cleanPhone(branch.phone)
        : "";

    const mapUrl = branch
        ? getMapUrl(branch)
        : "";

    return (
        <>
            <Header />

            <main className="public-home">
                {/* Hero */}
                <section className="relative isolate overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
                    {branch?.coverImageUrl && (
                        <img
                            src={branch.coverImageUrl}
                            alt=""
                            className="absolute inset-0 -z-30 h-full w-full object-cover"
                        />
                    )}

                    <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(8,12,16,0.96)_0%,rgba(8,12,16,0.78)_55%,rgba(8,12,16,0.45)_100%)]" />

                    <div className="public-container relative grid min-h-[570px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_330px] lg:py-24">
                        <div className="max-w-4xl">
                            <div className="flex items-center gap-4">
                                <span className="h-px w-10 bg-[var(--public-accent)]" />

                                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                                    Grupo RISE Colombia
                                </p>
                            </div>

                            <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                                Indian Motorcycle
                                <span className="block text-white/55">
                                    Colombia.
                                </span>
                            </h1>

                            <p className="mt-8 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
                                Presencia de Indian Motorcycle
                                en Colombia, con atención en
                                ventas, cotizaciones, prueba de
                                manejo y servicios relacionados
                                con la marca.
                            </p>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                {branch?.websiteUrl && (
                                    <a
                                        href={branch.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                                    >
                                        Visitar sitio oficial
                                        <ExternalLink
                                            size={17}
                                        />
                                    </a>
                                )}

                                {branch && (
                                    <a
                                        href="#sede-colombia"
                                        className="inline-flex h-12 items-center justify-center border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[var(--public-header)]"
                                    >
                                        Conocer la sede
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="border border-white/15 bg-black/20 p-7 backdrop-blur-sm">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                                Representación
                            </p>

                            <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
                                Master Dealer
                            </p>

                            <p className="mt-4 text-sm leading-7 text-white/55">
                                Indian Motorcycle en Colombia.
                            </p>

                            {branch?.logoUrl && (
                                <div className="mt-7 flex h-28 items-center justify-center border border-white/10 bg-[#eef0ee] p-5">
                                    <img
                                        src={branch.logoUrl}
                                        alt={`Logo ${branch.name}`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Familias */}
                <section className="border-b border-[var(--home-border)] bg-[#eef0ee]">
                    <div className="public-container py-16 md:py-24">
                        <p className="public-eyebrow">
                            Indian Motorcycle
                        </p>

                        <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                            Una gama para distintas formas de rodar.
                        </h2>

                        <div className="mt-12 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2 lg:grid-cols-4">
                            {motorcycleFamilies.map(
                                (family) => (
                                    <div
                                        key={family}
                                        className="flex min-h-[145px] items-end bg-[var(--home-card)] p-6"
                                    >
                                        <div>
                                            <ShieldCheck
                                                size={20}
                                                className="text-[var(--public-accent)]"
                                            />

                                            <p className="mt-6 text-xl font-black text-[var(--public-ink)]">
                                                {family}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* Sede */}
                <section
                    id="sede-colombia"
                    className="scroll-mt-[120px] bg-[var(--home-card)]"
                >
                    <div className="public-container py-16 md:py-24">
                        {!branch ? (
                            <div className="border border-[var(--home-border)] bg-[#eef0ee] p-10">
                                <Building2
                                    size={30}
                                    className="text-[var(--public-accent)]"
                                />

                                <h2 className="mt-5 text-3xl font-black text-[var(--public-ink)]">
                                    Sede en preparación
                                </h2>

                                <p className="mt-4 text-[var(--public-muted)]">
                                    Registra la sucursal de
                                    Colombia desde el administrador.
                                </p>
                            </div>
                        ) : (
                            <div className="grid border border-[var(--home-border)] lg:grid-cols-[minmax(0,1fr)_390px]">
                                <div className="p-7 md:p-10">
                                    <p className="public-eyebrow">
                                        Sede Colombia
                                    </p>

                                    <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-5xl">
                                        {branch.name}
                                    </h2>

                                    <div className="mt-8 grid gap-5">
                                        <div className="flex items-start gap-4">
                                            <MapPin
                                                size={20}
                                                className="mt-1 shrink-0 text-[var(--public-accent)]"
                                            />

                                            <div>
                                                <p className="font-black text-[var(--public-ink)]">
                                                    {branch.address}
                                                </p>

                                                <p className="mt-1 text-sm text-[var(--public-muted)]">
                                                    {branch.city},{" "}
                                                    {branch.state}
                                                </p>
                                            </div>
                                        </div>

                                        {branch.phone && (
                                            <a
                                                href={
                                                    phone
                                                        ? `tel:+${phone}`
                                                        : undefined
                                                }
                                                className="flex items-center gap-4 font-black text-[var(--public-ink)]"
                                            >
                                                <Phone
                                                    size={20}
                                                    className="text-[var(--public-accent)]"
                                                />

                                                {branch.phone}
                                            </a>
                                        )}
                                    </div>

                                    {socialLinks.length >
                                        0 && (
                                            <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--home-border)] pt-7">
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
                                                            className="inline-flex h-11 items-center justify-center gap-2 border border-[var(--home-border-strong)] px-4 text-sm font-black text-[var(--public-ink)] transition hover:bg-[var(--public-header)] hover:!text-white"
                                                        >
                                                            <Icon size={17} />
                                                            {label}
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>

                                <div className="grid gap-px border-t border-[var(--home-border)] bg-[var(--home-border)] lg:border-l lg:border-t-0">
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex min-h-[110px] items-center justify-between bg-[#eef0ee] px-7 text-[var(--public-ink)] transition hover:bg-[var(--public-header)] hover:!text-white"
                                    >
                                        <span className="font-black">
                                            Abrir ubicación
                                        </span>

                                        <MapPin size={19} />
                                    </a>

                                    {branch.websiteUrl && (
                                        <a
                                            href={
                                                branch.websiteUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex min-h-[110px] items-center justify-between bg-[#eef0ee] px-7 text-[var(--public-ink)] transition hover:bg-[var(--public-header)] hover:!text-white"
                                        >
                                            <span className="font-black">
                                                Sitio oficial
                                            </span>

                                            <ArrowRight
                                                size={19}
                                            />
                                        </a>
                                    )}

                                    <Link
                                        href={`/sucursales/${branch.id}`}
                                        className="group flex min-h-[110px] items-center justify-between bg-[#eef0ee] px-7 text-[var(--public-ink)] transition hover:bg-[var(--public-header)] hover:!text-white"
                                    >
                                        <span className="font-black">
                                            Información completa
                                        </span>

                                        <ArrowRight
                                            size={19}
                                        />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}