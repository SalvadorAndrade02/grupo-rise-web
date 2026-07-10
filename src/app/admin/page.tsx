import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
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
    NUEVO: "border-blue-200 bg-blue-50 text-blue-700",
    CONTACTADO: "border-violet-200 bg-violet-50 text-violet-700",
    EN_SEGUIMIENTO: "border-amber-200 bg-amber-50 text-amber-700",
    CERRADO: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PERDIDO: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    classes[status] ??
    "border-slate-200 bg-slate-100 text-slate-600"
  );
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
  mainImage: string | null;
  description: string | null;
  price: number;
  active: boolean;
  status: VehicleStatus;
  images: {
    id: number;
  }[];
}) {
  const issues: string[] = [];

  const hasImage =
    Boolean(vehicle.mainImage) ||
    vehicle.images.length > 0;

  if (!hasImage) {
    issues.push("Sin imagen");
  }

  if (!vehicle.description?.trim()) {
    issues.push("Sin descripción");
  }

  if (!vehicle.price || vehicle.price <= 0) {
    issues.push("Sin precio válido");
  }

  if (!vehicle.active) {
    issues.push("Oculto");
  }

  if (
    vehicle.active &&
    vehicle.status !== VehicleStatus.DISPONIBLE
  ) {
    issues.push("No disponible");
  }

  if (
    vehicle.status === VehicleStatus.VENDIDO ||
    vehicle.status === VehicleStatus.APARTADO
  ) {
    issues.push("Vendido o apartado");
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
          in: [
            VehicleStatus.VENDIDO,
            VehicleStatus.APARTADO,
          ],
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

  const publishedVehicles =
    publishedNewVehicles +
    publishedUsedVehicles;

  const totalLeads =
    newLeads +
    contactedLeads +
    followUpLeads +
    closedLeads +
    lostLeads;

  const attentionCount =
    vehiclesWithoutImage +
    vehiclesWithoutDescription;

  const mainStats = [
    {
      label: "Solicitudes nuevas",
      value: newLeads,
      description:
        "Prospectos pendientes de contactar.",
      icon: Bell,
      href: "/admin/leads?estado=NUEVO",
      tone: "blue" as const,
    },
    {
      label: "En seguimiento",
      value: followUpLeads,
      description:
        "Prospectos con atención activa.",
      icon: Clock,
      href: "/admin/leads?estado=EN_SEGUIMIENTO",
      tone: "amber" as const,
    },
    {
      label: "Vehículos publicados",
      value: publishedVehicles,
      description:
        "Unidades visibles en el sitio público.",
      icon: BadgeCheck,
      href: "/admin/inventario",
      tone: "emerald" as const,
    },
    {
      label: "Requieren atención",
      value: attentionCount,
      description:
        "Unidades sin imagen o descripción.",
      icon: AlertTriangle,
      href: "/admin/inventario",
      tone: "red" as const,
    },
  ];

  const inventoryStats = [
    {
      label: "Registradas",
      value: totalVehicles,
      icon: Car,
    },
    {
      label: "Nuevas",
      value: newVehicles,
      icon: Sparkles,
    },
    {
      label: "Seminuevas",
      value: usedVehicles,
      icon: Tags,
    },
    {
      label: "Ocultas",
      value: hiddenVehicles,
      icon: EyeOff,
    },
    {
      label: "Vendidas / apartadas",
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
      label: "Nuevas",
      value: newLeads,
    },
    {
      label: "Contactadas",
      value: contactedLeads,
    },
    {
      label: "Seguimiento",
      value: followUpLeads,
    },
    {
      label: "Cerradas",
      value: closedLeads,
    },
    {
      label: "Perdidas",
      value: lostLeads,
    },
  ];

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Sparkles size={14} />
              Panel administrativo
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Dashboard Grupo Rise
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Resumen general del inventario,
              publicaciones y solicitudes comerciales
              registradas en el sitio.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/inventario/nuevo"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Plus size={18} />
              Registrar unidad
            </Link>

            <Link
              href="/admin/leads"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              <MessageSquare size={18} />
              Ver solicitudes
            </Link>
          </div>
        </div>
      </section>

      {/* Estadísticas principales */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mainStats.map((stat) => (
          <MainStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* Inventario y CRM */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <AdminSection
          eyebrow="Inventario"
          title="Estado de las unidades"
          actionHref="/admin/inventario"
          actionLabel="Administrar"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryStats.map((stat) => (
              <SmallStatCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <PublicInventoryCard
              label="Catálogo público"
              value={publishedNewVehicles}
              description="Vehículos nuevos publicados"
            />

            <PublicInventoryCard
              label="Seminuevos públicos"
              value={publishedUsedVehicles}
              description="Seminuevos publicados"
            />
          </div>
        </AdminSection>

        <AdminSection
          eyebrow="CRM comercial"
          title="Estado de solicitudes"
          actionHref="/admin/leads"
          actionLabel="Ver CRM"
        >
          <div className="grid grid-cols-2 gap-3">
            {leadStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4"
              >
                <p className="text-3xl font-black tracking-[-0.04em] text-[#192a3a]">
                  {stat.value}
                </p>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
            <TrendingUp
              size={23}
              className="text-[#192a3a]"
            />

            <p className="mt-3 text-sm font-black text-[#192a3a]">
              Seguimiento recomendado
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Prioriza las solicitudes nuevas y las que
              permanecen en seguimiento activo.
            </p>
          </div>
        </AdminSection>
      </section>

      {/* Atención y leads */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <AdminSection
          eyebrow="Atención requerida"
          title="Vehículos por revisar"
          actionHref="/admin/inventario"
          actionLabel="Revisar inventario"
        >
          <div className="space-y-3">
            {attentionVehicles.length > 0 ? (
              attentionVehicles.map((vehicle) => {
                const image =
                  vehicle.mainImage ||
                  vehicle.images[0]?.url ||
                  "";

                const issues =
                  getVehicleIssues(vehicle);

                return (
                  <Link
                    key={vehicle.id}
                    href={`/admin/inventario/${vehicle.id}/editar`}
                    className="group grid gap-4 rounded-[18px] border border-slate-100 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="h-24 overflow-hidden rounded-xl bg-slate-200">
                      {image ? (
                        <img
                          src={image}
                          alt={`${vehicle.brand.name} ${vehicle.name}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <ImageIcon size={28} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
                        {vehicle.brand.name}
                      </p>

                      <h3 className="mt-1 truncate text-lg font-black">
                        {vehicle.name}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {vehicle.branch.name} ·{" "}
                        {vehicle.branch.city}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {issues.map((issue) => (
                          <span
                            key={issue}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#192a3a]">
                      Editar
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Todo se ve bien"
                description="No hay vehículos con alertas principales por ahora."
                positive
              />
            )}
          </div>
        </AdminSection>

        <AdminSection
          eyebrow="Solicitudes recientes"
          title="Últimos prospectos"
          actionHref="/admin/leads"
          actionLabel="Ver todas"
        >
          <div className="space-y-3">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => {
                const vehicleName = lead.vehicle
                  ? `${lead.vehicle.brand.name} ${lead.vehicle.name}`
                  : "Solicitud general";

                return (
                  <Link
                    key={lead.id}
                    href="/admin/leads"
                    className="group block rounded-[18px] border border-slate-100 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {lead.name}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {vehicleName}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getLeadStatusClasses(
                          lead.status
                        )}`}
                      >
                        {getLeadStatusLabel(
                          lead.status
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-500">
                        {getLeadTypeLabel(lead.type)}
                      </span>

                      {lead.branch && (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-500">
                          {lead.branch.city}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Sin solicitudes"
                description="Los nuevos prospectos aparecerán aquí."
              />
            )}
          </div>
        </AdminSection>
      </section>

      {/* Vehículos recientes */}
      <section className="mt-6">
        <AdminSection
          eyebrow="Actividad reciente"
          title="Últimas unidades actualizadas"
          actionHref="/admin/inventario"
          actionLabel="Ver inventario"
        >
          {recentVehicles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {recentVehicles.map((vehicle) => {
                const image =
                  vehicle.mainImage ||
                  vehicle.images[0]?.url ||
                  "";

                return (
                  <Link
                    key={vehicle.id}
                    href={`/admin/inventario/${vehicle.id}/editar`}
                    className="group overflow-hidden rounded-[18px] border border-slate-100 bg-[#f8fafb] transition hover:-translate-y-1 hover:border-[#192a3a]/25 hover:bg-white hover:shadow-[0_16px_35px_rgba(15,23,42,0.09)]"
                  >
                    <div className="h-36 overflow-hidden bg-slate-200">
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
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
                        {vehicle.brand.name}
                      </p>

                      <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-black leading-5">
                        {vehicle.name}
                      </h3>

                      <p className="mt-2 text-[10px] font-bold text-slate-500">
                        {getConditionLabel(
                          vehicle.condition
                        )}{" "}
                        ·{" "}
                        {getVehicleStatusLabel(
                          vehicle.status
                        )}
                      </p>

                      <p className="mt-3 text-lg font-black tracking-[-0.03em] text-[#192a3a]">
                        {formatCurrency(vehicle.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Car}
              title="Sin unidades registradas"
              description="Las unidades actualizadas aparecerán en esta sección."
            />
          )}
        </AdminSection>
      </section>

      {/* Accesos rápidos */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          href="/admin/inventario/nuevo"
          icon={Plus}
          title="Registrar unidad"
          description="Alta de vehículo nuevo o seminuevo."
          primary
        />

        <QuickAction
          href="/admin/inventario"
          icon={Car}
          title="Inventario"
          description="Administrar estado, precio y galería."
        />

        <QuickAction
          href="/admin/leads"
          icon={MessageSquare}
          title="Solicitudes"
          description="Seguimiento comercial de prospectos."
        />

        <QuickAction
          href="/admin/sucursales"
          icon={Building2}
          title="Sucursales"
          description="Agencias, imágenes y contactos."
        />
      </section>
    </div>
  );
}

function MainStatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  href: string;
  tone: "blue" | "amber" | "emerald" | "red";
}) {
  const toneClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    red: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <Link
      href={href}
      className="group rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl border ${toneClasses[tone]}`}
        >
          <Icon size={21} />
        </span>

        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#192a3a]"
        />
      </div>

      <p className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#192a3a]">
        {value}
      </p>

      <h2 className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700">
        {label}
      </h2>

      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

function AdminSection({
  eyebrow,
  title,
  actionHref,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#192a3a]" />

            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
              {eyebrow}
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
            {title}
          </h2>
        </div>

        <Link
          href={actionHref}
          className="group inline-flex w-fit items-center gap-2 text-xs font-black text-[#192a3a]"
        >
          {actionLabel}

          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SmallStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
        <Icon size={17} />
      </span>

      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#192a3a]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function PublicInventoryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#192a3a]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-600">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  positive = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-300 bg-[#f8fafb] p-8 text-center">
      <Icon
        size={40}
        className={`mx-auto ${positive
            ? "text-emerald-600"
            : "text-slate-400"
          }`}
      />

      <h3 className="mt-3 text-lg font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[20px] border p-5 transition duration-300 hover:-translate-y-1 ${primary
          ? "border-[#192a3a] bg-[#192a3a] text-white hover:bg-[#29465c]"
          : "border-black/8 bg-white text-[#0a0f14] hover:border-[#192a3a]/30 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-full ${primary
              ? "bg-white/10 text-white"
              : "bg-[#e7edf1] text-[#192a3a]"
            }`}
        >
          <Icon size={20} />
        </span>

        <ArrowRight
          size={17}
          className={`transition-transform group-hover:translate-x-0.5 ${primary
              ? "text-white/60"
              : "text-slate-300"
            }`}
        />
      </div>

      <h3 className="mt-5 text-lg font-black">
        {title}
      </h3>

      <p
        className={`mt-2 text-sm leading-6 ${primary
            ? "text-white/60"
            : "text-slate-500"
          }`}
      >
        {description}
      </p>
    </Link>
  );
}