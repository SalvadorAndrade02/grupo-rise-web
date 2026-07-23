import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CarFront,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { MexicoPresenceMap } from "@/components/layout/MexicoPresenceMap";

const exploreLinks = [
  {
    label: "Explorar marcas",
    href: "/catalogo",
  },
  {
    label: "Certificados RISE",
    href: "/certificados-rise",
  },
  {
    label: "Sucursales",
    href: "/sucursales",
  },
  {
    label: "Servicios",
    href: "/servicios",
  },
  {
    label: "Contacto",
    href: "/contacto",
  },
];

const brandLinks = [
  {
    label: "ZEEKR",
    href: "/catalogo/zeekrlife",
  },
  {
    label: "Lynk & Co",
    href: "/catalogo/lynk-co",
  },
  {
    label: "Indian Motorcycle",
    href: "/catalogo/indian-motorcycle",
  },
  {
    label: "Triumph",
    href: "/catalogo/triumph-motorcycles",
  },
  {
    label: "Royal Enfield",
    href: "/catalogo/royal-enfield",
  },
  {
    label: "Can-Am",
    href: "/catalogo/can-am",
  },
  {
    label: "Polaris",
    href: "/catalogo/polaris",
  },
  {
    label: "Sea-Doo",
    href: "/catalogo/sea-doo",
  },
];

const attentionLinks = [
  {
    label: "Solicitar servicio",
    href: "/servicios#servicio",
  },
  {
    label: "Cotizar refacciones",
    href: "/servicios#refacciones",
  },
  {
    label: "Encontrar una agencia",
    href: "/sucursales",
  },
  {
    label: "Contactar a un asesor",
    href: "/contacto",
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#090d12] text-white">
      {/* Llamada principal */}
      <section className="border-b border-white/10">
        <div className="public-container py-14 md:py-16">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[var(--public-accent)]" />

                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">
                  Atención Grupo RISE
                </p>
              </div>

              <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white md:text-5xl lg:text-6xl">
                Encuentra el vehículo
                <span className="block text-white/45">
                  para tu siguiente camino.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
                Explora nuestras marcas o solicita atención para conocer
                unidades, servicios, refacciones y agencias.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
              >
                Explorar marcas

                <ArrowRight
                  size={17}
                  className="text-white transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/contacto"
                className="group inline-flex h-12 items-center justify-center gap-3 border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[#090d12]"
              >
                Contactar asesor

                <MessageCircle size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación principal */}
      <section>
        <div className="public-container grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_0.85fr_1fr_1fr] lg:py-18">
          {/* Identidad */}
          <div>
            <Link
              href="/"
              aria-label="Ir al inicio de Grupo RISE"
              className="inline-flex"
            >
              <Image
                src="/brand/logo-rise.png"
                alt="Grupo RISE"
                width={210}
                height={65}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="mt-7 max-w-md text-sm leading-7 text-white">
              Grupo automotriz multimarca con opciones de autos,
              motocicletas y vehículos de aventura.
            </p>

            <MexicoPresenceMap />
          </div>

          {/* Explorar */}
          <FooterColumn
            title="Explorar"
            icon={CarFront}
            links={exploreLinks}
          />

          {/* Marcas */}
          <FooterColumn
            title="Marcas"
            icon={ShieldCheck}
            links={brandLinks}
            compact
          />

          {/* Atención */}
          <div>
            <FooterHeading
              title="Atención"
              icon={Wrench}
            />

            <p className="mt-6 text-sm leading-7 text-white/50">
              Envía una solicitud para recibir información o seguimiento
              por parte de una de nuestras agencias.
            </p>

            <nav
              aria-label="Opciones de atención"
              className="mt-6 grid gap-px border border-white/10 bg-white/10"
            >
              {attentionLinks.map((link) => (
                <FooterAction
                  key={link.href}
                  href={link.href}
                  label={link.label}
                />
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Franja inferior */}
      <section className="border-t border-white/10">
        <div className="public-container flex flex-col gap-5 py-6 text-xs font-semibold text-white/35 md:flex-row md:items-center md:justify-between">
          <p>
            © {currentYear} Grupo RISE. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span>Sitio informativo y comercial</span>

            <Link
              href="/sucursales"
              className="transition hover:text-white"
            >
              Sucursales
            </Link>

            <Link
              href="/servicios"
              className="transition hover:text-white"
            >
              Servicios
            </Link>

            <Link
              href="/contacto"
              className="transition hover:text-white"
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
  icon,
  links,
  compact = false,
}: {
  title: string;
  icon: LucideIcon;
  links: {
    label: string;
    href: string;
  }[];
  compact?: boolean;
}) {
  return (
    <div>
      <FooterHeading
        title={title}
        icon={icon}
      />

      <nav
        aria-label={title}
        className={`mt-6 ${compact
          ? "grid grid-cols-2 gap-x-5"
          : "grid"
          }`}
      >
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="group flex min-h-[45px] items-center justify-between gap-3 border-b border-white/[0.07] py-3 text-sm font-semibold text-white/50 transition hover:border-white/25 hover:text-white"
          >
            <span>{link.label}</span>

            <ArrowRight
              size={14}
              className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white"
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function FooterHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/[0.05] text-white">
        <Icon size={18} />
      </span>

      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
        {title}
      </h3>
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
      className="group flex min-h-[52px] items-center justify-between gap-4 bg-[#090d12] px-4 text-sm font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
    >
      {label}

      <ArrowRight
        size={15}
        className="shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
      />
    </Link>
  );
}