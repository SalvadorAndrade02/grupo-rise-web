import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function splitServices(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function BranchesPage() {
  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },
    include: {
      vehicles: {
        where: {
          active: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
  });

  const cities = Array.from(new Set(branches.map((branch) => branch.city)));

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="bg-[var(--rise-navy)] py-14 text-white md:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Sucursales Grupo Rise
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              Encuentra tu agencia más cercana.
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">
              Consulta nuestras ubicaciones disponibles para autos, motos, todo
              terreno, ventas, servicio y atención personalizada.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <Building2 className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Agencias activas
              </p>
              <p className="mt-1 text-3xl font-black">{branches.length}</p>
            </div>

            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <MapPin className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Ciudades
              </p>
              <p className="mt-1 text-3xl font-black">{cities.length}</p>
            </div>

            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <ArrowRight className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Inventario relacionado
              </p>
              <p className="mt-1 text-3xl font-black">
                {branches.reduce(
                  (total, branch) => total + branch.vehicles.length,
                  0
                )}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Directorio
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Agencias disponibles
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Información de contacto y ubicación registrada desde el módulo
                administrativo.
              </p>
            </div>

            <Link
              href="/inventario"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              Conocer Vehiculos
              <ArrowRight size={18} />
            </Link>
          </div>

          {branches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => {
                const services = splitServices(branch.services);
                const whatsapp = cleanPhone(branch.whatsapp);

                return (
                  <article
                    key={branch.id}
                    className="flex flex-col rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                          {branch.city}, {branch.state}
                        </span>

                        <h3 className="mt-4 text-2xl font-black leading-tight">
                          {branch.name}
                        </h3>
                      </div>

                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                        <Building2 size={24} />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                      <div className="flex gap-3">
                        <MapPin
                          size={18}
                          className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                        />
                        <span className="leading-6">{branch.address}</span>
                      </div>

                      {branch.phone && (
                        <div className="flex gap-3">
                          <Phone
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                          />
                          <a
                            href={`tel:${cleanPhone(branch.phone)}`}
                            className="font-semibold hover:text-[var(--rise-blue)]"
                          >
                            {branch.phone}
                          </a>
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex gap-3">
                          <Mail
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                          />
                          <a
                            href={`mailto:${branch.email}`}
                            className="font-semibold hover:text-[var(--rise-blue)]"
                          >
                            {branch.email}
                          </a>
                        </div>
                      )}

                      {branch.schedule && (
                        <div className="flex gap-3">
                          <Clock
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                          />
                          <span className="leading-6">{branch.schedule}</span>
                        </div>
                      )}
                    </div>

                    {services.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {services.map((service) => (
                          <span
                            key={service}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-black text-[var(--rise-navy)]">
                        Inventario en esta sucursal
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {branch.vehicles.length} unidad(es) registrada(s)
                      </p>
                    </div>

                    <div className="mt-auto grid gap-3 pt-6">
                      {branch.googleMapsUrl && (
                        <a
                          href={branch.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                        >
                          <MapPin size={18} />
                          Ver ubicación
                        </a>
                      )}

                      {whatsapp && (
                        <a
                          href={`https://wa.me/52${whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                        >
                          <MessageCircle size={18} />
                          Contactar por WhatsApp
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-black">
                No hay sucursales activas
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                Activa sucursales desde el panel administrativo para mostrarlas
                en esta página.
              </p>
            </div>
          )}
        </Container>
      </section>

      <Footer />
    </main>
  );
}