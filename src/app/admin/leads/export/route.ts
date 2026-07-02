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

  const rows = filteredLeads.map((lead) => [
    formatDateTime(lead.createdAt),
    lead.name,
    lead.phone,
    lead.email,
    getLeadTypeLabel(lead.type),
    getLeadStatusLabel(lead.status),
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
  ]);

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