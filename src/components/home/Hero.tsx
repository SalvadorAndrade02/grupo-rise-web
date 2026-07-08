"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { formatCurrency } from "@/lib/formatters";

type HeroVehicle = {
  id: number;
  brandName: string;
  name: string;
  model: string;
  year: number;
  price: number;
  category: string;
  condition: string;
  branchCity: string;
  mainImage?: string | null;
};

type HeroProps = {
  vehicles?: HeroVehicle[];
};

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Motocicleta",
    TODOTERRENO: "Todoterreno",
  };

  return labels[value] ?? value;
}

function getConditionLabel(value: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[value] ?? value;
}

export function Hero({ vehicles = [] }: HeroProps) {
  const slides = useMemo(
    () => vehicles.filter((vehicle) => Boolean(vehicle.mainImage)).slice(0, 4),
    [vehicles]
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= slides.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(0);
    }
  }, [currentIndex, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  function goToPrevious() {
    if (slides.length <= 1) {
      return;
    }

    setCurrentIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  }

  function goToNext() {
    if (slides.length <= 1) {
      return;
    }

    setCurrentIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  }

  const currentVehicle = slides[currentIndex];

  if (!currentVehicle) {
    return <EmptyHero />;
  }

  return (
    <section
      className="relative isolate min-h-[680px] overflow-hidden bg-[#080b0f] text-white lg:min-h-[760px]"
      aria-label="Vehículos destacados"
    >
      {/* Imagen principal */}
      <div className="absolute inset-0">
        {slides.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            aria-hidden={index !== currentIndex}
          >
            <Image
              src={vehicle.mainImage ?? ""}
              alt={`${vehicle.brandName} ${vehicle.name}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      {/* Capas de contraste */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/48 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/15" />

      {/* Textura visual discreta */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:70px_70px]" />

      <Container>
        <div className="relative z-10 flex min-h-[680px] items-center py-20 lg:min-h-[760px] lg:py-24">
          <div className="w-full max-w-2xl lg:max-w-[660px]">
            {/* Etiqueta */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d2a15c]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#e0b979]">
                Grupo Rise
              </p>
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[62px]">
              Encuentra el vehículo ideal
              <span className="block text-[#d7a65f]">
                para cada etapa de tu camino.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/70 md:text-base">
              Autos, motocicletas y vehículos todoterreno disponibles en las
              agencias de Grupo Rise.
            </p>

            {/* Acciones principales */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="group inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#d1a05a] px-7 text-sm font-black text-[#0a0f14] shadow-[0_14px_35px_rgba(209,160,90,0.24)] transition hover:-translate-y-0.5 hover:bg-[#e2b979]"
              >
                Nuevos

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/inventario"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-white/35 bg-black/15 px-7 text-sm font-black text-white backdrop-blur-md transition hover:border-white hover:bg-white hover:text-[#0a0f14]"
              >
                Seminuevos
              </Link>
            </div>

            {/* Información del vehículo actual */}
            <div
              key={currentVehicle.id}
              className="mt-14 max-w-3xl border-l-2 border-[#d1a05a] pl-5"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#0a0f14]">
                  {getConditionLabel(currentVehicle.condition)}
                </span>

                <span className="border border-white/25 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                  {getCategoryLabel(currentVehicle.category)}
                </span>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[#dfb777]">
                {currentVehicle.brandName}
              </p>

              <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.035em] text-white md:text-4xl">
                    {currentVehicle.name}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-white/60">
                    {currentVehicle.model} · {currentVehicle.year} ·{" "}
                    {currentVehicle.branchCity}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    Precio
                  </p>

                  <p className="mt-1 text-2xl font-black text-white md:text-3xl">
                    {formatCurrency(currentVehicle.price)}
                  </p>
                </div>
              </div>

              <Link
                href={`/vehiculos/${currentVehicle.id}`}
                className="group mt-6 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:text-[#d7a65f]"
              >
                Conocer este vehículo

                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 transition group-hover:border-[#d7a65f] group-hover:bg-[#d7a65f] group-hover:text-[#0a0f14]">
                  <ArrowRight size={15} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>

      {/* Controles del carrusel */}
      {slides.length > 1 && (
        <div className="absolute bottom-7 left-0 right-0 z-20">
          <Container>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur transition hover:border-[#d7a65f] hover:bg-[#d7a65f] hover:text-[#0a0f14]"
                  aria-label="Mostrar vehículo anterior"
                >
                  <ChevronLeft size={21} />
                </button>

                <button
                  type="button"
                  onClick={goToNext}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur transition hover:border-[#d7a65f] hover:bg-[#d7a65f] hover:text-[#0a0f14]"
                  aria-label="Mostrar siguiente vehículo"
                >
                  <ChevronRight size={21} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {slides.map((vehicle, index) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`relative h-[3px] overflow-hidden transition-all duration-300 ${index === currentIndex
                        ? "w-14 bg-[#d7a65f]"
                        : "w-7 bg-white/35 hover:bg-white/70"
                      }`}
                    aria-label={`Mostrar ${vehicle.brandName} ${vehicle.name}`}
                    aria-current={index === currentIndex ? "true" : undefined}
                  />
                ))}

                <span className="ml-2 text-[10px] font-black tracking-[0.2em] text-white/50">
                  {String(currentIndex + 1).padStart(2, "0")} /{" "}
                  {String(slides.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </Container>
        </div>
      )}
    </section>
  );
}

function EmptyHero() {
  return (
    <section className="relative min-h-[640px] overflow-hidden bg-[#080b0f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,#29323d_0%,#12171d_42%,#080b0f_100%)]" />

      <Container>
        <div className="relative z-10 flex min-h-[640px] items-center py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-[#d2a15c]" />

              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#e0b979]">
                Grupo Rise
              </p>
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
              Movilidad para cada
              <span className="block text-[#d7a65f]">estilo de vida.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/65 md:text-lg">
              Descubre nuestra selección de autos, motocicletas y vehículos
              recreativos.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#d1a05a] px-7 text-sm font-black text-[#0a0f14]"
              >
                Explorar catálogo
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/inventario"
                className="inline-flex h-14 items-center justify-center rounded-lg border border-white/30 px-7 text-sm font-black text-white"
              >
                Ver seminuevos
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-4 border-l-2 border-white/20 pl-5">
              <ShieldCheck size={28} className="text-[#d7a65f]" />

              <p className="max-w-md text-sm font-semibold leading-6 text-white/55">
                Marca unidades como destacadas desde el panel administrativo
                para mostrarlas en el carrusel principal.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}