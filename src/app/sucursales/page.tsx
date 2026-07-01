import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import { VehicleCondition, VehicleStatus } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(phone?: string | null, message?: string) {
  const phoneNumber = cleanPhone(phone);

  if (!phoneNumber) {
    return "";
  }

  const finalPhone = phoneNumber.startsWith("52")
    ? phoneNumber
    : `52${phoneNumber}`;

  const text = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function splitServices(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBranchLocationText(branch: {
  address: string;
  city: string;
  state: string;
}) {
  return `${branch.address}, ${branch.city}, ${branch.state}`;
}

function getMapEmbedUrl(branch: {
  address: string;
  city: string;
  state: string;
  googleMapsUrl?: string | null;
}) {
  const googleMapsUrl = branch.googleMapsUrl?.trim();

  if (googleMapsUrl?.includes("/embed")) {
    return googleMapsUrl;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(
    getBranchLocationText(branch)
  )}&output=embed`;
}

function getMapExternalUrl(branch: {
  address: string;
  city: string;
  state: string;
  googleMapsUrl?: string | null;
}) {
  if (branch.googleMapsUrl?.trim()) {
    return branch.googleMapsUrl;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getBranchLocationText(branch)
  )}`;
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
          status: VehicleStatus.DISPONIBLE,
          brand: {
            active: true,
          },
        },
        select: {
          id: true,
          condition: true,
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

  const totalVehicles = branches.reduce(
    (total, branch) => total + branch.vehicles.length,
    0
  );

  const totalNewVehicles = branches.reduce(
    (total, branch) =>
      total +
      branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.NUEVO
      ).length,
    0
  );

  const totalUsedVehicles = branches.reduce(
    (total, branch) =>
      total +
      branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.SEMINUEVO
      ).length,
    0
  );

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

        <Container>
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
              <Sparkles size={16} />
              Sucursales Grupo Rise
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
              Encuentra tu agencia más cercana
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
              Consulta ubicaciones, horarios, contacto directo e inventario
              disponible por sucursal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-blue-50"
              >
                Ver catálogo nuevo
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

          <div className="relative mt-10 grid gap-4 md:grid-cols-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Building2 size={24} className="text-blue-100" />
              <p className="mt-4 text-4xl font-black">{branches.length}</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Agencias activas
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <MapPin size={24} className="text-blue-100" />
              <p className="mt-4 text-4xl font-black">{cities.length}</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Ciudades
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Car size={24} className="text-blue-100" />
              <p className="mt-4 text-4xl font-black">{totalNewVehicles}</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Nuevos disponibles
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Tags size={24} className="text-blue-100" />
              <p className="mt-4 text-4xl font-black">{totalUsedVehicles}</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Seminuevos disponibles
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative z-10 -mt-10 px-4 pb-16 md:-mt-14 md:pb-20">
        <Container>
          <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Directorio
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  Agencias disponibles
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Selecciona una sucursal para contactar por WhatsApp, consultar
                  ubicación o revisar el inventario disponible.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                <BadgeCheck size={17} />
                {totalVehicles} unidad(es) disponibles
              </div>
            </div>

            {branches.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {branches.map((branch) => {
                  const services = splitServices(branch.services);
                  const mapEmbedUrl = getMapEmbedUrl(branch);
                  const mapExternalUrl = getMapExternalUrl(branch);

                  const whatsappHref = getWhatsAppHref(
                    branch.whatsapp,
                    `Hola, me gustaría recibir información de ${branch.name}.`
                  );

                  const phone = cleanPhone(branch.phone);

                  const newVehicles = branch.vehicles.filter(
                    (vehicle) => vehicle.condition === VehicleCondition.NUEVO
                  ).length;

                  const usedVehicles = branch.vehicles.filter(
                    (vehicle) =>
                      vehicle.condition === VehicleCondition.SEMINUEVO
                  ).length;

                  return (
                    <article
                      key={branch.id}
                      className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                    >
                      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="p-5 md:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                                {branch.city}, {branch.state}
                              </span>

                              <h3 className="mt-4 text-2xl font-black leading-tight md:text-3xl">
                                {branch.name}
                              </h3>
                            </div>

                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                              <Building2 size={24} />
                            </div>
                          </div>

                          <div className="mt-6 grid gap-4 text-sm text-slate-600">
                            <div className="flex gap-3">
                              <MapPin
                                size={18}
                                className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                              />
                              <span className="leading-6">
                                {branch.address}
                              </span>
                            </div>

                            {branch.phone && phone && (
                              <div className="flex gap-3">
                                <Phone
                                  size={18}
                                  className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                                />
                                <a
                                  href={`tel:${phone}`}
                                  className="font-bold hover:text-[var(--rise-blue)]"
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
                                  className="font-bold hover:text-[var(--rise-blue)]"
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
                                <span className="leading-6">
                                  {branch.schedule}
                                </span>
                              </div>
                            )}
                          </div>

                          {services.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                              {services.map((service) => (
                                <span
                                  key={service}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600"
                                >
                                  <ShieldCheck size={13} />
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-6 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Total
                              </p>

                              <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
                                {branch.vehicles.length}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Nuevos
                              </p>

                              <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
                                {newVehicles}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Seminuevos
                              </p>

                              <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
                                {usedVehicles}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <a
                              href={mapExternalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                            >
                              <MapPin size={18} />
                              Ver ubicación
                            </a>

                            {whatsappHref && (
                              <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                              >
                                <MessageCircle size={18} />
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="min-h-[320px] overflow-hidden border-t border-slate-100 bg-slate-100 xl:border-l xl:border-t-0">
                          <iframe
                            src={mapEmbedUrl}
                            title={`Mapa de ${branch.name}`}
                            className="h-full min-h-[320px] w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Building2 size={50} className="mx-auto text-slate-400" />

                <h3 className="mt-4 text-2xl font-black">
                  No hay sucursales activas
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                  Activa sucursales desde el panel administrativo para
                  mostrarlas en esta página.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}