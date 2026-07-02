import { LeadStatus, LeadType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getLeadTypeFilter(value: string | null): LeadType | "TODOS" {
  if (value && Object.values(LeadType).includes(value as LeadType)) {
    return value as LeadType;
  }

  return "TODOS";
}

function getLeadStatusFilter(value: string | null): LeadStatus | "TODOS" {
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

type LeadBusinessCategory =
  | "SERVICIO"
  | "REFACCIONES"
  | "COTIZACION_VEHICULO"
  | "COTIZACION_GENERAL"
  | "PRUEBA_MANEJO"
  | "FINANCIAMIENTO"
  | "CONTACTO"
  | "CITA";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getLeadBusinessCategory(lead: {
  type: LeadType;
  message: string | null;
  vehicle?: { id: number } | null;
}): LeadBusinessCategory {
  const message = normalizeText(lead.message ?? "");

  if (
    lead.type === LeadType.SERVICIO ||
    message.includes("solicitud de servicio") ||
    message.includes("servicio / mantenimiento")
  ) {
    return "SERVICIO";
  }

  if (
    message.includes("cotizacion de refacciones") ||
    message.includes("refaccion solicitada")
  ) {
    return "REFACCIONES";
  }

  if (lead.type === LeadType.COTIZACION && lead.vehicle) {
    return "COTIZACION_VEHICULO";
  }

  if (lead.type === LeadType.COTIZACION) {
    return "COTIZACION_GENERAL";
  }

  if (lead.type === LeadType.PRUEBA_MANEJO) {
    return "PRUEBA_MANEJO";
  }

  if (lead.type === LeadType.FINANCIAMIENTO) {
    return "FINANCIAMIENTO";
  }

  if (lead.type === LeadType.CITA) {
    return "CITA";
  }

  return "CONTACTO";
}

function getLeadBusinessLabel(category: LeadBusinessCategory) {
  const labels: Record<LeadBusinessCategory, string> = {
    SERVICIO: "Servicio / mantenimiento",
    REFACCIONES: "Cotización de refacciones",
    COTIZACION_VEHICULO: "Cotización de vehículo",
    COTIZACION_GENERAL: "Cotización general",
    PRUEBA_MANEJO: "Prueba de manejo",
    FINANCIAMIENTO: "Financiamiento",
    CONTACTO: "Contacto",
    CITA: "Cita",
  };

  return labels[category];
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ").trim();

  if (text.includes(",") || text.includes('"') || text.includes(";")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function getFilename() {
  const date = new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "-");

  return `leads-grupo-rise-${date}.csv`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const typeFilter = getLeadTypeFilter(searchParams.get("tipo"));
  const statusFilter = getLeadStatusFilter(searchParams.get("estado"));
  const search = searchParams.get("q")?.trim().toLowerCase() ?? "";

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

  const leads = await prisma.lead.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      vehicle: {
        include: {
          brand: true,
          branch: true,
        },
      },
      branch: true,
    },
  });

  const filteredLeads = leads.filter((lead) => {
    if (!search) {
      return true;
    }

    const searchableText = [
      lead.name,
      lead.phone,
      lead.email,
      lead.message,
      lead.vehicle?.name,
      lead.vehicle?.model,
      lead.vehicle?.brand.name,
      lead.branch?.name,
      lead.branch?.city,
      getLeadTypeLabel(lead.type),
      getLeadStatusLabel(lead.status),
      getLeadBusinessLabel(getLeadBusinessCategory(lead)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const headers = [
    "Fecha de registro",
    "Nombre",
    "Teléfono",
    "Correo",
    "Tipo de solicitud",
    "Estado",
    "Categoría comercial",
    "Vehículo",
    "Marca",
    "Modelo",
    "Año",
    "Precio",
    "Sucursal lead",
    "Sucursal vehículo",
    "Ciudad",
    "Fecha preferida",
    "Hora preferida",
    "Mensaje",
  ];

  const rows = filteredLeads.map((lead) => {
    const businessCategory = getLeadBusinessCategory(lead);

    return [
      formatDateTime(lead.createdAt),
      lead.name,
      lead.phone,
      lead.email,
      getLeadTypeLabel(lead.type),
      getLeadStatusLabel(lead.status),
      getLeadBusinessLabel(businessCategory),
      lead.vehicle?.name ?? "",
      lead.vehicle?.brand.name ?? "",
      lead.vehicle?.model ?? "",
      lead.vehicle?.year ?? "",
      lead.vehicle?.price ?? "",
      lead.branch?.name ?? "",
      lead.vehicle?.branch.name ?? "",
      lead.branch?.city ?? lead.vehicle?.branch.city ?? "",
      formatDate(lead.preferredDate),
      lead.preferredTime ?? "",
      lead.message ?? "",
    ];
  });

  const csv = buildCsv([headers, ...rows]);

  /**
   * BOM para que Excel abra bien acentos y eñes.
   */
  const csvWithBom = `\uFEFF${csv}`;

  return new Response(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}