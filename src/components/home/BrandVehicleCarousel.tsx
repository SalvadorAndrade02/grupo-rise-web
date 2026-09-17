"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";

export type BrandVehicleCarouselSlide = {
    id: number;
    brand: string;
    model: string;
    year: number | null;
    image: string;
    href: string;
    imagePosition?: string;
};

type BrandVehicleCarouselProps = {
    slides: BrandVehicleCarouselSlide[];
};

export function BrandVehicleCarousel({
    slides,
}: BrandVehicleCarouselProps) {
    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [paused, setPaused] =
        useState(false);

    useEffect(() => {
        if (
            paused ||
            slides.length <= 1
        ) {
            return;
        }

        const interval = window.setInterval(
            () => {
                setCurrentIndex((current) =>
                    current === slides.length - 1
                        ? 0
                        : current + 1
                );
            },
            3500
        );

        return () => {
            window.clearInterval(interval);
        };
    }, [paused, slides.length]);

    if (slides.length === 0) {
        return null;
    }

    function previousSlide() {
        setCurrentIndex((current) =>
            current === 0
                ? slides.length - 1
                : current - 1
        );
    }

    function nextSlide() {
        setCurrentIndex((current) =>
            current === slides.length - 1
                ? 0
                : current + 1
        );
    }

    return (
        <section
            className="bg-[var(--home-surface-alt)] py-12 md:py-16"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-10">
                {/* Título */}
                <div className="mb-8 flex flex-col gap-4 md:mb-10">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-[#192a3a]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                            Inspiración sobre ruedas
                        </p>
                    </div>

                    <h2 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0a0f14] md:text-4xl lg:text-5xl">
                        Vehículos de experiencia Grupo RISE.
                    </h2>

                    <p className="max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                        Explora una muestra de nuestras marcas y descubre
                        modelos que combinan diseño, potencia y estilo.
                    </p>
                </div>

                {/* Carrusel */}
                <div className="relative overflow-hidden rounded-[28px]">
                    <div
                        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                            transform: `translateX(-${currentIndex * 100}%)`,
                        }}
                    >
                        {slides.map((slide, index) => (
                            <article
                                key={slide.id}
                                className="relative min-w-full"
                                aria-hidden={currentIndex !== index}
                            >
                                <Link
                                    href={slide.href}
                                    aria-label={`Ver catálogo de ${slide.brand}`}
                                    className="block"
                                >
                                    <div className="relative overflow-hidden rounded-[28px]">
                                        <img
                                            src={slide.image}
                                            alt={`${slide.brand} ${slide.model}`}
                                            style={{
                                                objectPosition:
                                                    slide.imagePosition ?? "50% 50%",
                                            }}
                                            className="h-[280px] w-full object-cover transition-transform duration-700 sm:h-[320px] md:h-[400px] lg:h-[470px] xl:h-[500px]"
                                        />
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>

                    {/* Flecha izquierda */}
                    {slides.length > 1 && (
                        <button
                            type="button"
                            onClick={previousSlide}
                            aria-label="Vehículo anterior"
                            className="absolute left-4 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-xl bg-white/95 text-[#111827] shadow-md transition hover:bg-white"
                        >
                            <ArrowLeft size={22} />
                        </button>
                    )}

                    {/* Flecha derecha */}
                    {slides.length > 1 && (
                        <button
                            type="button"
                            onClick={nextSlide}
                            aria-label="Siguiente vehículo"
                            className="absolute right-4 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-xl bg-white/95 text-[#111827] shadow-md transition hover:bg-white"
                        >
                            <ArrowRight size={22} />
                        </button>
                    )}
                </div>

                {/* Indicadores */}
                {slides.length > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-2">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                type="button"
                                onClick={() =>
                                    setCurrentIndex(index)
                                }
                                aria-label={`Mostrar ${slide.brand} ${slide.model}`}
                                className={[
                                    "h-[4px] rounded-full transition-all duration-300",
                                    currentIndex === index
                                        ? "w-10 bg-[#192a3a]"
                                        : "w-5 bg-[#192a3a]/20 hover:bg-[#192a3a]/40",
                                ].join(" ")}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}