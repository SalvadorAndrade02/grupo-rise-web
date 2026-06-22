"use client";

import { CalendarDays, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  function goToInventory() {
  window.location.href = "/inventario";
}

  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.45),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#1e3a8a_100%)]" />

      <Container className="relative grid min-h-[680px] items-center gap-10 py-20 lg:grid-cols-[1fr_1.1fr]">
        <div className="max-w-2xl">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-sky-200">
            Autos, seminuevos y motos
          </p>

          <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">
            Encuentra tu próximo auto o moto.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Autos nuevos, seminuevos, motos, servicios y sucursales. Todo en un
            solo lugar para que sigas avanzando.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button type="button" onClick={goToInventory} className="px-6 py-4">
              Ver inventario
              <ChevronRight size={18} />
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={goToInventory}
              className="border-white/20 bg-white/10 px-6 py-4 text-white hover:bg-white/20"
            >
              <CalendarDays size={18} />
              Agendar prueba
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative rounded-[2.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur">
            <img
              src="https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1400&auto=format&fit=crop"
              alt="Auto y moto Grupo Rise"
              className="h-[430px] w-full rounded-[2rem] object-cover"
            />

            <div className="absolute bottom-8 left-8 rounded-2xl bg-white/90 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Inventario disponible
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                Autos y motos
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}