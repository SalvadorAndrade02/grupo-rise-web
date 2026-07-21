import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Headphones,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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

      <main className="public-home">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%)]" />

          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

          <div className="public-container relative grid min-h-[480px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[var(--public-accent)]" />

                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">
                  Atención Grupo RISE
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                Estamos listos
                <span className="block text-white/55">
                  para ayudarte.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
                Comparte tus datos y cuéntanos qué necesitas.
                Un asesor revisará tu solicitud y dará seguimiento
                desde la agencia seleccionada.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#formulario-contacto"
                  className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  Enviar mensaje

                  <ArrowRight
                    size={17}
                    className="text-white transition-transform group-hover:translate-x-0.5"
                  />
                </a>

                <Link
                  href="/sucursales"
                  className="inline-flex h-12 items-center justify-center border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[var(--public-header)]"
                >
                  Ver sucursales
                </Link>
              </div>
            </div>

            <div className="grid gap-px border border-white/10 bg-white/10">
              {[
                {
                  value: String(branches.length),
                  label: "Agencias activas",
                },
                {
                  value: String(citiesCount),
                  label: "Ciudades disponibles",
                },
                {
                  value: "Directa",
                  label: "Atención personalizada",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid min-h-[105px] grid-cols-[100px_1fr] items-center border-b border-white/10 bg-[var(--public-header)] px-6 last:border-b-0"
                >
                  <p className="text-xs font-black uppercase tracking-[0.17em] text-white">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Introducción */}
        <section className="border-b border-[var(--home-border)] bg-[var(--home-background)]">
          <div className="public-container py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="public-eyebrow">
                  Canal de atención
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                  Hablemos de lo que necesitas.
                </h2>
              </div>

              <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                <p className="max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                  Utiliza este formulario para solicitar información,
                  atención general, financiamiento, disponibilidad o
                  seguimiento con una de nuestras agencias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contenido */}
        <section className="bg-[var(--home-surface)]">
          <div className="public-container py-14 md:py-20">
            <div className="grid gap-8 xl:grid-cols-[370px_minmax(0,1fr)] xl:items-start">
              {/* Información lateral */}
              <aside className="space-y-6 xl:sticky xl:top-[120px]">
                <section className="border border-white/10 bg-[var(--public-accent)] p-6 text-white shadow-[0_18px_45px_rgba(18,24,28,0.12)] md:p-7">
                  <span className="grid h-[52px] w-[52px] place-items-center border border-white/15 text-white]">
                    <Headphones size={23} />
                  </span>

                  <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-white/45">
                    Atención personalizada
                  </p>

                  <h2 className="mt-3 text-3xl font-black leading-[1] tracking-[-0.04em] text-white">
                    Cuéntanos cómo podemos ayudarte
                  </h2>

                  <p className="mt-5 text-sm leading-7 text-white">
                    Selecciona una agencia y describe el motivo
                    de tu solicitud para que el equipo correspondiente
                    pueda darle seguimiento.
                  </p>

                  <div className="mt-7 grid gap-px border border-white bg-[var(--public-accent)]">
                    <ContactFeature 
                      icon={MessageCircle} text-white
                      title="Seguimiento directo"
                      description="Un asesor revisará el mensaje enviado."
                    />

                    <ContactFeature
                      icon={Building2}
                      title="Agencia seleccionada"
                      description="La solicitud puede vincularse con una sucursal."
                    />

                    <ContactFeature
                      icon={ShieldCheck}
                      title="Datos de contacto"
                      description="Se utilizarán para atender tu solicitud."
                    />
                  </div>
                </section>

                <section className="border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_10px_28px_rgba(18,24,28,0.05)]">
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 place-items-center border border-[var(--public-header)] bg-[var(--public-header)] text-white">
                      <MapPin size={19} />
                    </span>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                        Atención presencial
                      </p>

                      <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--public-ink)]">
                        Encuentra una agencia
                      </h3>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-[var(--public-muted)]">
                    Consulta direcciones, teléfonos, WhatsApp,
                    horarios y ubicación de nuestras sucursales.
                  </p>

                  <Link
                    href="/sucursales"
                    className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-5 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                  >
                    Ver sucursales

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </section>
              </aside>

              {/* Formulario */}
              <section
                id="formulario-contacto"
                className="scroll-mt-[125px] border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8 lg:p-10"
              >
                <div className="mb-8 border-b border-[var(--home-border)] pb-8">
                  <div className="flex items-center gap-4">
                    <span className="h-px w-10 bg-[var(--public-accent)]" />

                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
                      Formulario de contacto
                    </p>
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                    Envíanos un mensaje
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                    Completa tus datos, selecciona una agencia
                    y describe el motivo de tu solicitud.
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
          </div>
        </section>
      </main>

      <Footer />
    </>
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
    <div className="flex min-h-[105px] items-start gap-4 bg-[var(--public-header)] p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/20 bg-white/10 text-white">
        <Icon size={18} />
      </span>

      <div>
        <p className="text-sm font-black text-white">
          {title}
        </p>

        <p className="mt-2 text-xs leading-5 text-white/45">
          {description}
        </p>
      </div>
    </div>
  );
}