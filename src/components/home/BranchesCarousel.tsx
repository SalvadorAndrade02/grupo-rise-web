"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    MessageCircle,
    Phone,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

type BranchCarouselItem = {
    id: number;
    name: string;
    city: string;
    state: string;
    address: string;
    phone?: string | null;
    whatsapp?: string | null;
    googleMapsUrl?: string | null;
    services?: string | null;
};

type BranchesCarouselProps = {
    branches: BranchCarouselItem[];
};

function cleanPhone(value?: string | null) {
    return value?.replace(/\D/g, "") ?? "";
}

function getMapUrl(branch: BranchCarouselItem) {
    if (branch.googleMapsUrl?.trim()) {
        return branch.googleMapsUrl;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${branch.address}, ${branch.city}, ${branch.state}`
    )}`;
}

function getMapLocationText(branch: BranchCarouselItem) {
    return `${branch.address}, ${branch.city}, ${branch.state}`;
}

function getMapEmbedUrl(branch: BranchCarouselItem) {
    if (branch.googleMapsUrl?.includes("/embed")) {
        return branch.googleMapsUrl;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(
        getMapLocationText(branch)
    )}&output=embed`;
}

function splitServices(value?: string | null) {
    return String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
}

export function BranchesCarousel({ branches }: BranchesCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const safeBranches = useMemo(() => branches.filter(Boolean), [branches]);

    useEffect(() => {
        if (safeBranches.length <= 1) {
            return;
        }

        const interval = window.setInterval(() => {
            setCurrentIndex((current) =>
                current === safeBranches.length - 1 ? 0 : current + 1
            );
        }, 4500);

        return () => window.clearInterval(interval);
    }, [safeBranches.length]);

    function goToPrevious() {
        setCurrentIndex((current) =>
            current === 0 ? safeBranches.length - 1 : current - 1
        );
    }

    function goToNext() {
        setCurrentIndex((current) =>
            current === safeBranches.length - 1 ? 0 : current + 1
        );
    }

    if (safeBranches.length === 0) {
        return null;
    }

    const currentBranch = safeBranches[currentIndex];
    const whatsapp = cleanPhone(currentBranch.whatsapp);
    const phone = cleanPhone(currentBranch.phone);
    const services = splitServices(currentBranch.services);
    const mapUrl = getMapUrl(currentBranch);
    const mapEmbedUrl = getMapEmbedUrl(currentBranch);

    return (
        <section className="py-12">
            <Container>
                <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-xl shadow-slate-900/10">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative min-h-[360px] bg-[var(--rise-navy)] p-8 text-white md:p-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.92))]" />

                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
                                        Sucursales Grupo Rise
                                    </span>

                                    <h2 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
                                        Encuentra tu agencia más cercana
                                    </h2>

                                    <p className="mt-4 max-w-md text-sm leading-7 text-white/70 md:text-base">
                                        Consulta nuestras sucursales disponibles, ubicación,
                                        teléfonos y marcas disponibles.
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={goToPrevious}
                                        className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                                        aria-label="Sucursal anterior"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={goToNext}
                                        className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                                        aria-label="Sucursal siguiente"
                                    >
                                        <ChevronRight size={22} />
                                    </button>

                                    <div className="ml-2 flex gap-2">
                                        {safeBranches.map((branch, index) => (
                                            <button
                                                key={branch.id}
                                                type="button"
                                                onClick={() => setCurrentIndex(index)}
                                                className={`h-2.5 rounded-full transition ${index === currentIndex
                                                    ? "w-8 bg-white"
                                                    : "w-2.5 bg-white/35 hover:bg-white/60"
                                                    }`}
                                                aria-label={`Ver sucursal ${branch.name}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-10">
                            <div className="rounded-[1.5rem] border border-[var(--rise-border)] bg-slate-50 p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--rise-blue)]">
                                            {currentBranch.city}, {currentBranch.state}
                                        </p>

                                        <h3 className="mt-2 text-2xl font-black text-[var(--rise-navy)] md:text-3xl">
                                            {currentBranch.name}
                                        </h3>
                                    </div>

                                    <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                                        Disponible
                                    </span>
                                </div>

                                {services.length > 0 && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {services.map((service) => (
                                            <span
                                                key={service}
                                                className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]"
                                            >
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--rise-border)] bg-white shadow-sm">
                                    <iframe
                                        src={mapEmbedUrl}
                                        title={`Mapa de ${currentBranch.name}`}
                                        className="h-56 w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                                    >
                                        <MapPin size={18} />
                                        Ver mapa
                                    </a>

                                    {phone && (
                                        <a
                                            href={`tel:${phone}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                                        >
                                            <Phone size={18} />
                                            Llamar
                                        </a>
                                    )}

                                    {whatsapp && (
                                        <a
                                            href={`https://wa.me/52${whatsapp}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                                        >
                                            <MessageCircle size={18} />
                                            WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/sucursales"
                                    className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                                >
                                    Ver todas las sucursales
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}