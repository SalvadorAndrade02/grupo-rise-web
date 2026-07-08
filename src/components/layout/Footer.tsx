"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CarFront,
  MapPin,
  MessageCircle,
  Wrench,
} from "lucide-react";

const vehicleLinks = [
  {
    label: "Vehículos nuevos",
    href: "/catalogo",
  },
  {
    label: "Seminuevos",
    href: "/inventario",
  },
  {
    label: "Autos",
    href: "/catalogo?categoria=AUTO",
  },
  {
    label: "Motocicletas",
    href: "/catalogo?categoria=MOTO",
  },
  {
    label: "Todoterreno",
    href: "/catalogo?categoria=TODOTERRENO",
  },
];

const companyLinks = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: "Sucursales",
    href: "/sucursales",
  },
  {
    label: "Servicios",
    href: "/servicios",
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#090d12] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-8 lg:px-10 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-white" />

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white">
                  Atención Grupo Rise
                </p>
              </div>

              <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-white md:text-4xl lg:text-5xl">
                Encuentra el vehículo indicado para tu siguiente camino.
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/55 md:text-base">
                Explora nuestras unidades o solicita atención personalizada
                para recibir información de vehículos, servicio y refacciones.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/catalogo"
                className="group inline-flex h-13 items-center justify-center gap-3 rounded-lg bg-[#1A2A3A] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#263d54]"
              >
                Explorar catálogo

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/contacto"
                className="group inline-flex h-13 items-center justify-center gap-3 rounded-lg border border-white/25 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:border-white hover:bg-white hover:text-[#0a0f14]"
              >
                Contáctanos

                <MessageCircle size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr] lg:px-10 lg:py-16">
          <div>
            <Link
              href="/"
              aria-label="Ir al inicio de Grupo Rise"
              className="inline-flex rounded-xl bg-white px-4 py-3"
            >
              <Image
                src="/brand/logo-rise.jpeg"
                alt="Grupo Rise"
                width={190}
                height={58}
                className="h-12 w-auto object-contain"
              />
            </Link>

            <p className="mt-6 max-w-md text-sm font-medium leading-7 text-white/55">
              Grupo automotriz multimarca especializado en autos,
              motocicletas y vehículos recreativos, con presencia en distintas
              ciudades de México.
            </p>

            <div className="mt-6 flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-[#1A2A3A]"
              />

              <p className="text-sm font-bold leading-6 text-white/70">
                Nuevo León · Coahuila · Quintana Roo
              </p>
            </div>
          </div>

          <FooterColumn
            title="Vehículos"
            icon={CarFront}
            links={vehicleLinks}
          />

          <FooterColumn
            title="Grupo Rise"
            icon={Building2}
            links={companyLinks}
          />

          <div>
            <div className="flex items-center gap-3">
              <Wrench size={17} className="text-[#1A2A3A]" />

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Atención
              </h3>
            </div>

            <p className="mt-5 text-sm font-medium leading-7 text-white/55">
              Solicita información, agenda servicio o pide una cotización de
              refacciones desde nuestros formularios.
            </p>

            <div className="mt-6 space-y-3">
              <FooterAction
                href="/servicios"
                label="Agendar servicio"
              />

              <FooterAction
                href="/servicios"
                label="Cotizar refacciones"
              />

              <FooterAction
                href="/sucursales"
                label="Encontrar una agencia"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 py-6 text-xs font-semibold text-white/40 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <p>
            © {currentYear} Grupo Rise. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Sitio informativo y comercial</span>

            <Link
              href="/contacto"
              className="transition hover:text-[#1A2A3A]"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  icon: Icon,
  links,
}: {
  title: string;
  icon: typeof CarFront;
  links: {
    label: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon size={17} className="text-[#1A2A3A]" />

        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
          {title}
        </h3>
      </div>

      <nav className="mt-5 space-y-1">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="group flex items-center justify-between border-b border-white/5 py-3 text-sm font-semibold text-white/55 transition hover:border-[#1A2A3A]/40 hover:text-white"
          >
            {link.label}

            <ArrowRight
              size={14}
              className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#1A2A3A]"
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function FooterAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/65 transition hover:border-[#1A2A3A]/60 hover:bg-[#1A2A3A] hover:text-white"
    >
      {label}

      <ArrowRight
        size={15}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}