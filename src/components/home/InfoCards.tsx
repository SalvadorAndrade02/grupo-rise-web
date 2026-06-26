"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

const cards = [
  {
    title: "Financiamiento",
    description:
      "Solicita información para conocer opciones de compra y financiamiento.",
    href: "/sucursales",
    icon: BadgeDollarSign,
  },
  {
    title: "Agenda una cita",
    description:
      "Elige una sucursal y ponte en contacto para recibir atención personalizada.",
    href: "/agendar-cita",
    icon: CalendarCheck,
  },
  {
    title: "Agencias Grupo Rise",
    description:
      "Consulta ubicación, teléfonos y disponibilidad de nuestras sucursales.",
    href: "/sucursales",
    icon: Building2,
  },
];

export function InfoCards() {
  return (
    <section className="py-12">
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-[1.75rem] border border-[var(--rise-border)] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-xl font-black text-[var(--rise-navy)]">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                  Continuar
                  <ArrowRight
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