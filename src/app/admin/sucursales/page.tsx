import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { VehicleCondition, VehicleStatus } from "@prisma/client";
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

function getBranchIssues(branch: {
  active: boolean;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  schedule: string | null;
  services: string | null;
  googleMapsUrl: string | null;
  vehicles: { id: number }[];
}) {
  const issues: string[] = [];

  if (!branch.address?.trim()) issues.push("Sin dirección");
  if (!branch.phone?.trim()) issues.push("Sin teléfono");
  if (!branch.whatsapp?.trim()) issues.push("Sin WhatsApp");
  if (!branch.email?.trim()) issues.push("Sin correo");
  if (!branch.schedule?.trim()) issues.push("Sin horario");
  if (!branch.services?.trim()) issues.push("Sin servicios");
  if (!branch.googleMapsUrl?.trim()) issues.push("Sin Google Maps");

  if (!branch.active && branch.vehicles.length > 0) {
    issues.push("Inactiva con vehículos disponibles");
  }

  return issues;
}

async function toggleBranchActive(branchId: number) {
  "use server";

  if (!branchId) {
    return;
  }

  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    select: {
      active: true,
    },
  });

  if (!branch) {
    return;
  }

  await prisma.branch.update({
    where: {
      id: branchId,
    },
    data: {
      active: !branch.active,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sucursales");
  revalidatePath("/sucursales");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
}

export default async function AdminBranchesPage() {
  const branches = await prisma.branch.findMany({
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
      leads: {
        select: {
          id: true,
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

  const total = branches.length;
  const active = branches.filter((branch) => branch.active).length;
  const inactive = branches.filter((branch) => !branch.active).length;

  const totalVehicles = branches.reduce(
    (sum, branch) => sum + branch.vehicles.length,
    0
  );

  const totalNewVehicles = branches.reduce(
    (sum, branch) =>
      sum +
      branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.NUEVO
      ).length,
    0
  );

  const totalUsedVehicles = branches.reduce(
    (sum, branch) =>
      sum +
      branch.vehicles.filter(
        (vehicle) => vehicle.condition === VehicleCondition.SEMINUEVO
      ).length,
    0
  );

  const totalLeads = branches.reduce(
    (sum, branch) => sum + branch.leads.length,
    0
  );

  const branchesWithIssues = branches.filter(
    (branch) => getBranchIssues(branch).length > 0
  ).length;

  return (
    <section className="py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Administración
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Sucursales
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Gestiona agencias, ubicaciones, teléfonos, horarios, servicios,
            mapas y disponibilidad pública de Grupo Rise.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/sucursales"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
          >
            Ver público
            <ExternalLink size={17} />
          </Link>

          <Link
            href="/admin/sucursales/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            <Plus size={18} />
            Nueva sucursal
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Building2 className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Total sucursales
          </p>
          <p className="mt-1 text-3xl font-black">{total}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Store className="text-emerald-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Activas</p>
          <p className="mt-1 text-3xl font-black">{active}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <EyeOff className="text-slate-500" />
          <p className="mt-4 text-sm font-bold text-slate-500">Inactivas</p>
          <p className="mt-1 text-3xl font-black">{inactive}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Car className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Vehículos disponibles
          </p>
          <p className="mt-1 text-3xl font-black">{totalVehicles}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <Users className="text-purple-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Leads</p>
          <p className="mt-1 text-3xl font-black">{totalLeads}</p>
        </div>

        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <AlertTriangle className="text-amber-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Requieren atención
          </p>
          <p className="mt-1 text-3xl font-black">{branchesWithIssues}</p>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Sucursales registradas</h2>

              <p className="mt-2 text-sm text-slate-500">
                La información de esta sección alimenta la página pública de
                sucursales.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
              <BadgeCheck size={17} />
              Nuevos: {totalNewVehicles} · Seminuevos: {totalUsedVehicles}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => {
            const services = splitServices(branch.services);
            const issues = getBranchIssues(branch);

            const newVehicles = branch.vehicles.filter(
              (vehicle) => vehicle.condition === VehicleCondition.NUEVO
            ).length;

            const usedVehicles = branch.vehicles.filter(
              (vehicle) => vehicle.condition === VehicleCondition.SEMINUEVO
            ).length;

            const whatsappHref = getWhatsAppHref(
              branch.whatsapp,
              `Hola, me gustaría recibir información de ${branch.name}.`
            );

            const phone = cleanPhone(branch.phone);
            const mapUrl = getMapExternalUrl(branch);

            return (
              <article
                key={branch.id}
                className="rounded-3xl border border-[var(--rise-border)] bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${branch.active
                        ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                        : "bg-slate-200 text-slate-500"
                        }`}
                    >
                      {branch.active ? "Activa" : "Inactiva"}
                    </span>

                    <h3 className="mt-4 text-xl font-black">{branch.name}</h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {branch.city}, {branch.state}
                    </p>
                  </div>

                  {branch.logoUrl ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                      <img
                        src={branch.logoUrl}
                        alt={`Logo ${branch.name}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--rise-blue)]">
                      <Building2 size={22} />
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex gap-2">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                    />
                    <span className="leading-6">{branch.address}</span>
                  </div>

                  {branch.phone && (
                    <div className="flex gap-2">
                      <Phone
                        size={17}
                        className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                      />

                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="font-bold hover:text-[var(--rise-blue)]"
                        >
                          {branch.phone}
                        </a>
                      ) : (
                        <span>{branch.phone}</span>
                      )}
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex gap-2">
                      <Mail
                        size={17}
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
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Total
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {branch.vehicles.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Nuevos
                    </p>
                    <p className="mt-1 text-lg font-black">{newVehicles}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Semi
                    </p>
                    <p className="mt-1 text-lg font-black">{usedVehicles}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Leads
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {branch.leads.length}
                    </p>
                  </div>
                </div>

                {services.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {services.slice(0, 5).map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
                      >
                        <CheckCircle2 size={13} />
                        {service}
                      </span>
                    ))}

                    {services.length > 5 && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-400">
                        +{services.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {issues.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
                      <AlertTriangle size={15} />
                      Revisar
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {issues.slice(0, 4).map((issue) => (
                        <span
                          key={issue}
                          className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700"
                        >
                          {issue}
                        </span>
                      ))}

                      {issues.length > 4 && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
                          +{issues.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/admin/sucursales/${branch.id}/editar`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                    >
                      Editar
                      <ArrowRight size={16} />
                    </Link>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                    >
                      Mapa
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <MessageCircle size={16} />
                        WhatsApp
                      </a>
                    ) : (
                      <div className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400">
                        Sin WhatsApp
                      </div>
                    )}

                    <form action={toggleBranchActive.bind(null, branch.id)}>
                      <button
                        type="submit"
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${branch.active
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          : "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)] hover:bg-blue-100"
                          }`}
                      >
                        {branch.active ? (
                          <>
                            <EyeOff size={16} />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Activar
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}

          {branches.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center md:col-span-2 xl:col-span-3">
              <Building2 size={48} className="mx-auto text-slate-400" />

              <h3 className="mt-4 text-xl font-black">Sin sucursales</h3>

              <p className="mt-2 text-sm text-slate-500">
                Agrega la primera sucursal para comenzar a estructurar el sitio.
              </p>

              <Link
                href="/admin/sucursales/nueva"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Plus size={17} />
                Nueva sucursal
              </Link>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}