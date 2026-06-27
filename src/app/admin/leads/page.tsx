import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { LeadStatus, LeadType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
  }>;
};

const typeFilters = [
  {
    value: "TODOS",
    label: "Todos",
  },
  {
    value: "COTIZACION",
    label: "Cotización",
  },
  {
    value: "PRUEBA_MANEJO",
    label: "Prueba de manejo",
  },
  {
    value: "CITA",
    label: "Cita",
  },
  {
    value: "SERVICIO",
    label: "Servicio",
  },
  {
    value: "FINANCIAMIENTO",
    label: "Financiamiento",
  },
  {
    value: "CONTACTO",
    label: "Contacto",
  },
];

const statusFilters = [
  {
    value: "TODOS",
    label: "Todos",
  },
  {
    value: "NUEVO",
    label: "Nuevo",
  },
  {
    value: "CONTACTADO",
    label: "Contactado",
  },
  {
    value: "EN_SEGUIMIENTO",
    label: "En seguimiento",
  },
  {
    value: "CERRADO",
    label: "Cerrado",
  },
  {
    value: "PERDIDO",
    label: "Perdido",
  },
];

function getLeadTypeFilter(value?: string): LeadType | "TODOS" {
  if (value && Object.values(LeadType).includes(value as LeadType)) {
    return value as LeadType;
  }

  return "TODOS";
}

function getLeadStatusFilter(value?: string): LeadStatus | "TODOS" {
  if (value && Object.values(LeadStatus).includes(value as LeadStatus)) {
    return value as LeadStatus;
  }

  return "TODOS";
}

function getLeadTypeLabel(type: string) {
  const labels: Record<string, string> = {
    COTIZACION: "Cotización",
    PRUEBA_MANEJO: "Prueba de manejo",
    CITA: "Cita",
    SERVICIO: "Servicio",
    FINANCIAMIENTO: "Financiamiento",
    CONTACTO: "Contacto",
  };

  return labels[type] ?? type;
}

function getLeadStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    CONTACTADO: "Contactado",
    EN_SEGUIMIENTO: "En seguimiento",
    CERRADO: "Cerrado",
    PERDIDO: "Perdido",
  };

  return labels[status] ?? status;
}

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    NUEVO: "bg-blue-50 text-blue-700",
    CONTACTADO: "bg-purple-50 text-purple-700",
    EN_SEGUIMIENTO: "bg-amber-50 text-amber-700",
    CERRADO: "bg-emerald-50 text-emerald-700",
    PERDIDO: "bg-red-50 text-red-700",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600";
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatCreatedAt(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppUrl(phone: string) {
  const clean = cleanPhone(phone);

  if (!clean) {
    return "#";
  }

  const phoneWithCountryCode = clean.startsWith("52") ? clean : `52${clean}`;

  return `https://wa.me/${phoneWithCountryCode}`;
}

function buildFilterHref(type: string, status: string) {
  const params = new URLSearchParams();

  if (type !== "TODOS") {
    params.set("tipo", type);
  }

  if (status !== "TODOS") {
    params.set("estado", status);
  }

  const query = params.toString();

  return query ? `/admin/leads?${query}` : "/admin/leads";
}

async function updateLeadStatus(leadId: number, formData: FormData) {
  "use server";

  const status = formData.get("status");

  if (
    typeof status !== "string" ||
    !Object.values(LeadStatus).includes(status as LeadStatus)
  ) {
    throw new Error("Estado no válido.");
  }

  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      status: status as LeadStatus,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export default async function AdminLeadsPage({
  searchParams,
}: AdminLeadsPageProps) {
  const params = await searchParams;

  const typeFilter = getLeadTypeFilter(params.tipo);
  const statusFilter = getLeadStatusFilter(params.estado);

  const where: Prisma.LeadWhereInput = {
    ...(typeFilter !== "TODOS"
      ? {
          type: typeFilter,
        }
      : {}),
    ...(statusFilter !== "TODOS"
      ? {
          status: statusFilter,
        }
      : {}),
  };

  const [leads, totalLeads, newLeads, followUpLeads, closedLeads, lostLeads] =
    await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          vehicle: {
            include: {
              brand: true,
            },
          },
          branch: true,
        },
      }),

      prisma.lead.count(),

      prisma.lead.count({
        where: {
          status: "NUEVO",
        },
      }),

      prisma.lead.count({
        where: {
          status: "EN_SEGUIMIENTO",
        },
      }),

      prisma.lead.count({
        where: {
          status: "CERRADO",
        },
      }),

      prisma.lead.count({
        where: {
          status: "PERDIDO",
        },
      }),
    ]);

  const stats = [
    {
      title: "Total solicitudes",
      value: totalLeads,
      icon: MessageSquare,
      className: "bg-slate-50 text-slate-700",
    },
    {
      title: "Nuevas",
      value: newLeads,
      icon: Clock,
      className: "bg-blue-50 text-blue-700",
    },
    {
      title: "En seguimiento",
      value: followUpLeads,
      icon: User,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "Cerradas",
      value: closedLeads,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Perdidas",
      value: lostLeads,
      icon: XCircle,
      className: "bg-red-50 text-red-700",
    },
  ];

  return (

      <section className="py-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Administración
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Solicitudes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Gestiona cotizaciones, citas, pruebas de manejo y contactos
                recibidos desde el sitio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/inventario"
                className="rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                Inventario
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm"
                >
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${item.className}`}
                  >
                    <Icon size={22} />
                  </div>

                  <p className="mt-4 text-3xl font-black">{item.value}</p>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>

          <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-black">
                  <Filter size={20} />
                  Filtros
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Filtra las solicitudes por tipo o estado.
                </p>
              </div>

              <Link
                href="/admin/leads"
                className="text-sm font-black text-[var(--rise-blue)] hover:underline"
              >
                Limpiar filtros
              </Link>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Tipo
                </p>

                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((filter) => (
                    <Link
                      key={filter.value}
                      href={buildFilterHref(filter.value, statusFilter)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        typeFilter === filter.value
                          ? "bg-[var(--rise-navy)] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-[var(--rise-blue-soft)] hover:text-[var(--rise-blue)]"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Estado
                </p>

                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => (
                    <Link
                      key={filter.value}
                      href={buildFilterHref(typeFilter, filter.value)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        statusFilter === filter.value
                          ? "bg-[var(--rise-navy)] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-[var(--rise-blue-soft)] hover:text-[var(--rise-blue)]"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 space-y-5">
            {leads.map((lead) => {
              const whatsappUrl = getWhatsAppUrl(lead.phone);

              return (
                <article
                  key={lead.id}
                  className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:shadow-lg hover:shadow-slate-900/10 md:p-6"
                >
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_260px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                          {getLeadTypeLabel(lead.type)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getStatusClasses(
                            lead.status
                          )}`}
                        >
                          {getLeadStatusLabel(lead.status)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-[var(--rise-navy)]">
                        {lead.name}
                      </h2>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600">
                        <a
                          href={`tel:${cleanPhone(lead.phone)}`}
                          className="inline-flex items-center gap-2 font-bold transition hover:text-[var(--rise-blue)]"
                        >
                          <Phone size={17} />
                          {lead.phone}
                        </a>

                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-2 font-bold transition hover:text-[var(--rise-blue)]"
                          >
                            <Mail size={17} />
                            {lead.email}
                          </a>
                        )}

                        <span className="inline-flex items-center gap-2 font-bold text-slate-500">
                          <Clock size={17} />
                          Recibido: {formatCreatedAt(lead.createdAt)}
                        </span>
                      </div>

                      {lead.message && (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                            <MessageSquare size={15} />
                            Mensaje
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {lead.message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {lead.vehicle && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                            <Car size={15} />
                            Vehículo relacionado
                          </p>

                          <p className="mt-2 text-sm font-black text-[var(--rise-navy)]">
                            {lead.vehicle.brand.name} {lead.vehicle.name}
                          </p>

                          <p className="mt-1 text-sm font-black text-[var(--rise-blue)]">
                            {formatCurrency(lead.vehicle.price)}
                          </p>

                          <Link
                            href={`/admin/inventario/${lead.vehicle.id}/editar`}
                            className="mt-3 inline-flex text-sm font-black text-[var(--rise-blue)] hover:underline"
                          >
                            Ver vehículo
                          </Link>
                        </div>
                      )}

                      {lead.branch && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Sucursal
                          </p>

                          <p className="mt-2 text-sm font-black text-[var(--rise-navy)]">
                            {lead.branch.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {lead.branch.city}, {lead.branch.state}
                          </p>
                        </div>
                      )}

                      {(lead.preferredDate || lead.preferredTime) && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                            <CalendarDays size={15} />
                            Fecha preferida
                          </p>

                          <p className="mt-2 text-sm font-black text-[var(--rise-navy)]">
                            {formatDate(lead.preferredDate)}
                          </p>

                          {lead.preferredTime && (
                            <p className="mt-1 text-sm text-slate-500">
                              {lead.preferredTime}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <aside className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Gestión
                      </p>

                      <form
                        action={updateLeadStatus.bind(null, lead.id)}
                        className="mt-4 grid gap-3"
                      >
                        <label>
                          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                            Estado
                          </span>

                          <select
                            name="status"
                            defaultValue={lead.status}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-[var(--rise-blue)]"
                          >
                            <option value="NUEVO">Nuevo</option>
                            <option value="CONTACTADO">Contactado</option>
                            <option value="EN_SEGUIMIENTO">
                              En seguimiento
                            </option>
                            <option value="CERRADO">Cerrado</option>
                            <option value="PERDIDO">Perdido</option>
                          </select>
                        </label>

                        <button
                          type="submit"
                          className="rounded-xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                        >
                          Actualizar estado
                        </button>
                      </form>

                      <div className="mt-4 grid gap-2">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle size={17} />
                          WhatsApp
                        </a>

                        <a
                          href={`tel:${cleanPhone(lead.phone)}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                        >
                          <Phone size={17} />
                          Llamar
                        </a>

                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                          >
                            <Mail size={17} />
                            Correo
                          </a>
                        )}
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })}

            {leads.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-lg font-black text-[var(--rise-navy)]">
                  No hay solicitudes con estos filtros.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Cambia los filtros o limpia la búsqueda.
                </p>

                <Link
                  href="/admin/leads"
                  className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}
          </div>
      </section>
  );
}