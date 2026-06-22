import { ChevronRight, Gauge, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const benefits = [
  {
    title: "Modelos 2024",
    icon: Gauge,
  },
  {
    title: "Financiamiento a tu medida",
    icon: WalletCards,
  },
  {
    title: "Servicio especializado",
    icon: ShieldCheck,
  },
];

export function MotorcycleBanner() {
  return (
    <section className="py-16">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-50 via-white to-slate-100 shadow-sm">
          <div className="grid items-center gap-10 p-8 md:p-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                Para cada camino
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Motos listas para rodar
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Descubre nuestra selección de motos nuevas con diseño,
                seguridad y tecnología para cada estilo de vida.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <Icon className="text-blue-700" size={24} />
                      <p className="mt-3 text-sm font-black text-slate-900">
                        {benefit.title}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Button className="mt-8">
                Ver motos
                <ChevronRight size={18} />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-blue-500/10 blur-3xl" />

              <img
                src="https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=1400&auto=format&fit=crop"
                alt="Motos Grupo Rise"
                className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-2xl shadow-slate-900/15"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}