import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { deletePublicFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

type InventoryHealthPageProps = {
  searchParams: Promise<{
    q?: string;
    problema?: string;
    error?: string;
    success?: string;
  }>;
};

type IssueKey =
  | "SIN_IMAGEN"
  | "SIN_DESCRIPCION"
  | "SIN_PRECIO"
  | "OCULTO"
  | "VISIBLE_NO_DISPONIBLE"
  | "MARCA_INACTIVA"
  | "SUCURSAL_INACTIVA"
  | "VENDIDO_APARTADO"
  | "SIN_GALERIA";

const issueOptions: {
  value: IssueKey | "TODOS";
  label: string;
}[] = [
    {
      value: "TODOS",
      label: "Todos",
    },
    {
      value: "SIN_IMAGEN",
      label: "Sin imagen",
    },
    {
      value: "SIN_DESCRIPCION",
      label: "Sin descripción",
    },
    {
      value: "SIN_PRECIO",
      label: "Sin precio válido",
    },
    {
      value: "OCULTO",
      label: "Ocultos",
    },
    {
      value: "VISIBLE_NO_DISPONIBLE",
      label: "Visible no disponible",
    },
    {
      value: "MARCA_INACTIVA",
      label: "Marca inactiva",
    },
    {
      value: "SUCURSAL_INACTIVA",
      label: "Sucursal inactiva",
    },
    {
      value: "VENDIDO_APARTADO",
      label: "Vendido / apartado",
    },
    {
      value: "SIN_GALERIA",
      label: "Sin galería",
    },
  ];

function getIssueLabel(issue: IssueKey) {
  const labels: Record<IssueKey, string> = {
    SIN_IMAGEN: "Sin imagen",
    SIN_DESCRIPCION: "Sin descripción",
    SIN_PRECIO: "Sin precio válido",
    OCULTO: "Oculto",
    VISIBLE_NO_DISPONIBLE:
      "Visible pero no disponible",
    MARCA_INACTIVA: "Marca inactiva",
    SUCURSAL_INACTIVA: "Sucursal inactiva",
    VENDIDO_APARTADO: "Vendido / apartado",
    SIN_GALERIA: "Sin galería",
  };

  return labels[issue];
}

function getIssueClasses(issue: IssueKey) {
  const classes: Record<IssueKey, string> = {
    SIN_IMAGEN:
      "border-amber-200 bg-amber-50 text-amber-700",

    SIN_DESCRIPCION:
      "border-amber-200 bg-amber-50 text-amber-700",

    SIN_PRECIO:
      "border-red-200 bg-red-50 text-red-700",

    OCULTO:
      "border-slate-200 bg-slate-100 text-slate-700",

    VISIBLE_NO_DISPONIBLE:
      "border-red-200 bg-red-50 text-red-700",

    MARCA_INACTIVA:
      "border-violet-200 bg-violet-50 text-violet-700",

    SUCURSAL_INACTIVA:
      "border-violet-200 bg-violet-50 text-violet-700",

    VENDIDO_APARTADO:
      "border-blue-200 bg-blue-50 text-blue-700",

    SIN_GALERIA:
      "border-amber-200 bg-amber-50 text-amber-700",
  };

  return classes[issue];
}

function getConditionLabel(
  condition: VehicleCondition
) {
  const labels: Record<
    VehicleCondition,
    string
  > = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition];
}

function getCategoryLabel(
  category: VehicleCategory
) {
  const labels: Record<
    VehicleCategory,
    string
  > = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todoterreno",
  };

  return labels[category];
}

function getStatusLabel(
  status: VehicleStatus
) {
  const labels: Record<
    VehicleStatus,
    string
  > = {
    DISPONIBLE: "Disponible",
    APARTADO: "Apartado",
    VENDIDO: "Vendido",
    EN_TRANSITO: "En tránsito",
    PROXIMAMENTE: "Próximamente",
    INACTIVO: "Inactivo",
  };

  return labels[status];
}

function getVehiclePublicTarget(vehicle: {
  active: boolean;
  condition: VehicleCondition;
  status: VehicleStatus;

  brand: {
    active: boolean;
  };

  branch: {
    active: boolean;
  };
}) {
  const canAppearPublicly =
    vehicle.active &&
    vehicle.status ===
    VehicleStatus.DISPONIBLE &&
    vehicle.brand.active &&
    vehicle.branch.active;

  if (!canAppearPublicly) {
    return "No publicado";
  }

  if (
    vehicle.condition ===
    VehicleCondition.NUEVO
  ) {
    return "Catálogo";
  }

  return "Seminuevos";
}

function getVehicleIssues(vehicle: {
  mainImage: string | null;
  description: string | null;
  price: number;
  active: boolean;
  status: VehicleStatus;

  brand: {
    active: boolean;
  };

  branch: {
    active: boolean;
  };

  images: {
    type: VehicleMediaType;
  }[];
}): IssueKey[] {
  const issues: IssueKey[] = [];

  const hasImage =
    Boolean(vehicle.mainImage) ||
    vehicle.images.some(
      (image) =>
        image.type === VehicleMediaType.IMAGE
    );

  const hasGalleryImage =
    vehicle.images.some(
      (image) =>
        image.type === VehicleMediaType.IMAGE
    );

  if (!hasImage) {
    issues.push("SIN_IMAGEN");
  }

  if (!vehicle.description?.trim()) {
    issues.push("SIN_DESCRIPCION");
  }

  if (!vehicle.price || vehicle.price <= 0) {
    issues.push("SIN_PRECIO");
  }

  if (!vehicle.active) {
    issues.push("OCULTO");
  }

  if (
    vehicle.active &&
    vehicle.status !== VehicleStatus.DISPONIBLE
  ) {
    issues.push("VISIBLE_NO_DISPONIBLE");
  }

  if (!vehicle.brand.active) {
    issues.push("MARCA_INACTIVA");
  }

  if (!vehicle.branch.active) {
    issues.push("SUCURSAL_INACTIVA");
  }

  if (
    vehicle.status === VehicleStatus.VENDIDO ||
    vehicle.status === VehicleStatus.APARTADO
  ) {
    issues.push("VENDIDO_APARTADO");
  }

  if (!hasGalleryImage) {
    issues.push("SIN_GALERIA");
  }

  return issues;
}

function buildHealthHref(
  issue: string,
  search = ""
) {
  const params = new URLSearchParams();

  if (issue !== "TODOS") {
    params.set("problema", issue);
  }

  if (search.trim()) {
    params.set("q", search.trim());
  }

  const query = params.toString();

  return query
    ? `/admin/inventario/salud?${query}`
    : "/admin/inventario/salud";
}

async function hideVehicle(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  if (!vehicleId) {
    return;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },

    data: {
      active: false,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);
}

async function markVehicleInactive(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  if (!vehicleId) {
    return;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },

    data: {
      active: false,
      status: VehicleStatus.INACTIVO,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);
}

async function deleteVehicle(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const confirmText = String(
    formData.get("confirmText") || ""
  ).trim();

  if (!vehicleId) {
    redirect(
      `/admin/inventario/salud?error=${encodeURIComponent(
        "No se pudo identificar la unidad."
      )}`
    );
  }

  if (confirmText !== "ELIMINAR") {
    redirect(
      `/admin/inventario/salud?error=${encodeURIComponent(
        "Para eliminar la unidad debes escribir ELIMINAR."
      )}`
    );
  }

  const leadCount =
    await prisma.lead.count({
      where: {
        vehicleId,
      },
    });

  if (leadCount > 0) {
    redirect(
      `/admin/inventario/salud?error=${encodeURIComponent(
        `No se puede eliminar la unidad porque tiene ${leadCount} solicitud(es) asociada(s). Mejor ocúltala o márcala como inactiva.`
      )}`
    );
  }

  const vehicle =
    await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },

      include: {
        images: true,
      },
    });

  if (!vehicle) {
    redirect(
      `/admin/inventario/salud?error=${encodeURIComponent(
        "La unidad ya no existe."
      )}`
    );
  }

  const urlsToDelete = new Set(
    [
      vehicle.mainImage,

      ...vehicle.images.map(
        (image) => image.url
      ),
    ].filter(
      (url): url is string => Boolean(url)
    )
  );

  await prisma.$transaction([
    prisma.vehicleBranch.deleteMany({
      where: {
        vehicleId,
      },
    }),

    prisma.vehicleImage.deleteMany({
      where: {
        vehicleId,
      },
    }),

    prisma.vehicle.delete({
      where: {
        id: vehicleId,
      },
    }),
  ]);

  for (const url of urlsToDelete) {
    if (url.startsWith("/uploads/")) {
      try {
        await deletePublicFile(url);
      } catch (error) {
        console.error(
          `No se pudo eliminar el archivo ${url}`,
          error
        );
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect(
    `/admin/inventario/salud?success=${encodeURIComponent(
      "Unidad eliminada correctamente."
    )}`
  );
}

export default async function InventoryHealthPage({
  searchParams,
}: InventoryHealthPageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";

  const normalizedSearch =
    search.toLowerCase();

  const issueFilter =
    params.problema ?? "TODOS";

  const vehicles =
    await prisma.vehicle.findMany({
      include: {
        brand: true,
        branch: true,

        images: {
          orderBy: {
            order: "asc",
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  const rows = vehicles
    .map((vehicle) => {
      const issues =
        getVehicleIssues(vehicle);

      const image =
        vehicle.images.find(
          (item) =>
            item.type ===
            VehicleMediaType.IMAGE
        )?.url ||
        vehicle.mainImage ||
        "";

      return {
        vehicle,
        issues,
        image,

        publicTarget:
          getVehiclePublicTarget(vehicle),
      };
    })
    .filter(
      (row) => row.issues.length > 0
    );

  const filteredRows = rows.filter(
    (row) => {
      const matchesIssue =
        issueFilter === "TODOS" ||
        row.issues.includes(
          issueFilter as IssueKey
        );

      if (!matchesIssue) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        row.vehicle.id,
        row.vehicle.name,
        row.vehicle.model,
        row.vehicle.brand.name,
        row.vehicle.branch.name,
        row.vehicle.branch.city,
        row.vehicle.year,
        row.publicTarget,

        getConditionLabel(
          row.vehicle.condition
        ),

        getStatusLabel(
          row.vehicle.status
        ),

        ...row.issues.map(getIssueLabel),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    }
  );

  const issueStats = issueOptions
    .filter(
      (option) => option.value !== "TODOS"
    )
    .map((option) => ({
      ...option,

      count: rows.filter((row) =>
        row.issues.includes(
          option.value as IssueKey
        )
      ).length,
    }));

  const withoutImage =
    issueStats.find(
      (item) => item.value === "SIN_IMAGEN"
    )?.count ?? 0;

  const hiddenVehicles =
    issueStats.find(
      (item) => item.value === "OCULTO"
    )?.count ?? 0;

  const visibleUnavailable =
    issueStats.find(
      (item) =>
        item.value ===
        "VISIBLE_NO_DISPONIBLE"
    )?.count ?? 0;

  const hasFilters =
    Boolean(search) ||
    issueFilter !== "TODOS";

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <Link
              href="/admin/inventario"
              className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Volver al inventario
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <ShieldAlert size={15} />
              Salud del inventario
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Revisión de registros
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Detecta unidades incompletas,
              ocultas, sin imágenes o con problemas
              que impiden su publicación.
            </p>
          </div>

          <Link
            href="/admin/inventario/nuevo"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            <Plus size={18} />
            Registrar unidad

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* Mensajes */}
      {params.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
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
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthStatCard
          icon={AlertTriangle}
          value={rows.length}
          label="Con alertas"
          description="Unidades con uno o más problemas."
          tone="amber"
        />

        <HealthStatCard
          icon={ImageIcon}
          value={withoutImage}
          label="Sin imagen"
          description="No cuentan con imagen principal."
          tone="navy"
        />

        <HealthStatCard
          icon={EyeOff}
          value={hiddenVehicles}
          label="Ocultas"
          description="No aparecen actualmente en público."
          tone="slate"
        />

        <HealthStatCard
          icon={ShieldAlert}
          value={visibleUnavailable}
          label="No disponibles"
          description="Visibles pero con otro estado."
          tone="red"
        />
      </section>

      {/* Filtros */}
      <section className="mt-6 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Buscar y revisar
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Registros problemáticos
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Busca por vehículo, marca,
              sucursal o tipo de problema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              {filteredRows.length} resultado
              {filteredRows.length === 1
                ? ""
                : "s"}
            </span>

            {hasFilters && (
              <Link
                href="/admin/inventario/salud"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        </div>

        <form
          action="/admin/inventario/salud"
          className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px_auto]"
        >
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              Buscar
            </span>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                name="q"
                defaultValue={search}
                placeholder="Unidad, marca, sucursal, año..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              Tipo de problema
            </span>

            <select
              name="problema"
              defaultValue={issueFilter}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
            >
              {issueOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] lg:self-end"
          >
            <Search size={17} />
            Buscar
          </button>
        </form>

        {/* Accesos por problema */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {issueOptions.map((option) => {
            const stat =
              issueStats.find(
                (item) =>
                  item.value === option.value
              );

            const count =
              option.value === "TODOS"
                ? rows.length
                : stat?.count ?? 0;

            return (
              <Link
                key={option.value}
                href={buildHealthHref(
                  option.value,
                  search
                )}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${issueFilter === option.value
                    ? "border-[#192a3a] bg-[#192a3a] text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-[#192a3a] hover:text-[#192a3a]"
                  }`}
              >
                {option.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] ${issueFilter === option.value
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Resultados */}
      <section className="mt-6">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#192a3a]" />

            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
              Resultados
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Unidades que requieren revisión
          </h2>
        </div>

        {filteredRows.length > 0 ? (
          <div className="grid gap-5">
            {filteredRows.map(
              ({
                vehicle,
                issues,
                image,
                publicTarget,
              }) => (
                <article
                  key={vehicle.id}
                  className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="grid xl:grid-cols-[200px_minmax(0,1fr)_290px]">
                    {/* Imagen */}
                    <div className="relative h-[220px] overflow-hidden bg-slate-100 sm:h-[280px] xl:h-full xl:min-h-[320px]">
                      {image ? (
                        <img
                          src={image}
                          alt={`${vehicle.brand.name} ${vehicle.name}`}
                          className="h-full w-full object-cover transition duration-700 hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <div className="text-center">
                            <ImageIcon
                              size={42}
                              className="mx-auto"
                            />

                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em]">
                              Sin imagen
                            </p>
                          </div>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#192a3a] shadow-sm backdrop-blur-sm">
                        ID #{vehicle.id}
                      </span>
                    </div>

                    {/* Datos */}
                    <div className="min-w-0 p-5 md:p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                            {vehicle.brand.name}
                          </p>

                          <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] md:text-3xl">
                            {vehicle.name}
                          </h3>

                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            {vehicle.year} ·{" "}
                            {getCategoryLabel(
                              vehicle.category
                            )}{" "}
                            ·{" "}
                            {getConditionLabel(
                              vehicle.condition
                            )}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${publicTarget ===
                              "Catálogo" ||
                              publicTarget ===
                              "Seminuevos"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                        >
                          {publicTarget}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        <RecordDetail
                          label="Precio"
                          value={formatCurrency(
                            vehicle.price
                          )}
                        />

                        <RecordDetail
                          label="Estado"
                          value={getStatusLabel(
                            vehicle.status
                          )}
                        />

                        <RecordDetail
                          label="Sucursal"
                          value={`${vehicle.branch.name} · ${vehicle.branch.city}`}
                        />

                        <RecordDetail
                          label="Visibilidad"
                          value={
                            vehicle.active
                              ? "Visible"
                              : "Oculto"
                          }
                        />
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Problemas detectados
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <span
                              key={issue}
                              className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${getIssueClasses(
                                issue
                              )}`}
                            >
                              {getIssueLabel(issue)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <HealthActions
                      vehicleId={vehicle.id}
                    />
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <CheckCircle2
              size={50}
              className="mx-auto text-emerald-600"
            />

            <h3 className="mt-4 text-2xl font-black">
              No hay registros con ese criterio
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Cambia los filtros o limpia la
              búsqueda para mostrar más resultados.
            </p>

            {hasFilters && (
              <Link
                href="/admin/inventario/salud"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthStatCard({
  icon: Icon,
  value,
  label,
  description,
  tone,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  description: string;
  tone: "navy" | "amber" | "slate" | "red";
}) {
  const tones = {
    navy: "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",

    amber:
      "border-amber-100 bg-amber-50 text-amber-700",

    slate:
      "border-slate-200 bg-slate-100 text-slate-700",

    red: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl border ${tones[tone]}`}
      >
        <Icon size={21} />
      </span>

      <p className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#192a3a]">
        {value}
      </p>

      <h2 className="mt-2 text-sm font-black">
        {label}
      </h2>

      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function RecordDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-xs font-black text-slate-700">
        {value}
      </p>
    </div>
  );
}

function HealthActions({
  vehicleId,
}: {
  vehicleId: number;
}) {
  return (
    <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 xl:border-l xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Acciones
      </p>

      <div className="mt-4 grid gap-3">
        <Link
          href={`/admin/inventario/${vehicleId}/editar`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
        >
          <Pencil size={16} />
          Corregir unidad
        </Link>

        <Link
          href={`/vehiculos/${vehicleId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
        >
          <Eye size={16} />
          Ver en sitio
        </Link>

        <form action={hideVehicle}>
          <input
            type="hidden"
            name="vehicleId"
            value={vehicleId}
          />

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
          >
            <EyeOff size={16} />
            Ocultar unidad
          </button>
        </form>

        <form action={markVehicleInactive}>
          <input
            type="hidden"
            name="vehicleId"
            value={vehicleId}
          />

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
          >
            <XCircle size={16} />
            Marcar inactiva
          </button>
        </form>

        <details className="group rounded-xl border border-red-200 bg-red-50">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-red-700">
            <Trash2 size={15} />
            Eliminar unidad
          </summary>

          <div className="border-t border-red-100 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-xs font-black text-red-700">
                  Acción irreversible
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Solo podrá eliminarse cuando no
                  tenga solicitudes asociadas.
                </p>
              </div>
            </div>

            <form
              action={deleteVehicle}
              className="mt-4 grid gap-3"
            >
              <input
                type="hidden"
                name="vehicleId"
                value={vehicleId}
              />

              <input
                name="confirmText"
                placeholder="Escribe ELIMINAR"
                autoComplete="off"
                className="h-11 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 outline-none placeholder:text-red-300 focus:border-red-400"
              />

              <button
                type="submit"
                className="h-11 rounded-xl bg-red-600 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                Eliminar definitivamente
              </button>
            </form>
          </div>
        </details>
      </div>
    </aside>
  );
}