import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Home,
  MessageSquare,
  PackageSearch,
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

const thanksContent = {
  servicio: {
    eyebrow: "Solicitud de servicio recibida",
    title: "Tu solicitud de servicio fue enviada",
    description:
      "Un asesor de Grupo Rise revisará tu solicitud y se pondrá en contacto contigo para dar seguimiento.",
    icon: Wrench,
  },
  refacciones: {
    eyebrow: "Cotización de refacciones recibida",
    title: "Tu cotización de refacciones fue enviada",
    description:
      "El equipo de Grupo Rise revisará disponibilidad, precio y detalles de las piezas solicitadas.",
    icon: PackageSearch,
  },
  cotizacion: {
    eyebrow: "Cotización recibida",
    title: "Tu solicitud de cotización fue enviada",
    description:
      "Un asesor de Grupo Rise se pondrá en contacto contigo para compartir más información.",
    icon: Car,
  },
  prueba: {
    eyebrow: "Prueba de manejo recibida",
    title: "Tu solicitud de prueba fue enviada",
    description:
      "Un asesor de Grupo Rise te contactará para confirmar disponibilidad y horario.",
    icon: BadgeCheck,
  },
  contacto: {
    eyebrow: "Solicitud recibida",
    title: "Tu mensaje fue enviado",
    description:
      "Gracias por contactar a Grupo Rise. Un asesor dará seguimiento a tu solicitud.",
    icon: MessageSquare,
  },
  cita: {
    eyebrow: "Cita recibida",
    title: "Tu solicitud de cita fue enviada",
    description:
      "Un asesor de Grupo Rise revisará tu solicitud y te contactará para confirmar los detalles de la cita.",
    icon: BadgeCheck,
  },
  financiamiento: {
    eyebrow: "Solicitud de financiamiento recibida",
    title: "Tu solicitud de financiamiento fue enviada",
    description:
      "Un asesor de Grupo Rise revisará tus datos y se pondrá en contacto contigo para dar seguimiento.",
    icon: BadgeCheck,
  },
};

function getThanksContent(type?: string) {
  if (type === "servicio") return thanksContent.servicio;
  if (type === "refacciones") return thanksContent.refacciones;
  if (type === "cotizacion") return thanksContent.cotizacion;
  if (type === "prueba") return thanksContent.prueba;
  if (type === "contacto") return thanksContent.contacto;
  if (type === "cita") return thanksContent.cita;
  if (type === "financiamiento") return thanksContent.financiamiento;

  return thanksContent.contacto;
}

export default async function ThanksPage({ searchParams }: ThanksPageProps) {
  const params = await searchParams;
  const content = getThanksContent(params.tipo);
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

        <Container>
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] border border-white/15 bg-white/10 text-blue-100 backdrop-blur">
              <CheckCircle2 size={42} />
            </div>

            <p className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
              <Sparkles size={16} />
              {content.eyebrow}
            </p>

            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
              {content.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
              {content.description}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-blue-50"
              >
                Ver catálogo
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/inventario"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"
              >
                Ver seminuevos
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative z-10 -mt-10 px-4 pb-16 md:-mt-14 md:pb-20">
        <Container>
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-8">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-slate-50 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Icon size={24} />
                </div>

                <h2 className="mt-4 text-lg font-black">
                  Solicitud registrada
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tus datos fueron enviados correctamente al equipo comercial.
                </p>
              </div>

              <div className="rounded-[2rem] bg-slate-50 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <MessageSquare size={24} />
                </div>

                <h2 className="mt-4 text-lg font-black">
                  Seguimiento por asesor
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Un asesor revisará la información y te contactará por teléfono
                  o WhatsApp.
                </p>
              </div>

              <div className="rounded-[2rem] bg-slate-50 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Building2 size={24} />
                </div>

                <h2 className="mt-4 text-lg font-black">
                  Atención en sucursal
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Puedes consultar nuestras sucursales para ubicar la agencia
                  más cercana.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                <Home size={17} />
                Ir al inicio
              </Link>

              <Link
                href="/servicios"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                Servicios
              </Link>

              <Link
                href="/sucursales"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                Ver sucursales
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}