import Link from "next/link";
import {
  Bike,
  CalendarDays,
  Car,
  ChevronRight,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

const actions = [
  {
    title: "Autos",
    description: "Explora modelos nuevos y seminuevos disponibles.",
    href: "/inventario?categoria=AUTO",
    icon: Car,
  },
  {
    title: "Motos",
    description: "Consulta motos disponibles por marca y estilo.",
    href: "/inventario?categoria=MOTO",
    icon: Bike,
  },
  {
    title: "Todo terreno",
    description: "Vehículos para aventura, trabajo y recreación.",
    href: "/inventario?categoria=TODOTERRENO",
    icon: ShieldCheck,
  },
  {
    title: "Agenda tu servicio",
    description: "Encuentra una sucursal para recibir atención.",
    href: "/sucursales",
    icon: CalendarDays,
  },
  {
    title: "Sucursales",
    description: "Consulta agencias, ubicación y contacto.",
    href: "/sucursales",
    icon: MapPin,
  },
];

export function QuickActions() {
  return (
    <section id="servicios" className="py-10">
      <Container>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-black text-[var(--rise-navy)]">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                  Ver más
                  <ChevronRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}