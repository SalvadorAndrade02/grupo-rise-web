import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  EyeOff,
  ImageIcon,
  MessageSquare,
  Plus,
  Sparkles,
  Tags,
  TrendingUp,
} from "lucide-react";
import {
  LeadStatus,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

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

function getLeadStatusClasses(status: string) {
  const classes: Record<string, string> = {
    NUEVO: "bg-blue-50 text-blue-700",
    CONTACTADO: "bg-purple-50 text-purple-700",
    EN_SEGUIMIENTO: "bg-amber-50 text-amber-700",
    CERRADO: "bg-emerald-50 text-emerald-700",
    PERDIDO: "bg-red-50 text-red-700",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600";
}

function getVehicleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DISPONIBLE: "Disponible",
    APARTADO: "Apartado",
    VENDIDO: "Vendido",
    EN_TRANSITO: "En tránsito",
    PROXIMAMENTE: "Próximamente",
    INACTIVO: "Inactivo",
  };

  return labels[status] ?? status;
}

function getConditionLabel(condition: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition] ?? condition;
}

function getVehicleIssues(vehicle: {
  mainImage: string;
  description: string;
  price: number;
  active: boolean;
  status: VehicleStatus;
  images: { id: number }[];
}) {
  const issues: string[] = [];

  if (!vehicle.mainImage && vehicle.images.length === 0) {
    issues.push("Sin imagen");
  }

  if (!vehicle.description?.trim()) {
    issues.push("Sin descripción");
  }

  if (!vehicle.price || vehicle.price <= 0) {
    issues.push("Sin precio válido");
  }

  if (vehicle.active && vehicle.status !== VehicleStatus.DISPONIBLE) {
    issues.push("Visible pero no disponible");
  }

  return issues;
}

export default async function AdminDashboardPage() {
  const [
    totalVehicles,
    newVehicles,
    usedVehicles,
    publishedNewVehicles,
    publishedUsedVehicles,
    hiddenVehicles,
    soldOrReservedVehicles,
    vehiclesWithoutImage,
    vehiclesWithoutDescription,
    newLeads,
    contactedLeads,
    followUpLeads,
    closedLeads,
    lostLeads,
    recentLeads,
    recentVehicles,
    attentionVehicles,
  ] = await Promise.all([
    prisma.vehicle.count(),

    prisma.vehicle.count({
      where: {
        condition: VehicleCondition.NUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        condition: VehicleCondition.SEMINUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition: VehicleCondition.NUEVO,
        status: VehicleStatus.DISPONIBLE,
        branch: {
          active: true,
        },
        brand: {
          active: true,
        },
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition: VehicleCondition.SEMINUEVO,
        status: VehicleStatus.DISPONIBLE,
        branch: {
          active: true,
        },
        brand: {
          active: true,
        },
      },
    }),

    prisma.vehicle.count({
      where: {
        active: false,
      },
    }),

    prisma.vehicle.count({
      where: {
        status: {
          in: [VehicleStatus.VENDIDO, VehicleStatus.APARTADO],
        },
      },
    }),

    prisma.vehicle.count({
      where: {
        mainImage: "",
        images: {
          none: {
            type: VehicleMediaType.IMAGE,
          },
        },
      },
    }),

    prisma.vehicle.count({
      where: {
        description: "",
      },
    }),

    prisma.lead.count({
      where: {
        status: LeadStatus.NUEVO,
      },
    }),

    prisma.lead.count({
      where: {
        status: LeadStatus.CONTACTADO,
      },
    }),

    prisma.lead.count({
      where: {
        status: LeadStatus.EN_SEGUIMIENTO,
      },
    }),

    prisma.lead.count({
      where: {
        status: LeadStatus.CERRADO,
      },
    }),

    prisma.lead.count({
      where: {
        status: LeadStatus.PERDIDO,
      },
    }),

    prisma.lead.findMany({
      take: 5,
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

    prisma.vehicle.findMany({
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        brand: true,
        branch: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
        },
      },
    }),

    prisma.vehicle.findMany({
      take: 6,
      where: {
        OR: [
          {
            mainImage: "",
            images: {
              none: {
                type: VehicleMediaType.IMAGE,
              },
            },
          },
          {
            description: "",
          },
          {
            price: {
              lte: 0,
            },
          },
          {
            active: true,
            status: {
              not: VehicleStatus.DISPONIBLE,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        brand: true,
        branch: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
        },
      },
    }),
  ]);

  const publishedVehicles = publishedNewVehicles + publishedUsedVehicles;
  const totalLeads =
    newLeads + contactedLeads + followUpLeads + closedLeads + lostLeads;

  const mainStats = [
    {
      label: "Solicitudes nuevas",
      value: newLeads,
      description: "Leads pendientes de contactar",
      icon: Bell,
      href: "/admin/leads?estado=NUEVO",
      tone: "blue",
    },
    {
      label: "En seguimiento",
      value: followUpLeads,
      description: "Prospectos activos",
      icon: Clock,
      href: "/admin/leads?estado=EN_SEGUIMIENTO",
      tone: "amber",
    },
    {
      label: "Vehículos publicados",
      value: publishedVehicles,
      description: "Catálogo + inventario público",
      icon: BadgeCheck,
      href: "/admin/inventario",
      tone: "emerald",
    },
    {
      label: "Requieren atención",
      value: vehiclesWithoutImage + vehiclesWithoutDescription,
      description: "Sin imagen o descripción",
      icon: AlertTriangle,
      href: "/admin/inventario",
      tone: "red",
    },
  ];

  const inventoryStats = [
    {
      label: "Unidades registradas",
      value: totalVehicles,
      icon: Car,
    },
    {
      label: "Nuevos",
      value: newVehicles,
      icon: Sparkles,
    },
    {
      label: "Seminuevos",
      value: usedVehicles,
      icon: Tags,
    },
    {
      label: "Ocultos",
      value: hiddenVehicles,
      icon: EyeOff,
    },
    {
      label: "Vendidos / apartados",
      value: soldOrReservedVehicles,
      icon: CheckCircle2,
    },
    {
      label: "Sin imagen",
      value: vehiclesWithoutImage,
      icon: ImageIcon,
    },
  ];

  const leadStats = [
    {
      label: "Total",
      value: totalLeads,
    },
    {
      label: "Nuevos",
      value: newLeads,
    },
    {
      label: "Contactados",
      value: contactedLeads,
    },
    {
      label: "Seguimiento",
      value: followUpLeads,
    },
    {
      label: "Cerrados",
      value: closedLeads,
    },
    {
      label: "Perdidos",
      value: lostLeads,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Panel administrativo
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Dashboard Grupo Rise
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Resumen de inventario, catálogo, seminuevos y solicitudes
            comerciales del sitio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/inventario/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            <Plus size={18} />
            Registrar unidad
          </Link>

          <Link
            href="/admin/leads"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
          >
            <MessageSquare size={18} />
            Ver solicitudes
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    stat.tone === "blue"
                      ? "bg-blue-50 text-blue-700"
                      : stat.tone === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : stat.tone === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                  }`}
                >
                  <Icon size={23} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--rise-blue)]"
                />
              </div>

              <p className="mt-5 text-4xl font-black text-[var(--rise-navy)]">
                {stat.value}
              </p>

              <h2 className="mt-2 text-sm font-black uppercase tracking-wider text-slate-700">
                {stat.label}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stat.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Inventario
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Estado de unidades
              </h2>
            </div>

            <Link
              href="/admin/inventario"
              className="text-sm font-black text-[var(--rise-blue)] hover:underline"
            >
              Administrar inventario
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <Icon size={22} className="text-[var(--rise-blue)]" />

                  <p className="mt-4 text-3xl font-black text-[var(--rise-navy)]">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Catálogo público
              </p>

              <p className="mt-2 text-3xl font-black text-[var(--rise-blue)]">
                {publishedNewVehicles}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Nuevos disponibles publicados
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Inventario público
              </p>

              <p className="mt-2 text-3xl font-black text-[var(--rise-blue)]">
                {publishedUsedVehicles}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Seminuevos disponibles publicados
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                CRM
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Estado de solicitudes
              </h2>
            </div>

            <Link
              href="/admin/leads"
              className="text-sm font-black text-[var(--rise-blue)] hover:underline"
            >
              Ver CRM
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {leadStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-3xl font-black text-[var(--rise-navy)]">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[var(--rise-blue-soft)] p-5">
            <TrendingUp size={24} className="text-[var(--rise-blue)]" />

            <p className="mt-3 text-sm font-black text-[var(--rise-navy)]">
              Seguimiento recomendado
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Prioriza solicitudes nuevas y las que están en seguimiento. Las
              solicitudes cerradas ayudan a medir avance comercial.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Atención requerida
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Vehículos por revisar
              </h2>
            </div>

            <Link
              href="/admin/inventario"
              className="text-sm font-black text-[var(--rise-blue)] hover:underline"
            >
              Revisar inventario
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {attentionVehicles.length > 0 ? (
              attentionVehicles.map((vehicle) => {
                const image = vehicle.images[0]?.url || vehicle.mainImage || "";
                const issues = getVehicleIssues(vehicle);

                return (
                  <Link
                    key={vehicle.id}
                    href={`/admin/inventario/${vehicle.id}/editar`}
                    className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-lg hover:shadow-slate-900/5 md:grid-cols-[96px_1fr_auto]"
                  >
                    <div className="h-24 overflow-hidden rounded-2xl bg-slate-200">
                      {image ? (
                        <img
                          src={image}
                          alt={`${vehicle.brand.name} ${vehicle.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <ImageIcon size={28} />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                        {vehicle.brand.name}
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        {vehicle.name}
                      </h3>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {vehicle.branch.name} · {vehicle.branch.city}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {issues.map((issue) => (
                          <span
                            key={issue}
                            className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center text-sm font-black text-[var(--rise-blue)]">
                      Editar
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <CheckCircle2
                  size={42}
                  className="mx-auto text-emerald-600"
                />

                <h3 className="mt-3 text-xl font-black">
                  Todo se ve bien
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No hay vehículos con alertas principales por ahora.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Solicitudes recientes
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Últimos prospectos
              </h2>
            </div>

            <Link
              href="/admin/leads"
              className="text-sm font-black text-[var(--rise-blue)] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => {
                const vehicleName = lead.vehicle
                  ? `${lead.vehicle.brand.name} ${lead.vehicle.name}`
                  : "Solicitud general";

                return (
                  <Link
                    key={lead.id}
                    href="/admin/leads"
                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-lg hover:shadow-slate-900/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{lead.name}</p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {vehicleName}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getLeadStatusClasses(
                          lead.status
                        )}`}
                      >
                        {getLeadStatusLabel(lead.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                        {getLeadTypeLabel(lead.type)}
                      </span>

                      {lead.branch && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                          {lead.branch.city}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <MessageSquare size={42} className="mx-auto text-slate-400" />

                <h3 className="mt-3 text-xl font-black">
                  Sin solicitudes todavía
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Cuando un cliente solicite información aparecerá aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Actividad reciente
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Últimas unidades actualizadas
            </h2>
          </div>

          <Link
            href="/admin/inventario"
            className="text-sm font-black text-[var(--rise-blue)] hover:underline"
          >
            Ver inventario
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {recentVehicles.map((vehicle) => {
            const image = vehicle.images[0]?.url || vehicle.mainImage || "";

            return (
              <Link
                key={vehicle.id}
                href={`/admin/inventario/${vehicle.id}/editar`}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="h-36 bg-slate-200">
                  {image ? (
                    <img
                      src={image}
                      alt={`${vehicle.brand.name} ${vehicle.name}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <ImageIcon size={34} />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                    {vehicle.brand.name}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-base font-black">
                    {vehicle.name}
                  </h3>

                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {getConditionLabel(vehicle.condition)} ·{" "}
                    {getVehicleStatusLabel(vehicle.status)}
                  </p>

                  <p className="mt-3 text-lg font-black text-[var(--rise-blue)]">
                    {formatCurrency(vehicle.price)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/inventario/nuevo"
          className="rounded-[2rem] border border-[var(--rise-border)] bg-[var(--rise-navy)] p-5 text-white shadow-sm transition hover:bg-[var(--rise-blue)]"
        >
          <Plus size={24} />
          <h3 className="mt-4 text-xl font-black">Registrar unidad</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Alta de vehículo nuevo o seminuevo.
          </p>
        </Link>

        <Link
          href="/admin/inventario"
          className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
        >
          <Car size={24} className="text-[var(--rise-blue)]" />
          <h3 className="mt-4 text-xl font-black">Inventario</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Administrar unidades, publicación, estado y galería.
          </p>
        </Link>

        <Link
          href="/admin/leads"
          className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
        >
          <MessageSquare size={24} className="text-[var(--rise-blue)]" />
          <h3 className="mt-4 text-xl font-black">Solicitudes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            CRM comercial para seguimiento de clientes.
          </p>
        </Link>

        <Link
          href="/admin/sucursales"
          className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
        >
          <Building2 size={24} className="text-[var(--rise-blue)]" />
          <h3 className="mt-4 text-xl font-black">Sucursales</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Revisar puntos de venta y datos de contacto.
          </p>
        </Link>
      </section>
    </div>
  );
}