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
  Sparkles,
  Wrench,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";

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
};

const thanksContent: Record<string, ThanksContent> = {
  servicio: {
    eyebrow: "Solicitud de servicio recibida",
    title: "Tu solicitud de servicio fue enviada",
    description:
      "Un asesor de Grupo Rise revisará la información y se pondrá en contacto contigo para coordinar el seguimiento.",
    icon: Wrench,
  },

  refacciones: {
    eyebrow: "Cotización de refacciones recibida",
    title: "Tu solicitud de refacciones fue enviada",
    description:
      "Nuestro equipo revisará la disponibilidad, precio y características de las piezas solicitadas.",
    icon: PackageSearch,
  },

  cotizacion: {
    eyebrow: "Cotización recibida",
    title: "Tu solicitud de cotización fue enviada",
    description:
      "Un asesor de Grupo Rise se pondrá en contacto contigo para compartir precio, disponibilidad y opciones.",
    icon: Car,
  },

  prueba: {
    eyebrow: "Prueba de manejo recibida",
    title: "Tu solicitud de prueba fue enviada",
    description:
      "Un asesor verificará la disponibilidad de la unidad y se comunicará contigo para confirmar la fecha y el horario.",
    icon: BadgeCheck,
  },

  contacto: {
    eyebrow: "Solicitud recibida",
    title: "Tu mensaje fue enviado",
    description:
      "Gracias por contactar a Grupo Rise. Nuestro equipo revisará tu mensaje y dará seguimiento a tu solicitud.",
    icon: MessageSquare,
  },

  cita: {
    eyebrow: "Cita recibida",
    title: "Tu solicitud de cita fue enviada",
    description:
      "Un asesor revisará la información y se pondrá en contacto contigo para confirmar los detalles de la cita.",
    icon: BadgeCheck,
  },

  financiamiento: {
    eyebrow: "Solicitud de financiamiento recibida",
    title: "Tu solicitud de financiamiento fue enviada",
    description:
      "Un asesor de Grupo Rise revisará tus datos y se pondrá en contacto contigo para explicarte las opciones disponibles.",
    icon: ShieldCheck,
  },
};

function getThanksContent(type?: string) {
  if (!type) {
    return thanksContent.contacto;
  }

  return thanksContent[type] ?? thanksContent.contacto;
}

export default async function ThanksPage({
  searchParams,
}: ThanksPageProps) {
  const params = await searchParams;
  const content = getThanksContent(params.tipo);
  const Icon = content.icon;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        {/* Confirmación principal */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_30%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <Container>
            <div className="relative py-14 text-center md:py-18 lg:py-20">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-[#dfe7ec] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <CheckCircle2 size={42} strokeWidth={2} />
              </div>

              <div className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm">
                <Sparkles size={15} />
                {content.eyebrow}
              </div>

              <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                {content.title}
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                {content.description}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/catalogo"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  Ver catálogo

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/inventario"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Ver seminuevos

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Próximos pasos */}
        <section className="py-10 md:py-12 lg:py-14">
          <Container>
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-[#192a3a]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                    Próximos pasos
                  </p>

                  <span className="h-px w-8 bg-[#192a3a]" />
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  ¿Qué sucederá ahora?
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Tu solicitud quedó registrada. El equipo correspondiente
                  revisará la información para continuar con el seguimiento.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <ProcessCard
                  number="01"
                  icon={Icon}
                  title="Solicitud registrada"
                  description="Los datos fueron enviados correctamente y ya están disponibles para el equipo de Grupo Rise."
                />

                <ProcessCard
                  number="02"
                  icon={MessageSquare}
                  title="Revisión por un asesor"
                  description="Un asesor revisará la solicitud, la unidad o el servicio seleccionado antes de contactarte."
                />

                <ProcessCard
                  number="03"
                  icon={Clock3}
                  title="Contacto y seguimiento"
                  description="Recibirás seguimiento por teléfono, WhatsApp o correo según los datos proporcionados."
                />
              </div>

              {/* Acciones */}
              <section className="mt-8 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                        <Building2 size={22} />
                      </span>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                          Grupo Rise
                        </p>

                        <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                          Continúa explorando nuestro sitio
                        </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          Puedes conocer las agencias, consultar más unidades o
                          realizar una nueva solicitud de servicio.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 bg-[#f8fafb] p-6 sm:grid-cols-3 lg:min-w-[420px] lg:grid-cols-1 lg:border-l lg:border-t-0">
                    <NavigationAction
                      href="/"
                      icon={Home}
                      label="Ir al inicio"
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
              </section>

              <p className="mt-7 text-center text-xs font-semibold leading-6 text-slate-400">
                No es necesario enviar nuevamente la misma solicitud. El equipo
                de Grupo Rise dará seguimiento con la información registrada.
              </p>
            </div>
          </Container>
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
    <article className="group relative overflow-hidden rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] active:border-[#192a3a]/35 md:p-6">
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a] transition group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <Icon size={21} />
        </span>

        <span className="text-3xl font-black tracking-[-0.05em] text-slate-100">
          {number}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#192a3a] transition-all duration-500 group-hover:w-full group-active:w-full" />
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
      className={`group inline-flex h-12 items-center justify-between gap-3 rounded-xl border px-4 text-sm font-black transition active:scale-[0.98] ${primary
          ? "border-[#192a3a] bg-[#192a3a] text-white hover:bg-[#29465c]"
          : "border-slate-200 bg-white text-[#192a3a] hover:border-[#192a3a] hover:bg-[#e7edf1]"
        }`}
    >
      <span className="inline-flex items-center gap-3">
        <Icon size={17} />
        {label}
      </span>

      <ArrowRight
        size={16}
        className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
      />
    </Link>
  );
}