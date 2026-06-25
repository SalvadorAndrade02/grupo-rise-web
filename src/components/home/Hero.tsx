"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
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
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
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
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  function goToPrevious() {
    setCurrentIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  }

  function goToNext() {
    setCurrentIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  }

  const currentVehicle = slides[currentIndex];

  return (
    <section className="relative overflow-hidden bg-[var(--rise-navy)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.94))]" />

      <Container>
        <div className="relative z-10 grid min-h-[720px] items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
              <BadgeCheck size={16} />
              Grupo Rise
            </span>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Encuentra el vehículo ideal para cada etapa de tu camino.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/70 md:text-lg">
              Explora autos, motos y vehículos todo terreno disponibles en
              nuestras sucursales. Cotiza, agenda una prueba de manejo o
              contacta a un asesor.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/inventario"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
              >
                Ver inventario
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/agendar-cita"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                Agendar cita
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-black">+ Marcas</p>
                <p className="mt-1 text-xs font-bold text-white/60">
                  Autos, motos y aventura
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-black">Cotiza</p>
                <p className="mt-1 text-xs font-bold text-white/60">
                  Solicitudes en línea
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-black">Sucursales</p>
                <p className="mt-1 text-xs font-bold text-white/60">
                  Atención personalizada
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[3rem] bg-[var(--rise-blue)]/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
              {currentVehicle ? (
                <>
                  <Link href={`/vehiculos/${currentVehicle.id}`}>
                    <div className="relative h-[360px] overflow-hidden rounded-[2rem] bg-slate-900 md:h-[500px]">
                      <Image
                        src={currentVehicle.mainImage ?? ""}
                        alt={`${currentVehicle.brandName} ${currentVehicle.name}`}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 55vw"
                        className="object-cover transition duration-700"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[var(--rise-navy)]">
                          {getCategoryLabel(currentVehicle.category)}
                        </span>

                        <span className="rounded-full bg-[var(--rise-blue)] px-3 py-1 text-xs font-black text-white">
                          {getConditionLabel(currentVehicle.condition)}
                        </span>
                      </div>

                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                          {currentVehicle.brandName}
                        </p>

                        <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                          {currentVehicle.name}
                        </h2>

                        <p className="mt-2 text-sm font-bold text-white/70">
                          {currentVehicle.model} · {currentVehicle.year} ·{" "}
                          {currentVehicle.branchCity}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          <p className="text-2xl font-black">
                            {formatCurrency(currentVehicle.price)}
                          </p>

                          <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[var(--rise-navy)]">
                            Ver detalles
                            <ArrowRight size={17} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {slides.length > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-4 px-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={goToPrevious}
                          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                          aria-label="Vehículo anterior"
                        >
                          <ChevronLeft size={22} />
                        </button>

                        <button
                          type="button"
                          onClick={goToNext}
                          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                          aria-label="Vehículo siguiente"
                        >
                          <ChevronRight size={22} />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {slides.map((vehicle, index) => (
                          <button
                            key={vehicle.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2.5 rounded-full transition ${
                              index === currentIndex
                                ? "w-8 bg-white"
                                : "w-2.5 bg-white/35 hover:bg-white/60"
                            }`}
                            aria-label={`Ver ${vehicle.name}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid h-[500px] place-items-center rounded-[2rem] bg-white/10 text-center">
                  <div>
                    <ShieldCheck className="mx-auto text-white/50" size={52} />
                    <p className="mt-4 text-lg font-black">
                      Inventario destacado
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      Marca vehículos como destacados para mostrarlos aquí.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}