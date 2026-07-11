import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
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
  Users,
  Trash2,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminBranchesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

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

function splitServices(
  value?: string | null
) {
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
  vehicles: {
    id: number;
  }[];
}) {
  const issues: string[] = [];

  if (!branch.address?.trim()) {
    issues.push("Sin dirección");
  }

  if (!branch.phone?.trim()) {
    issues.push("Sin teléfono");
  }

  if (!branch.whatsapp?.trim()) {
    issues.push("Sin WhatsApp");
  }

  if (!branch.email?.trim()) {
    issues.push("Sin correo");
  }

  if (!branch.schedule?.trim()) {
    issues.push("Sin horario");
  }

  if (!branch.services?.trim()) {
    issues.push("Sin servicios");
  }

  if (!branch.googleMapsUrl?.trim()) {
    issues.push("Sin Google Maps");
  }

  if (
    !branch.active &&
    branch.vehicles.length > 0
  ) {
    issues.push(
      "Inactiva con vehículos disponibles"
    );
  }

  return issues;
}

function revalidateBranchPaths(
  branchId?: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/sucursales");
  revalidatePath("/sucursales");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

  if (branchId) {
    revalidatePath(
      `/sucursales/${branchId}`
    );
  }
}

async function toggleBranchActive(
  branchId: number
) {
  "use server";

  await requireAdmin();

  if (!branchId) {
    return;
  }

  const branch =
    await prisma.branch.findUnique({
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

  revalidateBranchPaths(branchId);
}

async function deleteBranch(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const branchId = Number(
    formData.get("branchId")
  );

  const confirmText = String(
    formData.get("confirmText") || ""
  ).trim();

  if (!branchId) {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        "No se pudo identificar la sucursal."
      )}`
    );
  }

  if (confirmText !== "ELIMINAR") {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        "Para eliminar la sucursal debes escribir ELIMINAR."
      )}`
    );
  }

  const branch =
    await prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
        name: true,

        _count: {
          select: {
            vehicles: true,
            leads: true,
          },
        },
      },
    });

  if (!branch) {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        "La sucursal ya no existe."
      )}`
    );
  }

  if (branch._count.vehicles > 0) {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        `No se puede eliminar "${branch.name}" porque tiene ${branch._count.vehicles} vehículo(s) asociado(s). Primero reasigna o elimina esas unidades.`
      )}`
    );
  }

  if (branch._count.leads > 0) {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        `No se puede eliminar "${branch.name}" porque tiene ${branch._count.leads} solicitud(es) asociada(s). Puedes ocultarla en lugar de eliminarla.`
      )}`
    );
  }

  await prisma.branch.delete({
    where: {
      id: branchId,
    },
  });

  revalidateBranchPaths(branchId);

  redirect(
    `/admin/sucursales?success=${encodeURIComponent(
      "Sucursal eliminada correctamente."
    )}`
  );
}

export default async function AdminBranchesPage({
  searchParams,
}: AdminBranchesPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const branches =
    await prisma.branch.findMany({
      include: {
        vehicles: {
          where: {
            active: true,
            status:
              VehicleStatus.DISPONIBLE,
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
        _count: {
          select: {
            vehicles: true,
            leads: true,
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

  const active = branches.filter(
    (branch) => branch.active
  ).length;

  const inactive = total - active;

  const totalVehicles = branches.reduce(
    (sum, branch) =>
      sum + branch.vehicles.length,
    0
  );

  const totalNewVehicles =
    branches.reduce(
      (sum, branch) =>
        sum +
        branch.vehicles.filter(
          (vehicle) =>
            vehicle.condition ===
            VehicleCondition.NUEVO
        ).length,
      0
    );

  const totalUsedVehicles =
    branches.reduce(
      (sum, branch) =>
        sum +
        branch.vehicles.filter(
          (vehicle) =>
            vehicle.condition ===
            VehicleCondition.SEMINUEVO
        ).length,
      0
    );

  const totalLeads = branches.reduce(
    (sum, branch) =>
      sum + branch.leads.length,
    0
  );

  const branchesWithIssues =
    branches.filter(
      (branch) =>
        getBranchIssues(branch).length > 0
    ).length;

  const stats = [
    {
      label: "Sucursales",
      value: total,
      description:
        "Ubicaciones registradas.",
      icon: Building2,
      tone: "navy" as const,
    },
    {
      label: "Activas",
      value: active,
      description:
        "Visibles en el sitio público.",
      icon: Store,
      tone: "emerald" as const,
    },
    {
      label: "Inactivas",
      value: inactive,
      description:
        "Ocultas para los visitantes.",
      icon: EyeOff,
      tone: "slate" as const,
    },
    {
      label: "Vehículos",
      value: totalVehicles,
      description:
        "Unidades disponibles relacionadas.",
      icon: Car,
      tone: "blue" as const,
    },
    {
      label: "Solicitudes",
      value: totalLeads,
      description:
        "Leads relacionados con sucursales.",
      icon: Users,
      tone: "violet" as const,
    },
    {
      label: "Con alertas",
      value: branchesWithIssues,
      description:
        "Sucursales con datos incompletos.",
      icon: AlertTriangle,
      tone: "amber" as const,
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
              <Building2 size={15} />
              Administración
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Sucursales
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Gestiona ubicaciones,
              teléfonos, horarios, servicios,
              mapas y disponibilidad pública.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sucursales"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              Ver sitio
              <ExternalLink size={16} />
            </Link>

            <Link
              href="/admin/sucursales/nueva"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Plus size={18} />
              Nueva sucursal

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>

      {params.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.error}</span>
        </div>
      )}

      {params.success && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700"
        >
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.success}</span>
        </div>
      )}

      {/* Estadísticas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <BranchStatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </section>

      {/* Listado */}
      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Registro
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Sucursales registradas
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Esta información alimenta la
              sección pública de ubicaciones y
              relaciona vehículos y solicitudes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              <BadgeCheck size={15} />
              {totalNewVehicles} nuevos
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              <Car size={15} />
              {totalUsedVehicles} seminuevos
            </span>
          </div>
        </div>

        {branches.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {branches.map((branch) => {
              const services =
                splitServices(branch.services);

              const issues =
                getBranchIssues(branch);

              const newVehicles =
                branch.vehicles.filter(
                  (vehicle) =>
                    vehicle.condition ===
                    VehicleCondition.NUEVO
                ).length;

              const usedVehicles =
                branch.vehicles.filter(
                  (vehicle) =>
                    vehicle.condition ===
                    VehicleCondition.SEMINUEVO
                ).length;

              const whatsappHref =
                getWhatsAppHref(
                  branch.whatsapp,
                  `Hola, me gustaría recibir información de ${branch.name}.`
                );

              const phone = cleanPhone(
                branch.phone
              );

              const mapUrl =
                getMapExternalUrl(branch);

              return (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  services={services}
                  issues={issues}
                  newVehicles={newVehicles}
                  usedVehicles={usedVehicles}
                  whatsappHref={
                    whatsappHref
                  }
                  phone={phone}
                  mapUrl={mapUrl}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-[#f8fafb] p-10 text-center">
            <Building2
              size={50}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-2xl font-black">
              Sin sucursales
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Registra la primera sucursal para
              comenzar a estructurar el sitio.
            </p>

            <Link
              href="/admin/sucursales/nueva"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nueva sucursal
            </Link>
          </div>
        )}
      </section>

      {/* Resumen */}
      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="text-sm font-black text-[#192a3a]">
          Resumen de sucursales
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Hay {active} sucursales activas,
          {` ${inactive} `}ocultas y
          {` ${branchesWithIssues} `}
          con información que requiere revisión.
        </p>
      </section>
    </div>
  );
}

function BranchStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone:
  | "navy"
  | "blue"
  | "emerald"
  | "slate"
  | "violet"
  | "amber";
}) {
  const tones = {
    navy:
      "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",

    blue:
      "border-blue-100 bg-blue-50 text-blue-700",

    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    slate:
      "border-slate-200 bg-slate-100 text-slate-700",

    violet:
      "border-violet-100 bg-violet-50 text-violet-700",

    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl border ${tones[tone]}`}
      >
        <Icon size={20} />
      </span>

      <p className="mt-5 text-3xl font-black tracking-[-0.05em] text-[#192a3a]">
        {value}
      </p>

      <h2 className="mt-2 text-xs font-black uppercase tracking-[0.08em]">
        {label}
      </h2>

      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function BranchCard({
  branch,
  services,
  issues,
  newVehicles,
  usedVehicles,
  whatsappHref,
  phone,
  mapUrl,
}: {
  branch: {
    id: number;
    name: string;
    city: string;
    state: string;
    address: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    logoUrl: string | null;
    active: boolean;

    vehicles: {
      id: number;
      condition: VehicleCondition;
    }[];

    leads: {
      id: number;
    }[];
    _count: {
      vehicles: number;
      leads: number;
    };
  };

  services: string[];
  issues: string[];
  newVehicles: number;
  usedVehicles: number;
  whatsappHref: string;
  phone: string;
  mapUrl: string;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] border border-slate-100 bg-[#f8fafb] transition duration-300 hover:border-[#192a3a]/20 hover:bg-white hover:shadow-[0_16px_35px_rgba(15,23,42,0.07)]">
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${branch.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
            >
              {branch.active ? (
                <Eye size={13} />
              ) : (
                <EyeOff size={13} />
              )}

              {branch.active
                ? "Activa"
                : "Inactiva"}
            </span>

            <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-[#192a3a]">
              {branch.name}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {branch.city}, {branch.state}
            </p>
          </div>

          {branch.logoUrl ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-2">
              <img
                src={branch.logoUrl}
                alt={`Logo ${branch.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
              <Building2 size={20} />
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <BranchContactItem
            icon={MapPin}
            value={branch.address}
          />

          <BranchContactItem
            icon={Phone}
            value={
              branch.phone ||
              "Sin teléfono"
            }
            href={
              phone
                ? `tel:${phone}`
                : undefined
            }
          />

          <BranchContactItem
            icon={Mail}
            value={
              branch.email || "Sin correo"
            }
            href={
              branch.email
                ? `mailto:${branch.email}`
                : undefined
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <BranchMiniStat
            label="Total"
            value={branch.vehicles.length}
          />

          <BranchMiniStat
            label="Nuevos"
            value={newVehicles}
          />

          <BranchMiniStat
            label="Semi"
            value={usedVehicles}
          />

          <BranchMiniStat
            label="Leads"
            value={branch.leads.length}
          />
        </div>

        {services.length > 0 && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Servicios
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {services
                .slice(0, 5)
                .map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black text-slate-600"
                  >
                    <CheckCircle2
                      size={12}
                      className="text-emerald-600"
                    />

                    {service}
                  </span>
                ))}

              {services.length > 5 && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black text-slate-400">
                  +{services.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">
              <AlertTriangle size={14} />
              Requiere revisión
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {issues
                .slice(0, 4)
                .map((issue) => (
                  <span
                    key={issue}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[9px] font-black text-amber-700"
                  >
                    {issue}
                  </span>
                ))}

              {issues.length > 4 && (
                <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[9px] font-black text-amber-700">
                  +{issues.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <BranchActions
        branchId={branch.id}
        active={branch.active}
        whatsappHref={whatsappHref}
        mapUrl={mapUrl}
        relatedVehicles={
          branch._count.vehicles
        }
        relatedLeads={
          branch._count.leads
        }
      />
    </article>
  );
}

function BranchContactItem({
  icon: Icon,
  value,
  href,
}: {
  icon: LucideIcon;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
        <Icon size={15} />
      </span>

      <span className="min-w-0 truncate text-xs font-black text-slate-600">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex min-w-0 items-center gap-3 rounded-[14px] border border-slate-100 bg-white p-3 transition hover:border-[#192a3a]/25"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-slate-100 bg-white p-3">
      {content}
    </div>
  );
}

function BranchMiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[13px] border border-slate-100 bg-white p-3 text-center">
      <p className="text-lg font-black text-[#192a3a]">
        {value}
      </p>

      <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function BranchActions({
  branchId,
  active,
  whatsappHref,
  mapUrl,
  relatedVehicles,
  relatedLeads,
}: {
  branchId: number;
  active: boolean;
  whatsappHref: string;
  mapUrl: string;
  relatedVehicles: number;
  relatedLeads: number;
}) {
  const hasRelations =
    relatedVehicles > 0 ||
    relatedLeads > 0;

  return (
    <div className="border-t border-slate-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/admin/sucursales/${branchId}/editar`}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-3 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
        >
          Editar

          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:text-[#192a3a] active:scale-[0.98]"
        >
          Mapa
          <ExternalLink size={14} />
        </a>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        ) : (
          <span className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-black text-slate-400">
            Sin WhatsApp
          </span>
        )}

        <form
          action={toggleBranchActive.bind(
            null,
            branchId
          )}
        >
          <button
            type="submit"
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition active:scale-[0.98] ${
              active
                ? "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a] hover:bg-[#d9e2e8]"
            }`}
          >
            {active ? (
              <>
                <EyeOff size={15} />
                Ocultar
              </>
            ) : (
              <>
                <Eye size={15} />
                Activar
              </>
            )}
          </button>
        </form>
      </div>

      <details className="group mt-3 rounded-xl border border-red-200 bg-red-50">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-red-700">
          <Trash2 size={15} />
          Eliminar sucursal
        </summary>

        <div className="border-t border-red-100 p-4">
          <div className="flex gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-xs font-black text-red-700">
                {hasRelations
                  ? "Eliminación bloqueada"
                  : "Acción irreversible"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {hasRelations
                  ? `La sucursal tiene ${relatedVehicles} vehículo(s) y ${relatedLeads} solicitud(es) asociada(s). Primero debes reasignar o eliminar esos registros.`
                  : "La sucursal no tiene vehículos ni solicitudes asociadas. Escribe ELIMINAR para confirmar."}
              </p>
            </div>
          </div>

          <form
            action={deleteBranch}
            className="mt-4 grid gap-3"
          >
            <input
              type="hidden"
              name="branchId"
              value={branchId}
            />

            <input
              name="confirmText"
              placeholder="Escribe ELIMINAR"
              autoComplete="off"
              disabled={hasRelations}
              className="h-11 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 outline-none placeholder:text-red-300 focus:border-red-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />

            <button
              type="submit"
              disabled={hasRelations}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 size={15} />
              Eliminar definitivamente
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}