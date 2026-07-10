import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Headphones,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/forms/LeadForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
    },
  });

  const citiesCount = new Set(
    branches.map((branch) => branch.city)
  ).size;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        {/* Encabezado */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_30%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <Container>
            <div className="relative py-12 lg:py-16">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm">
                  <Sparkles size={15} />
                  Atención Grupo Rise
                </div>

                <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                  Estamos listos para ayudarte
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                  Envíanos tus datos y cuéntanos qué necesitas. Un asesor de
                  Grupo Rise revisará tu solicitud y se pondrá en contacto
                  contigo.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Contenido */}
        <section className="py-10 md:py-12 lg:py-14">
          <Container>
            <div className="grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
              {/* Información lateral */}
              <aside className="space-y-5 xl:sticky xl:top-[120px]">
                <section className="rounded-[22px] border border-black/8 bg-[#192a3a] p-6 text-white shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#dfe7ec]">
                    <Headphones size={22} />
                  </span>

                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec]">
                    Atención personalizada
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                    Cuéntanos cómo podemos ayudarte
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Puedes solicitar información de vehículos, financiamiento,
                    disponibilidad, citas o atención general.
                  </p>

                  <div className="mt-6 grid gap-3">
                    <ContactFeature
                      icon={MessageCircle}
                      title="Seguimiento directo"
                      description="Un asesor revisará tu mensaje."
                    />

                    <ContactFeature
                      icon={Building2}
                      title="Sucursal seleccionada"
                      description="Tu solicitud llegará a la agencia indicada."
                    />

                    <ContactFeature
                      icon={ShieldCheck}
                      title="Información protegida"
                      description="Tus datos se utilizan para atender la solicitud."
                    />
                  </div>
                </section>

                <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                      <MapPin size={18} />
                    </span>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Atención presencial
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        Encuentra una agencia
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Consulta direcciones, teléfonos, WhatsApp y horarios de
                    nuestras sucursales.
                  </p>

                  <Link
                    href="/sucursales"
                    className="group mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                  >
                    Ver sucursales

                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </Link>
                </section>
              </aside>

              {/* Formulario */}
              <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-7 lg:p-8">
                <div className="mb-7">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[#192a3a]" />

                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                      Formulario de contacto
                    </p>
                  </div>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                    Envíanos un mensaje
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Completa tus datos, selecciona una sucursal y describe el
                    motivo de tu solicitud.
                  </p>
                </div>

                <LeadForm
                  type="CONTACTO"
                  title=""
                  description=""
                  branches={branches}
                  variant="plain"
                />
              </section>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ContactMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <span className="text-sm font-black text-white">
        {value}
      </span>

      <span className="text-[10px] font-black uppercase tracking-[0.13em] text-white/55">
        {label}
      </span>
    </div>
  );
}

function ContactFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof MessageCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-[#dfe7ec]">
        <Icon size={17} />
      </span>

      <div>
        <p className="text-sm font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/50">
          {description}
        </p>
      </div>
    </div>
  );
}