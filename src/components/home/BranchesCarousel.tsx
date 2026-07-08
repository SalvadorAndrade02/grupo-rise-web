"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    Building2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    MessageCircle,
} from "lucide-react";

type BranchItem = {
    id: number;
    name: string;
    city: string;
    state?: string | null;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    services?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
};

type BranchesCarouselProps = {
    branches: BranchItem[];
};

function cleanPhone(value?: string | null) {
    return String(value ?? "").replace(/\D/g, "");
}

function getWhatsAppHref(branch: BranchItem) {
    const phone = cleanPhone(branch.whatsapp || branch.phone);

    if (!phone) {
        return null;
    }

    const message = encodeURIComponent(
        `Hola, me gustaría recibir información de la sucursal ${branch.name}.`
    );

    return `https://wa.me/52${phone}?text=${message}`;
}

function getLocation(branch: BranchItem) {
    return [branch.city, branch.state].filter(Boolean).join(", ");
}

function getServiceLabels(services?: string | null) {
    if (!services) {
        return [];
    }

    return services
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean)
        .slice(0, 2);
}

export function BranchesCarousel({
    branches,
}: BranchesCarouselProps) {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    if (branches.length === 0) {
        return null;
    }

    function moveCarousel(direction: "left" | "right") {
        const container = carouselRef.current;

        if (!container) {
            return;
        }

        const firstCard = container.firstElementChild as HTMLElement | null;
        const cardWidth = firstCard?.offsetWidth ?? 360;
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || "20");
        const movement = cardWidth + gap;

        if (direction === "right") {
            const reachedEnd =
                container.scrollLeft + container.clientWidth >=
                container.scrollWidth - 10;

            if (reachedEnd) {
                container.scrollTo({
                    left: 0,
                    behavior: "smooth",
                });

                return;
            }
        }

        if (direction === "left" && container.scrollLeft <= 10) {
            container.scrollTo({
                left: container.scrollWidth,
                behavior: "smooth",
            });

            return;
        }

        container.scrollBy({
            left: direction === "left" ? -movement : movement,
            behavior: "smooth",
        });
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (branches.length <= 1 || isPaused) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            return;
        }

        const interval = window.setInterval(() => {
            const container = carouselRef.current;

            if (!container) {
                return;
            }

            const firstCard = container.firstElementChild as HTMLElement | null;
            const cardWidth = firstCard?.offsetWidth ?? 360;
            const styles = window.getComputedStyle(container);
            const gap = Number.parseFloat(styles.columnGap || styles.gap || "20");
            const movement = cardWidth + gap;

            const reachedEnd =
                container.scrollLeft + container.clientWidth >=
                container.scrollWidth - 10;

            if (reachedEnd) {
                container.scrollTo({
                    left: 0,
                    behavior: "smooth",
                });

                return;
            }

            container.scrollBy({
                left: movement,
                behavior: "smooth",
            });
        }, 1000);

        return () => window.clearInterval(interval);
    }, [branches.length, isPaused]);

    return (
        <section className="overflow-hidden bg-white py-16 md:py-20 lg:py-24">
            <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-10">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-[#1A2A3A]" /> {/* Dorado cambiado a azul marino */}

                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#1A2A3A]"> {/* Subtítulo en azul marino */}
                                Presencia Grupo Rise
                            </p>
                        </div>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0a0f14] md:text-4xl lg:text-5xl">
                            Encuentra tu agencia
                        </h2>

                        <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                            Conoce nuestras sucursales and encuentra atención, vehículos y
                            servicios cerca de ti.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => moveCarousel("left")}
                            aria-label="Mostrar sucursal anterior"
                            className="grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white text-[#0a0f14] transition hover:border-[#1A2A3A] hover:bg-[#1A2A3A] hover:text-white active:scale-95 active:border-[#192a3a] active:bg-[#192a3a] active:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={() => moveCarousel("right")}
                            aria-label="Mostrar siguiente sucursal"
                            className="grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white text-[#0a0f14] transition hover:border-[#1A2A3A] hover:bg-[#1A2A3A] hover:text-white active:scale-95 active:border-[#192a3a] active:bg-[#192a3a] active:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>

                        <Link
                            href="/sucursales"
                            className="ml-1 hidden items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[#0a0f14] sm:inline-flex"
                        >
                            Ver todas

                            <ArrowRight
                                size={16}
                                className="text-[#1A2A3A]"
                            />
                        </Link>
                    </div>
                </div>

                <div
                    ref={carouselRef}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onFocusCapture={() => setIsPaused(true)}
                    onBlurCapture={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                    className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {branches.map((branch, index) => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            priority={index === 0}
                        />
                    ))}
                </div>

                <div className="mt-5 flex justify-center sm:hidden">
                    <Link
                        href="/sucursales"
                        className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[#0a0f14] px-6 text-sm font-black text-white transition hover:bg-[#1A2A3A]"
                    >
                        Ver todas las sucursales
                        <ArrowRight size={17} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function BranchCard({
    branch,
    priority,
}: {
    branch: BranchItem;
    priority: boolean;
}) {
    const whatsappHref = getWhatsAppHref(branch);
    const location = getLocation(branch);
    const services = getServiceLabels(branch.services);

    return (
        <article className="group w-[84vw] max-w-[355px] shrink-0 snap-start overflow-hidden rounded-[18px] border border-black/8 bg-[#f8f7f4] shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] sm:w-[350px] lg:w-[370px] lg:max-w-[370px] active:scale-[0.98] active:border-[#192a3a]/50">
            <Link
                href={`/sucursales/${branch.id}`}
                className="relative block h-[205px] overflow-hidden bg-[#e8e7e2]"
            >
                {branch.coverImageUrl ? (
                    <Image
                        src={branch.coverImageUrl}
                        alt={`Fachada de ${branch.name}`}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 84vw, 370px"
                        className="object-cover transition duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,#d9d7d1,#efeee9)]">
                        <Building2
                            size={48}
                            strokeWidth={1.3}
                            className="text-slate-400"
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                {branch.logoUrl && (
                    <div className="absolute left-4 top-4 flex h-14 w-20 items-center justify-center rounded-lg border border-white/70 bg-white p-2 shadow-lg">
                        <Image
                            src={branch.logoUrl}
                            alt={`Logo ${branch.name}`}
                            width={80}
                            height={56}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                )}

                <div className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#0a0f14] shadow-lg transition group-hover:bg-[#1A2A3A] group-hover:text-white group-active:text-white" > {/* Círculo flotante cambia a azul marino */}
                    <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                    />
                </div>
            </Link>

            <div className="p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#1A2A3A]"> {/* Tag superior en azul marino */}
                    Agencia Grupo Rise
                </p>

                <Link href={`/sucursales/${branch.id}`}>
                    <h3 className="mt-2 line-clamp-2 min-h-[52px] text-xl font-black leading-tight tracking-[-0.03em] text-[#0a0f14] transition hover:text-[#1A2A3A]"> {/* Hover del título cambia a azul marino */}
                        {branch.name}
                    </h3>
                </Link>


                <div className="mt-5 grid gap-2 border-t border-black/8 pt-4 sm:grid-cols-2">
                    <Link
                        href={`/sucursales/${branch.id}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0a0f14] px-4 text-xs font-black text-white transition hover:bg-[#1A2A3A] active:scale-95 active:border-[#192a3a] active:bg-[#192a3a] active:text-white"
                    >
                        Ver agencia
                        <ArrowRight size={15} />
                    </Link>

                    {whatsappHref ? (
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-xs font-black text-[#0a0f14] transition hover:border-[#25d366] hover:bg-[#edfdf3] active:scale-[0.98] active:border-[#25d366] active:bg-[#edfdf3]"
                        >
                            <MessageCircle
                                size={16}
                                className="text-[#159447]"
                            />

                            WhatsApp
                        </a>
                    ) : (
                        <Link
                            href={`/sucursales/${branch.id}`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-xs font-black text-[#0a0f14] transition hover:bg-slate-50"
                        >
                            Más información
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}