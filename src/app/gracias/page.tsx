import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Clock3,
  Home,
  MessageSquare,
  PackageSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

type ThanksPageProps = {
  searchParams: Promise<{
    tipo?: string;
  }>;
};

type ThanksContent = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryHref: string;
  primaryLabel: string;
};

const thanksContent: Record<string, ThanksContent> = {
  servicio: {
    eyebrow: "Solicitud de servicio recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "El equipo de la agencia seleccionada podrá revisar la información y ponerse en contacto contigo para continuar con el seguimiento.",
    icon: Wrench,
    primaryHref: "/servicios",
    primaryLabel: "Ver servicios",
  },

  refacciones: {
    eyebrow: "Cotización de refacciones recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "El equipo podrá revisar la pieza solicitada, la información de tu unidad y los datos que proporcionaste.",
    icon: PackageSearch,
    primaryHref: "/servicios",
    primaryLabel: "Ver servicios",
  },

  cotizacion: {
    eyebrow: "Cotización recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "Un asesor podrá consultar la información de la unidad seleccionada y comunicarse contigo para darle seguimiento.",
    icon: Car,
    primaryHref: "/catalogo",
    primaryLabel: "Explorar marcas",
  },

  prueba: {
    eyebrow: "Prueba de manejo recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "La agencia podrá revisar la disponibilidad de la unidad y los datos de fecha y horario que proporcionaste.",
    icon: BadgeCheck,
    primaryHref: "/catalogo",
    primaryLabel: "Explorar marcas",
  },

  contacto: {
    eyebrow: "Mensaje recibido",
    title: "Tu mensaje fue enviado correctamente",
    description:
      "El equipo podrá revisar tu solicitud y utilizar los datos proporcionados para ponerse en contacto contigo.",
    icon: MessageSquare,
    primaryHref: "/sucursales",
    primaryLabel: "Ver sucursales",
  },

  cita: {
    eyebrow: "Solicitud de cita recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "La agencia podrá revisar la información y ponerse en contacto contigo para confirmar los detalles de la cita.",
    icon: BadgeCheck,
    primaryHref: "/sucursales",
    primaryLabel: "Ver sucursales",
  },

  financiamiento: {
    eyebrow: "Solicitud de financiamiento recibida",
    title: "Tu solicitud fue registrada correctamente",
    description:
      "Un asesor podrá revisar tus datos y comunicarse contigo para explicarte las opciones disponibles.",
    icon: ShieldCheck,
    primaryHref: "/catalogo",
    primaryLabel: "Explorar marcas",
  },
};

function getThanksContent(type?: string) {
  if (!type) {
    return thanksContent.contacto;
  }

  return (
    thanksContent[type.toLowerCase()] ??
    thanksContent.contacto
  );
}

export default async function ThanksPage({
  searchParams,
}: ThanksPageProps) {
  const params = await searchParams;
  const content = getThanksContent(params.tipo);
  const RequestIcon = content.icon;

  return (
    <>
      <Header />

      <main className="public-home">
        {/* Confirmación principal */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%)]" />

          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

          <div className="public-container relative grid min-h-[560px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[var(--public-accent)]" />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                  {content.eyebrow}
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                Solicitud
                <span className="block text-white">
                  confirmada.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white md:text-lg">
                {content.description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={content.primaryHref}
                  className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  {content.primaryLabel}

                  <ArrowRight
                    size={17}
                    className="text-white transition-transform group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center gap-3 border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[var(--public-header)]"
                >
                  <Home size={17} />
                  Volver al inicio
                </Link>
              </div>
            </div>

            {/* Confirmación visual */}
            <div className="border border-white/15 bg-black/20 p-7 backdrop-blur-sm md:p-9">
              <div className="flex items-center justify-between border-b border-white/10 pb-7">
                <span className="grid h-16 w-16 place-items-center border border-white/20 bg-white/10 text-white">
                  <CheckCircle2
                    size={32}
                    strokeWidth={2}
                  />
                </span>

                <span className="text-5xl font-black tracking-[-0.06em] text-white/10">
                  01
                </span>
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-white">
                Estado de la solicitud
              </p>

              <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-white">
                Registrada
              </p>

              <div className="mt-7 flex items-start gap-4 border-t border-white/10 pt-7">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-white/20 bg-white/10 text-white">
                  <RequestIcon size={20} />
                </span>

                <div>
                  <p className="text-sm font-black text-white">
                    {content.title}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white">
                    No necesitas enviar nuevamente la misma solicitud.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Próximos pasos */}
        <section className="border-b border-[var(--home-border)] bg-[#eef0ee]">
          <div className="public-container py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="public-eyebrow">
                  Próximos pasos
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                  ¿Qué sucederá ahora?
                </h2>
              </div>

              <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                <p className="max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                  La información ya fue registrada. El equipo correspondiente
                  podrá revisarla y continuar con el proceso de atención.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-px border border-[var(--home-border)] bg-[#141924] md:grid-cols-3">
              <ProcessCard
                number="01"
                icon={RequestIcon}
                title="Solicitud registrada"
                description="Los datos proporcionados quedaron disponibles para el equipo correspondiente."
              />

              <ProcessCard
                number="02"
                icon={MessageSquare}
                title="Revisión de información"
                description="Un asesor podrá revisar el motivo, la agencia y los detalles de la solicitud."
              />

              <ProcessCard
                number="03"
                icon={Clock3}
                title="Contacto y seguimiento"
                description="El seguimiento podrá realizarse mediante teléfono, WhatsApp o correo electrónico."
              />
            </div>
          </div>
        </section>

        {/* Navegación */}
        <section className="bg-[var(--home-card)]">
          <div className="public-container py-14 md:py-20">
            <div className="grid border border-[var(--home-border)] lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="p-7 md:p-10">
                <div className="flex items-center gap-4">
                  <span className="grid h-[52px] w-[52px] shrink-0 place-items-center bg-[var(--public-header)] text-white">
                    <Building2 size={23} />
                  </span>

                  <div className="h-px flex-1 bg-[var(--home-border)]" />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                  Grupo RISE
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                  Continúa explorando nuestro sitio
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                  Consulta las marcas, conoce nuestras agencias o envía
                  una nueva solicitud de servicio cuando lo necesites.
                </p>
              </div>

              <div className="grid gap-px border-t border-[var(--home-border)] bg-[var(--home-border)] lg:border-l lg:border-t-0">
                <NavigationAction
                  href="/"
                  icon={Home}
                  label="Ir al inicio"
                />

                <NavigationAction
                  href="/catalogo"
                  icon={Car}
                  label="Explorar marcas"
                />

                <NavigationAction
                  href="/servicios"
                  icon={Wrench}
                  label="Ver servicios"
                />

                <NavigationAction
                  href="/sucursales"
                  icon={Building2}
                  label="Ver sucursales"
                  primary
                />
              </div>
            </div>

            <p className="mt-7 text-center text-xs font-semibold leading-6 text-[var(--public-muted)]">
              No es necesario enviar nuevamente la misma solicitud.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ProcessCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="group relative min-h-[260px] bg-[var(--home-card)] p-6 transition hover:bg-[var(--home-card-hover)] md:p-8">
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center bg-[var(--public-header)] text-white">
          <Icon size={21} />
        </span>

        <span className="text-4xl font-black tracking-[-0.06em] text-black/[0.07]">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-xl font-black tracking-[-0.025em] text-[var(--public-ink)]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">
        {description}
      </p>

      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}

function NavigationAction({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-[76px] items-center justify-between gap-4 px-6 text-sm font-black transition ${primary
          ? "bg-[var(--public-header)] !text-white hover:bg-[var(--public-accent-dark)]"
          : "bg-[#eef0ee] text-[var(--public-ink)] hover:bg-[var(--home-card)]"
        }`}
    >
      <span className="inline-flex items-center gap-4">
        <span
          className={`grid h-10 w-10 place-items-center ${primary
              ? "border border-white/20 bg-white/10 text-white"
              : "bg-[var(--public-header)] text-white"
            }`}
        >
          <Icon size={17} />
        </span>

        {label}
      </span>

      <ArrowRight
        size={17}
        className={`transition-transform group-hover:translate-x-0.5 ${primary ? "text-white" : ""
          }`}
      />
    </Link>
  );
}