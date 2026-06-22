import { Bike, CalendarDays, Car, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";

const actions = [
  {
    title: "Autos nuevos",
    description: "Estrena con la mejor tecnología y garantía.",
    icon: Car,
  },
  {
    title: "Motos nuevas",
    description: "Modelos listos para tu próxima aventura.",
    icon: Bike,
  },
  {
    title: "Seminuevos",
    description: "Opciones revisadas, confiables y garantizadas.",
    icon: ShieldCheck,
  },
  {
    title: "Agenda tu servicio",
    description: "Mantenimiento para autos y motos.",
    icon: CalendarDays,
  },
  {
    title: "Sucursales",
    description: "Encuentra la sucursal más cercana a ti.",
    icon: MapPin,
  },
];

export function QuickActions() {
  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <article
                key={action.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="mb-5 grid h-13 w-13 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon size={26} />
                </div>

                <h3 className="text-lg font-black text-slate-950">
                  {action.title}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-1 text-sm font-black text-blue-700">
                  Ver más
                  <ChevronRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}