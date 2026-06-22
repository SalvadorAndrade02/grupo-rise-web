import { ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCTA() {
  return (
    <section className="py-16">
      <Container>
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                Grupo Rise
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                ¿Listo para encontrar tu próximo auto o moto?
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Explora nuestro inventario, agenda una prueba de manejo o
                contacta a un asesor para recibir atención personalizada.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="bg-blue text-slate-950 hover:bg-slate-500">
                Explorar inventario
                <ChevronRight size={18} />
              </Button>

              <Button
                variant="secondary"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <MessageCircle size={18} />
                Contactar asesor
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}