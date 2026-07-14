import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Mail,
  MessageCircle,
  MessageSquare,
  PackageSearch,
  Phone,
  Search,
  SlidersHorizontal,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  LeadStatus,
  LeadType,
  VehicleMediaType,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/formatters";
import {
  AdminHero,
  AdminInput,
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
    area?: string;
    sucursal?: string;
    desde?: string;
    hasta?: string;
    q?: string;
    pagina?: string;
  }>;
};

type LeadBusinessCategory =
  | "SERVICIO"
  | "REFACCIONES"
  | "COTIZACION_VEHICULO"
  | "COTIZACION_GENERAL"
  | "PRUEBA_MANEJO"
  | "FINANCIAMIENTO"
  | "CONTACTO"
  | "CITA";

type LeadBusinessFilter =
  | LeadBusinessCategory
  | "TODAS";

type LeadQueryState = {
  search: string;
  type: LeadType | "TODOS";
  status: LeadStatus | "TODOS";
  area: LeadBusinessFilter;
  branchId: number;
  dateFrom: string;
  dateTo: string;
};

const PAGE_SIZE = 6;

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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getLeadTypeFilter(
  value?: string
): LeadType | "TODOS" {
  if (
    value &&
    Object.values(LeadType).includes(
      value as LeadType
    )
  ) {
    return value as LeadType;
  }

  return "TODOS";
}

function getLeadStatusFilter(
  value?: string
): LeadStatus | "TODOS" {
  if (
    value &&
    Object.values(LeadStatus).includes(
      value as LeadStatus
    )
  ) {
    return value as LeadStatus;
  }

  return "TODOS";
}

function getLeadBusinessFilter(
  value?: string
): LeadBusinessFilter {
  const validValues: LeadBusinessCategory[] = [
    "SERVICIO",
    "REFACCIONES",
    "COTIZACION_VEHICULO",
    "COTIZACION_GENERAL",
    "PRUEBA_MANEJO",
    "FINANCIAMIENTO",
    "CONTACTO",
    "CITA",
  ];

  return value &&
    validValues.includes(
      value as LeadBusinessCategory
    )
    ? (value as LeadBusinessCategory)
    : "TODAS";
}

function parsePositiveInteger(
  value?: string
) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) &&
    numberValue > 0
    ? numberValue
    : 0;
}

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) &&
    page > 0
    ? page
    : 1;
}

function parseDateValue(value?: string) {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getExclusiveEndDate(
  value?: string
) {
  const date = parseDateValue(value);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + 1);

  return date;
}

function getBusinessAreaWhere(
  area: LeadBusinessFilter
): Prisma.LeadWhereInput | null {
  if (area === "TODAS") {
    return null;
  }

  if (area === "SERVICIO") {
    return {
      OR: [
        {
          type: LeadType.SERVICIO,
        },
        {
          message: {
            contains:
              "Solicitud de servicio",
          },
        },
        {
          message: {
            contains:
              "servicio / mantenimiento",
          },
        },
      ],
    };
  }

  if (area === "REFACCIONES") {
    return {
      type: LeadType.COTIZACION,

      OR: [
        {
          message: {
            contains:
              "Cotización de refacciones",
          },
        },
        {
          message: {
            contains:
              "Refacción solicitada",
          },
        },
      ],
    };
  }

  if (
    area === "COTIZACION_VEHICULO"
  ) {
    return {
      type: LeadType.COTIZACION,

      vehicleId: {
        not: null,
      },
    };
  }

  if (
    area === "COTIZACION_GENERAL"
  ) {
    return {
      type: LeadType.COTIZACION,
      vehicleId: null,

      NOT: [
        {
          message: {
            contains:
              "Cotización de refacciones",
          },
        },
        {
          message: {
            contains:
              "Refacción solicitada",
          },
        },
      ],
    };
  }

  const areaTypeMap: Partial<
    Record<
      LeadBusinessCategory,
      LeadType
    >
  > = {
    PRUEBA_MANEJO:
      LeadType.PRUEBA_MANEJO,

    FINANCIAMIENTO:
      LeadType.FINANCIAMIENTO,

    CONTACTO: LeadType.CONTACTO,
    CITA: LeadType.CITA,
  };

  const leadType = areaTypeMap[area];

  return leadType
    ? {
      type: leadType,
    }
    : null;
}

function buildLeadsHref({
  search = "",
  type = "TODOS",
  status = "TODOS",
  area = "TODAS",
  branchId = 0,
  dateFrom = "",
  dateTo = "",
  page = 1,
}: {
  search?: string;
  type?: string;
  status?: string;
  area?: string;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  if (type !== "TODOS") {
    params.set("tipo", type);
  }

  if (status !== "TODOS") {
    params.set("estado", status);
  }

  if (area !== "TODAS") {
    params.set("area", area);
  }

  if (branchId > 0) {
    params.set(
      "sucursal",
      String(branchId)
    );
  }

  if (dateFrom) {
    params.set("desde", dateFrom);
  }

  if (dateTo) {
    params.set("hasta", dateTo);
  }

  if (page > 1) {
    params.set(
      "pagina",
      String(page)
    );
  }

  const query = params.toString();

  return query
    ? `/admin/leads?${query}`
    : "/admin/leads";
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
    NUEVO:
      "border-blue-200 bg-blue-50 text-blue-700",
    CONTACTADO:
      "border-violet-200 bg-violet-50 text-violet-700",
    EN_SEGUIMIENTO:
      "border-amber-200 bg-amber-50 text-amber-700",
    CERRADO:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    PERDIDO:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    classes[status] ??
    "border-slate-200 bg-slate-100 text-slate-600"
  );
}

function getTypeClasses(type: string) {
  const classes: Record<string, string> = {
    COTIZACION:
      "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
    PRUEBA_MANEJO:
      "border-violet-200 bg-violet-50 text-violet-700",
    CITA:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    SERVICIO:
      "border-slate-200 bg-slate-100 text-slate-700",
    FINANCIAMIENTO:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    CONTACTO:
      "border-orange-200 bg-orange-50 text-orange-700",
  };

  return (
    classes[type] ??
    "border-slate-200 bg-slate-100 text-slate-600"
  );
}

function getLeadBusinessCategory(lead: {
  type: LeadType;
  message: string | null;
  vehicle?: {
    id: number;
  } | null;
}): LeadBusinessCategory {
  const message = normalizeText(
    lead.message ?? ""
  );

  if (
    lead.type === LeadType.SERVICIO ||
    message.includes(
      "solicitud de servicio"
    ) ||
    message.includes(
      "servicio / mantenimiento"
    )
  ) {
    return "SERVICIO";
  }

  if (
    message.includes(
      "cotizacion de refacciones"
    ) ||
    message.includes(
      "refaccion solicitada"
    )
  ) {
    return "REFACCIONES";
  }

  if (
    lead.type === LeadType.COTIZACION &&
    lead.vehicle
  ) {
    return "COTIZACION_VEHICULO";
  }

  if (
    lead.type === LeadType.COTIZACION
  ) {
    return "COTIZACION_GENERAL";
  }

  if (
    lead.type ===
    LeadType.PRUEBA_MANEJO
  ) {
    return "PRUEBA_MANEJO";
  }

  if (
    lead.type ===
    LeadType.FINANCIAMIENTO
  ) {
    return "FINANCIAMIENTO";
  }

  if (lead.type === LeadType.CITA) {
    return "CITA";
  }

  return "CONTACTO";
}

function getLeadBusinessLabel(
  category: LeadBusinessCategory
) {
  const labels: Record<
    LeadBusinessCategory,
    string
  > = {
    SERVICIO: "Servicio / mantenimiento",
    REFACCIONES: "Cotización de refacciones",
    COTIZACION_VEHICULO:
      "Cotización de vehículo",
    COTIZACION_GENERAL:
      "Cotización general",
    PRUEBA_MANEJO: "Prueba de manejo",
    FINANCIAMIENTO: "Financiamiento",
    CONTACTO: "Contacto",
    CITA: "Cita",
  };

  return labels[category];
}

function getLeadBusinessClasses(
  category: LeadBusinessCategory
) {
  const classes: Record<
    LeadBusinessCategory,
    string
  > = {
    SERVICIO:
      "border-[#192a3a] bg-[#192a3a] text-white",

    REFACCIONES:
      "border-amber-200 bg-amber-50 text-amber-700",

    COTIZACION_VEHICULO:
      "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",

    COTIZACION_GENERAL:
      "border-blue-200 bg-blue-50 text-blue-700",

    PRUEBA_MANEJO:
      "border-violet-200 bg-violet-50 text-violet-700",

    FINANCIAMIENTO:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    CONTACTO:
      "border-orange-200 bg-orange-50 text-orange-700",

    CITA:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
  };

  return classes[category];
}

function getLeadBusinessIcon(
  category: LeadBusinessCategory
): LucideIcon {
  const icons: Record<
    LeadBusinessCategory,
    LucideIcon
  > = {
    SERVICIO: Wrench,
    REFACCIONES: PackageSearch,
    COTIZACION_VEHICULO: Car,
    COTIZACION_GENERAL: MessageSquare,
    PRUEBA_MANEJO: Car,
    FINANCIAMIENTO: BadgeCheck,
    CONTACTO: MessageCircle,
    CITA: CalendarDays,
  };

  return icons[category];
}

function getLeadWhatsAppMessage({
  leadName,
  businessCategory,
  vehicleTitle,
  hasVehicle,
}: {
  leadName: string;
  businessCategory: LeadBusinessCategory;
  vehicleTitle: string;
  hasVehicle: boolean;
}) {
  if (businessCategory === "SERVICIO") {
    return `Hola ${leadName}, te contacto de Grupo Rise por tu solicitud de servicio/mantenimiento.`;
  }

  if (
    businessCategory === "REFACCIONES"
  ) {
    return `Hola ${leadName}, te contacto de Grupo Rise por tu cotización de refacciones.`;
  }

  if (
    businessCategory ===
    "COTIZACION_VEHICULO" &&
    hasVehicle
  ) {
    return `Hola ${leadName}, te contacto de Grupo Rise por tu cotización para ${vehicleTitle}.`;
  }

  return `Hola ${leadName}, te contacto de Grupo Rise por tu solicitud.`;
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

function cleanPhone(
  value?: string | null
) {
  return (
    value?.replace(/\D/g, "") ?? ""
  );
}

function getWhatsAppHref(
  phone?: string | null,
  message?: string
) {
  const phoneNumber = cleanPhone(phone);

  if (!phoneNumber) {
    return "";
  }

  const finalPhone =
    phoneNumber.startsWith("52")
      ? phoneNumber
      : `52${phoneNumber}`;

  const text = message
    ? `?text=${encodeURIComponent(
      message
    )}`
    : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function getMailHref(
  email?: string | null,
  subject?: string,
  body?: string
) {
  if (!email) {
    return "";
  }

  const params = new URLSearchParams();

  if (subject) {
    params.set("subject", subject);
  }

  if (body) {
    params.set("body", body);
  }

  const query = params.toString();

  return query
    ? `mailto:${email}?${query}`
    : `mailto:${email}`;
}

function buildExportHref(
  type: string,
  status: string,
  search = ""
) {
  const params = new URLSearchParams();

  if (type !== "TODOS") {
    params.set("tipo", type);
  }

  if (status !== "TODOS") {
    params.set("estado", status);
  }

  if (search.trim()) {
    params.set("q", search.trim());
  }

  const query = params.toString();

  return query
    ? `/admin/leads/export?${query}`
    : "/admin/leads/export";
}

async function updateLeadStatus(
  leadId: number,
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const status = String(
    formData.get("status") || ""
  );

  if (
    !leadId ||
    !Object.values(
      LeadStatus
    ).includes(status as LeadStatus)
  ) {
    return;
  }

  const lead =
    await prisma.lead.findUnique({
      where: {
        id: leadId,
      },

      select: {
        id: true,
      },
    });

  if (!lead) {
    return;
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
  await requireAdmin();

  const params = await searchParams;

  const typeFilter =
    getLeadTypeFilter(params.tipo);

  const statusFilter =
    getLeadStatusFilter(
      params.estado
    );

  const businessFilter =
    getLeadBusinessFilter(
      params.area
    );

  const selectedBranchId =
    parsePositiveInteger(
      params.sucursal
    );

  const requestedPage = parsePage(
    params.pagina
  );

  const search =
    params.q?.trim() ?? "";

  const dateFromValue =
    params.desde ?? "";

  const dateToValue =
    params.hasta ?? "";

  const dateFrom =
    parseDateValue(dateFromValue);

  const dateToExclusive =
    getExclusiveEndDate(
      dateToValue
    );

  const searchConditions: Prisma.LeadWhereInput[] =
    [];

  if (search) {
    searchConditions.push(
      {
        name: {
          contains: search,
        },
      },
      {
        phone: {
          contains: search,
        },
      },
      {
        email: {
          contains: search,
        },
      },
      {
        message: {
          contains: search,
        },
      },
      {
        vehicle: {
          is: {
            name: {
              contains: search,
            },
          },
        },
      },
      {
        vehicle: {
          is: {
            model: {
              contains: search,
            },
          },
        },
      },
      {
        vehicle: {
          is: {
            brand: {
              is: {
                name: {
                  contains: search,
                },
              },
            },
          },
        },
      },
      {
        branch: {
          is: {
            name: {
              contains: search,
            },
          },
        },
      },
      {
        branch: {
          is: {
            city: {
              contains: search,
            },
          },
        },
      }
    );
  }

  const businessAreaWhere =
    getBusinessAreaWhere(
      businessFilter
    );

  const andConditions: Prisma.LeadWhereInput[] =
    [];

  if (searchConditions.length > 0) {
    andConditions.push({
      OR: searchConditions,
    });
  }

  if (businessAreaWhere) {
    andConditions.push(
      businessAreaWhere
    );
  }

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

    ...(selectedBranchId > 0
      ? {
        branchId:
          selectedBranchId,
      }
      : {}),

    ...(dateFrom ||
      dateToExclusive
      ? {
        createdAt: {
          ...(dateFrom
            ? {
              gte: dateFrom,
            }
            : {}),

          ...(dateToExclusive
            ? {
              lt: dateToExclusive,
            }
            : {}),
        },
      }
      : {}),

    ...(andConditions.length > 0
      ? {
        AND: andConditions,
      }
      : {}),
  };

  const [
    filteredLeadCount,
    branches,
    totalLeads,
    newLeads,
    contactedLeads,
    followUpLeads,
    closedLeads,
    lostLeads,
  ] = await Promise.all([
    prisma.lead.count({
      where,
    }),

    prisma.branch.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        city: true,
        active: true,
      },
    }),

    prisma.lead.count(),

    prisma.lead.count({
      where: {
        status: LeadStatus.NUEVO,
      },
    }),

    prisma.lead.count({
      where: {
        status:
          LeadStatus.CONTACTADO,
      },
    }),

    prisma.lead.count({
      where: {
        status:
          LeadStatus.EN_SEGUIMIENTO,
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
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeadCount / PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  const paginationSkip =
    (currentPage - 1) * PAGE_SIZE;

  const leads =
    await prisma.lead.findMany({
      where,
      skip: paginationSkip,
      take: PAGE_SIZE,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        vehicle: {
          include: {
            brand: true,
            branch: true,

            images: {
              where: {
                type:
                  VehicleMediaType.IMAGE,
              },

              orderBy: {
                order: "asc",
              },

              take: 1,
            },
          },
        },

        branch: true,
      },
    });

  const hasAdvancedFilters =
    typeFilter !== "TODOS" ||
    statusFilter !== "TODOS" ||
    businessFilter !== "TODAS" ||
    selectedBranchId > 0 ||
    Boolean(dateFromValue) ||
    Boolean(dateToValue);

  const hasFilters =
    Boolean(search) ||
    hasAdvancedFilters;

  const activeFilterCount = [
    Boolean(search),
    typeFilter !== "TODOS",
    statusFilter !== "TODOS",
    businessFilter !== "TODAS",
    selectedBranchId > 0,
    Boolean(dateFromValue),
    Boolean(dateToValue),
  ].filter(Boolean).length;

  const firstVisibleLead =
    filteredLeadCount === 0
      ? 0
      : paginationSkip + 1;

  const lastVisibleLead = Math.min(
    paginationSkip + leads.length,
    filteredLeadCount
  );

  const leadQueryState: LeadQueryState = {
    search,
    type: typeFilter,
    status: statusFilter,
    area: businessFilter,
    branchId: selectedBranchId,
    dateFrom: dateFromValue,
    dateTo: dateToValue,
  };

  const stats = [
    {
      title: "Total",
      value: totalLeads,
      icon: MessageSquare,
      tone: "navy" as const,
      href: "/admin/leads",
    },
    {
      title: "Nuevas",
      value: newLeads,
      icon: Clock,
      tone: "blue" as const,
      href: "/admin/leads?estado=NUEVO",
    },
    {
      title: "Contactadas",
      value: contactedLeads,
      icon: Phone,
      tone: "violet" as const,
      href:
        "/admin/leads?estado=CONTACTADO",
    },
    {
      title: "Seguimiento",
      value: followUpLeads,
      icon: User,
      tone: "amber" as const,
      href:
        "/admin/leads?estado=EN_SEGUIMIENTO",
    },
    {
      title: "Cerradas",
      value: closedLeads,
      icon: CheckCircle2,
      tone: "emerald" as const,
      href:
        "/admin/leads?estado=CERRADO",
    },
    {
      title: "Perdidas",
      value: lostLeads,
      icon: XCircle,
      tone: "red" as const,
      href:
        "/admin/leads?estado=PERDIDO",
    },
  ];

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <AdminHero
        eyebrow="CRM comercial"
        title="Solicitudes"
        description="Gestiona cotizaciones, pruebas de manejo, citas, servicios, financiamientos y contactos recibidos."
        icon={MessageSquare}
        actions={
          <>
            <a
              href={buildExportHref(
                typeFilter,
                statusFilter,
                search
              )}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Download size={17} />
              Exportar CSV
            </a>

            <Link
              href="/admin/inventario"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              <Car size={17} />
              Inventario
            </Link>
          </>
        }
      />

      {/* Estadísticas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group transition hover:-translate-y-1"
          >
            <AdminSummaryCard
              icon={stat.icon}
              label={stat.title}
              value={stat.value}
              tone={stat.tone}
            />
          </Link>
        ))}
      </section>

      {/* Filtros */}
      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Buscar y filtrar
              </p>
            </div>

            <h2 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-[-0.035em]">
              <SlidersHorizontal size={20} />
              Solicitudes del CRM
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Busca clientes y filtra por estado,
              área, sucursal o fecha de recepción.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeFilterCount > 0 && (
              <span className="rounded-full border border-[#192a3a]/10 bg-[#e7edf1] px-4 py-2 text-xs font-black text-[#192a3a]">
                {activeFilterCount} filtro
                {activeFilterCount === 1
                  ? ""
                  : "s"}{" "}
                activo
                {activeFilterCount === 1
                  ? ""
                  : "s"}
              </span>
            )}

            <span className="rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              {filteredLeadCount} resultado
              {filteredLeadCount === 1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        <form
          action="/admin/leads"
          className="mt-6"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Buscar solicitud
              </span>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Cliente, teléfono, correo, unidad o sucursal"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                />
              </div>
            </label>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] lg:self-end"
            >
              <Search size={17} />
              Buscar
            </button>

            {hasFilters && (
              <Link
                href="/admin/leads"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98] lg:self-end"
              >
                Limpiar
              </Link>
            )}
          </div>

          <details
            open={hasAdvancedFilters}
            className="group mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black text-[#192a3a]">
                <Filter size={16} />
                Más filtros
              </span>

              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#192a3a] transition group-open:rotate-90">
                <ArrowRight size={14} />
              </span>
            </summary>

            <div className="border-t border-slate-200 p-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AdminSelect
                  label="Tipo técnico"
                  name="tipo"
                  defaultValue={typeFilter}
                >
                  {typeFilters.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </AdminSelect>

                <AdminSelect
                  label="Estado"
                  name="estado"
                  defaultValue={statusFilter}
                >
                  {statusFilters.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </AdminSelect>

                <AdminSelect
                  label="Área comercial"
                  name="area"
                  defaultValue={businessFilter}
                >
                  <option value="TODAS">
                    Todas las áreas
                  </option>

                  <option value="SERVICIO">
                    Servicio / mantenimiento
                  </option>

                  <option value="REFACCIONES">
                    Refacciones
                  </option>

                  <option value="COTIZACION_VEHICULO">
                    Cotización de vehículo
                  </option>

                  <option value="COTIZACION_GENERAL">
                    Cotización general
                  </option>

                  <option value="PRUEBA_MANEJO">
                    Prueba de manejo
                  </option>

                  <option value="FINANCIAMIENTO">
                    Financiamiento
                  </option>

                  <option value="CITA">
                    Citas
                  </option>

                  <option value="CONTACTO">
                    Contacto
                  </option>
                </AdminSelect>

                <AdminSelect
                  label="Sucursal"
                  name="sucursal"
                  defaultValue={
                    selectedBranchId
                      ? String(
                        selectedBranchId
                      )
                      : ""
                  }
                >
                  <option value="">
                    Todas las sucursales
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name} · {branch.city}
                      {!branch.active
                        ? " · Inactiva"
                        : ""}
                    </option>
                  ))}
                </AdminSelect>

                <AdminInput
                  label="Recibidas desde"
                  name="desde"
                  type="date"
                  defaultValue={dateFromValue}
                />

                <AdminInput
                  label="Recibidas hasta"
                  name="hasta"
                  type="date"
                  defaultValue={dateToValue}
                />
              </div>

              <div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row">
                {hasAdvancedFilters && (
                  <Link
                    href={
                      search
                        ? `/admin/leads?q=${encodeURIComponent(
                          search
                        )}`
                        : "/admin/leads"
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:text-[#192a3a]"
                  >
                    Limpiar secundarios
                  </Link>
                )}

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </details>
        </form>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((option) => (
            <LeadFilterPill
              key={option.value}
              href={buildLeadsHref({
                ...leadQueryState,
                status: option.value,
              })}
              active={
                statusFilter === option.value
              }
              label={option.label}
            />
          ))}
        </div>
      </section>

      {/* Resultados */}
      <section className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Resultados
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Solicitudes registradas
            </h2>

            {filteredLeadCount > 0 && (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Mostrando {firstVisibleLead}–{lastVisibleLead} de{" "}
                {filteredLeadCount}
              </p>
            )}
          </div>

          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600">
            {filteredLeadCount} solicitud
            {filteredLeadCount === 1 ? "" : "es"}
          </span>
        </div>

        {leads.length > 0 ? (
          <div className="grid gap-5">
            {leads.map((lead) => {
              const vehicleTitle =
                lead.vehicle
                  ? `${lead.vehicle.brand.name} ${lead.vehicle.name}`
                  : "Sin vehículo asociado";

              const businessCategory =
                getLeadBusinessCategory(lead);

              const businessLabel =
                getLeadBusinessLabel(
                  businessCategory
                );

              const businessClasses =
                getLeadBusinessClasses(
                  businessCategory
                );

              const BusinessIcon =
                getLeadBusinessIcon(
                  businessCategory
                );

              const whatsappMessage =
                getLeadWhatsAppMessage({
                  leadName: lead.name,
                  businessCategory,
                  vehicleTitle,
                  hasVehicle: Boolean(
                    lead.vehicle
                  ),
                });

              const whatsappHref =
                getWhatsAppHref(
                  lead.phone,
                  whatsappMessage
                );

              const mailHref =
                getMailHref(
                  lead.email,
                  `Grupo Rise - ${businessLabel}`,
                  whatsappMessage
                );

              const phoneNumber =
                cleanPhone(lead.phone);

              const phoneHref = phoneNumber
                ? `tel:${phoneNumber}`
                : "";

              const vehicleImage =
                lead.vehicle?.mainImage ||
                lead.vehicle?.images[0]
                  ?.url ||
                "";

              return (
                <article
                  key={lead.id}
                  className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="grid xl:grid-cols-[minmax(0,1fr)_340px_270px]">
                    {/* Cliente */}
                    <div className="min-w-0 p-5 md:p-6">
                      <div className="flex flex-wrap gap-2">
                        <LeadBadge
                          label={getLeadTypeLabel(
                            lead.type
                          )}
                          classes={getTypeClasses(
                            lead.type
                          )}
                        />

                        <LeadBadge
                          label={getLeadStatusLabel(
                            lead.status
                          )}
                          classes={getStatusClasses(
                            lead.status
                          )}
                        />

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${businessClasses}`}
                        >
                          <BusinessIcon
                            size={13}
                          />

                          {businessLabel}
                        </span>
                      </div>

                      <h3 className="mt-5 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                        {lead.name}
                      </h3>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <ContactDetail
                          icon={Phone}
                          label="Teléfono"
                          value={
                            lead.phone ||
                            "Sin teléfono"
                          }
                          href={phoneHref}
                        />

                        <ContactDetail
                          icon={Mail}
                          label="Correo"
                          value={
                            lead.email ||
                            "Sin correo"
                          }
                          href={mailHref}
                        />

                        <ContactDetail
                          icon={Clock}
                          label="Recibida"
                          value={formatCreatedAt(
                            lead.createdAt
                          )}
                        />

                        <ContactDetail
                          icon={MessageSquare}
                          label="Tipo"
                          value={businessLabel}
                        />
                      </div>

                      {lead.message && (
                        <div className="mt-5 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
                          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <MessageSquare
                              size={14}
                            />
                            Mensaje del cliente
                          </p>

                          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {lead.message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Relación */}
                    <div className="border-t border-slate-100 bg-[#f8fafb] p-5 md:p-6 xl:border-x xl:border-t-0">
                      {lead.vehicle ? (
                        <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <Car size={14} />
                            Vehículo relacionado
                          </p>

                          <div className="mt-4 flex gap-4">
                            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {vehicleImage ? (
                                <img
                                  src={vehicleImage}
                                  alt={
                                    vehicleTitle
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full place-items-center text-slate-400">
                                  <Car size={25} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-black text-[#192a3a]">
                                {vehicleTitle}
                              </p>

                              <p className="mt-1 text-sm font-black text-[#192a3a]">
                                {formatCurrency(
                                  lead.vehicle
                                    .price
                                )}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {
                                  lead.vehicle
                                    .year
                                }{" "}
                                ·{" "}
                                {
                                  lead.vehicle
                                    .branch.city
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <Link
                              href={`/admin/inventario/${lead.vehicle.id}/editar`}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#e7edf1] px-3 text-[10px] font-black text-[#192a3a] transition hover:bg-[#d9e2e8] active:scale-[0.98]"
                            >
                              Editar unidad
                              <ArrowUpRight
                                size={13}
                              />
                            </Link>

                            <Link
                              href={`/vehiculos/${lead.vehicle.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 transition hover:border-[#192a3a] hover:text-[#192a3a] active:scale-[0.98]"
                            >
                              Ver en sitio
                              <ArrowUpRight
                                size={13}
                              />
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <Car size={14} />
                            Solicitud general
                          </p>

                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                            {businessCategory ===
                              "REFACCIONES"
                              ? "Solicitud de cotización de refacciones."
                              : businessCategory ===
                                "SERVICIO"
                                ? "Solicitud de servicio o mantenimiento."
                                : "Esta solicitud no tiene un vehículo relacionado."}
                          </p>
                        </div>
                      )}

                      {lead.branch && (
                        <div className="mt-4 rounded-[18px] border border-slate-100 bg-white p-4">
                          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <Building2 size={14} />
                            Sucursal
                          </p>

                          <p className="mt-3 text-sm font-black text-[#192a3a]">
                            {lead.branch.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {lead.branch.city},{" "}
                            {lead.branch.state}
                          </p>
                        </div>
                      )}

                      {(lead.preferredDate ||
                        lead.preferredTime) && (
                          <div className="mt-4 rounded-[18px] border border-slate-100 bg-white p-4">
                            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                              <CalendarDays
                                size={14}
                              />
                              Fecha preferida
                            </p>

                            <p className="mt-3 text-sm font-black text-[#192a3a]">
                              {formatDate(
                                lead.preferredDate
                              )}
                            </p>

                            {lead.preferredTime && (
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {
                                  lead.preferredTime
                                }
                              </p>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Gestión */}
                    <LeadActions
                      leadId={lead.id}
                      status={lead.status}
                      whatsappHref={
                        whatsappHref
                      }
                      phoneHref={phoneHref}
                      mailHref={mailHref}
                      hasEmail={Boolean(
                        lead.email
                      )}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <MessageSquare
              size={50}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-2xl font-black">
              No hay solicitudes con estos filtros
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Modifica los filtros o limpia la
              búsqueda para ver más resultados.
            </p>

            <Link
              href="/admin/leads"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
            >
              Limpiar filtros
            </Link>
          </div>
        )}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeadCount}
          firstItem={firstVisibleLead}
          lastItem={lastVisibleLead}
          itemLabel="solicitud"
          itemLabelPlural="solicitudes"
          hrefForPage={(page) =>
            buildLeadsHref({
              ...leadQueryState,
              page,
            })
          }
        />
      </section>
    </div>
  );
}

function LeadBadge({
  label,
  classes,
}: {
  label: string;
  classes: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${classes}`}
    >
      {label}
    </span>
  );
}

function ContactDetail({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
        <Icon size={16} />
      </span>

      <span className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>

        <span className="mt-1 block truncate text-xs font-black text-slate-700">
          {value}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex min-w-0 items-center gap-3 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-3 transition hover:border-[#192a3a]/25 hover:bg-white"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-3">
      {content}
    </div>
  );
}

function LeadActions({
  leadId,
  status,
  whatsappHref,
  phoneHref,
  mailHref,
  hasEmail,
}: {
  leadId: number;
  status: LeadStatus;
  whatsappHref: string;
  phoneHref: string;
  mailHref: string;
  hasEmail: boolean;
}) {
  return (
    <aside className="border-t border-slate-100 bg-white p-5 md:p-6 xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Gestión
      </p>

      <form
        action={updateLeadStatus.bind(
          null,
          leadId
        )}
        className="mt-4 grid gap-3"
      >
        <AdminSelect
          label="Estado"
          name="status"
          defaultValue={status}
        >
          <option value="NUEVO">
            Nuevo
          </option>

          <option value="CONTACTADO">
            Contactado
          </option>

          <option value="EN_SEGUIMIENTO">
            En seguimiento
          </option>

          <option value="CERRADO">
            Cerrado
          </option>

          <option value="PERDIDO">
            Perdido
          </option>
        </AdminSelect>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
        >
          <BadgeCheck size={16} />
          Actualizar estado
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          Contactar
        </p>

        <div className="mt-3 grid gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}

          {phoneHref && (
            <a
              href={phoneHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Phone size={16} />
              Llamar
            </a>
          )}

          {hasEmail && (
            <a
              href={mailHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Mail size={16} />
              Enviar correo
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

function LeadFilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${active
        ? "border-[#192a3a] bg-[#192a3a] text-white"
        : "border-slate-200 bg-white text-slate-500 hover:border-[#192a3a] hover:text-[#192a3a]"
        }`}
    >
      {label}
    </Link>
  );
}