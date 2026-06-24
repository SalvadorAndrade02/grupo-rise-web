import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function MotorcycleBanner() {
  return (
    <section className="py-12">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-[var(--rise-navy)] text-white shadow-xl shadow-slate-900/10">
          <div className="grid items-center lg:grid-cols-2">
            <div className="p-8 md:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
                <Bike size={16} />
                Motos listas para rodar
              </span>

              <h2 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
                Encuentra motos nuevas y seminuevas disponibles
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 md:text-base">
                Consulta modelos disponibles de nuestras marcas, revisa sus
                detalles y solicita una cotización directamente desde el
                inventario.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/inventario?categoria=MOTO"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                >
                  Ver motos
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/inventario?categoria=MOTO&condicion=NUEVO"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Motos nuevas
                </Link>

                <Link
                  href="/inventario?categoria=MOTO&condicion=SEMINUEVO"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Seminuevas
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[var(--rise-blue)]" />
                  Inventario actualizado
                </div>

                <div className="inline-flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[var(--rise-blue)]" />
                  Cotización directa
                </div>
              </div>
            </div>

            <div className="relative min-h-[320px] lg:min-h-[460px]">
              <img
                src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1600&auto=format&fit=crop"
                alt="Motocicleta"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[var(--rise-navy)] via-[var(--rise-navy)]/40 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}