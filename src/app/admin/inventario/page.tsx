import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Gauge,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { deletePublicFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const conditionOptions = [
  "TODAS",
  "NUEVO",
  "SEMINUEVO",
] as const;

const statusOptions = [
  "TODOS",
  "DISPONIBLE",
  "APARTADO",
  "VENDIDO",
  "EN_TRANSITO",
  "PROXIMAMENTE",
  "INACTIVO",
] as const;

const visibilityOptions = [
  "TODOS",
  "ACTIVO",
  "OCULTO",
] as const;

const validVehicleConditions = [
  "NUEVO",
  "SEMINUEVO",
] as const;

const validVehicleStatuses = [
  "DISPONIBLE",
  "APARTADO",
  "VENDIDO",
  "EN_TRANSITO",
  "PROXIMAMENTE",
  "INACTIVO",
] as const;

type ConditionFilter =
  (typeof conditionOptions)[number];

type StatusFilter =
  (typeof statusOptions)[number];

type VisibilityFilter =
  (typeof visibilityOptions)[number];

type VehicleConditionValue =
  (typeof validVehicleConditions)[number];

type VehicleStatusValue =
  (typeof validVehicleStatuses)[number];

type AdminInventoryPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    condicion?: string;
    estado?: string;
    visibilidad?: string;
    sucursal?: string;
    error?: string;
    success?: string;
  }>;
};

function getConditionLabel(condition: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition] ?? condition;
}

function getStatusLabel(status: string) {
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

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todoterreno",
  };

  return labels[category] ?? category;
}

function getConditionClasses(condition: string) {
  const classes: Record<string, string> = {
    NUEVO:
      "border-blue-200 bg-blue-50 text-blue-700",
    SEMINUEVO:
      "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    classes[condition] ??
    "border-slate-200 bg-slate-100 text-slate-600"
  );
}

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    DISPONIBLE:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    APARTADO:
      "border-amber-200 bg-amber-50 text-amber-700",
    VENDIDO:
      "border-red-200 bg-red-50 text-red-700",
    EN_TRANSITO:
      "border-blue-200 bg-blue-50 text-blue-700",
    PROXIMAMENTE:
      "border-violet-200 bg-violet-50 text-violet-700",
    INACTIVO:
      "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    classes[status] ??
    "border-slate-200 bg-slate-100 text-slate-600"
  );
}

function formatMileage(value: number | null) {
  if (
    value === null ||
    value === undefined
  ) {
    return "N/D";
  }

  return `${new Intl.NumberFormat(
    "es-MX"
  ).format(value)} km`;
}

function parseConditionFilter(
  value?: string
): ConditionFilter {
  return conditionOptions.includes(
    value as ConditionFilter
  )
    ? (value as ConditionFilter)
    : "TODAS";
}

function parseStatusFilter(
  value?: string
): StatusFilter {
  return statusOptions.includes(
    value as StatusFilter
  )
    ? (value as StatusFilter)
    : "TODOS";
}

function parseVisibilityFilter(
  value?: string
): VisibilityFilter {
  return visibilityOptions.includes(
    value as VisibilityFilter
  )
    ? (value as VisibilityFilter)
    : "TODOS";
}

function isVehicleCondition(
  value: FormDataEntryValue | null
): value is VehicleConditionValue {
  return (
    typeof value === "string" &&
    validVehicleConditions.includes(
      value as VehicleConditionValue
    )
  );
}

function isVehicleStatus(
  value: FormDataEntryValue | null
): value is VehicleStatusValue {
  return (
    typeof value === "string" &&
    validVehicleStatuses.includes(
      value as VehicleStatusValue
    )
  );
}

async function toggleVehicleActive(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const active =
    formData.get("active") === "true";

  if (!vehicleId) {
    return;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      active: !active,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);
}

async function updateVehicleCondition(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const condition =
    formData.get("condition");

  if (
    !vehicleId ||
    !isVehicleCondition(condition)
  ) {
    return;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      condition,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);
}

async function updateVehicleStatus(
  formData: FormData
) {
  "use server";

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const status = formData.get("status");

  if (
    !vehicleId ||
    !isVehicleStatus(status)
  ) {
    return;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
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
      `/admin/inventario?error=${encodeURIComponent(
        "No se pudo identificar la unidad a eliminar."
      )}`
    );
  }

  if (confirmText !== "ELIMINAR") {
    redirect(
      `/admin/inventario?error=${encodeURIComponent(
        "Para eliminar la unidad debes escribir ELIMINAR."
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
      `/admin/inventario?error=${encodeURIComponent(
        "La unidad ya no existe o fue eliminada previamente."
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
      `/admin/inventario?error=${encodeURIComponent(
        `No se puede eliminar esta unidad porque tiene ${leadCount} solicitud(es) asociada(s). Puedes ocultarla o marcarla como inactiva.`
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
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath(`/vehiculos/${vehicleId}`);

  redirect(
    `/admin/inventario?success=${encodeURIComponent(
      "Unidad eliminada correctamente."
    )}`
  );
}

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";

  const selectedBrandId = params.marca
    ? Number(params.marca)
    : 0;

  const selectedBranchId = params.sucursal
    ? Number(params.sucursal)
    : 0;

  const selectedCondition =
    parseConditionFilter(params.condicion);

  const selectedStatus =
    parseStatusFilter(params.estado);

  const selectedVisibility =
    parseVisibilityFilter(
      params.visibilidad
    );

  const where = {
    ...(search
      ? {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            brand: {
              name: {
                contains: search,
              },
            },
          },
          {
            branch: {
              name: {
                contains: search,
              },
            },
          },
          {
            branch: {
              city: {
                contains: search,
              },
            },
          },
        ],
      }
      : {}),

    ...(selectedBrandId
      ? {
        brandId: selectedBrandId,
      }
      : {}),

    ...(selectedBranchId
      ? {
        branchId: selectedBranchId,
      }
      : {}),

    ...(selectedCondition !== "TODAS"
      ? {
        condition: selectedCondition,
      }
      : {}),

    ...(selectedStatus !== "TODOS"
      ? {
        status: selectedStatus,
      }
      : {}),

    ...(selectedVisibility === "ACTIVO"
      ? {
        active: true,
      }
      : {}),

    ...(selectedVisibility === "OCULTO"
      ? {
        active: false,
      }
      : {}),
  };

  const [
    vehicles,
    brands,
    branches,
    totalVehicles,
    totalNewVehicles,
    totalUsedVehicles,
    totalAvailableUsedVehicles,
    totalSoldVehicles,
  ] = await Promise.all([
    prisma.vehicle.findMany({
      where,

      include: {
        brand: true,
        branch: true,

        images: {
          where: {
            type: "IMAGE",
          },

          orderBy: {
            order: "asc",
          },

          take: 1,
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.brand.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.branch.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.vehicle.count(),

    prisma.vehicle.count({
      where: {
        condition: "NUEVO",
      },
    }),

    prisma.vehicle.count({
      where: {
        condition: "SEMINUEVO",
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition: "SEMINUEVO",
        status: "DISPONIBLE",

        branch: {
          active: true,
        },
      },
    }),

    prisma.vehicle.count({
      where: {
        status: "VENDIDO",
      },
    }),
  ]);

  const stats = [
    {
      title: "Unidades registradas",
      value: totalVehicles,
      description:
        "Total almacenado en el sistema.",
      icon: Car,
      tone: "navy" as const,
    },
    {
      title: "Vehículos nuevos",
      value: totalNewVehicles,
      description:
        "Unidades registradas como nuevas.",
      icon: BadgeCheck,
      tone: "blue" as const,
    },
    {
      title: "Seminuevos públicos",
      value: totalAvailableUsedVehicles,
      description:
        "Activos, disponibles y publicados.",
      icon: Eye,
      tone: "emerald" as const,
    },
    {
      title: "Vehículos vendidos",
      value: totalSoldVehicles,
      description:
        "Unidades marcadas como vendidas.",
      icon: CheckCircle2,
      tone: "amber" as const,
    },
  ];

  const hasFilters =
    Boolean(search) ||
    Boolean(selectedBrandId) ||
    Boolean(selectedBranchId) ||
    selectedCondition !== "TODAS" ||
    selectedStatus !== "TODOS" ||
    selectedVisibility !== "TODOS";

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Car size={15} />
              Administración de unidades
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Inventario
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Administra vehículos nuevos y
              seminuevos, publicación, precios,
              sucursales, imágenes y estado comercial.
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
        {stats.map((item) => (
          <InventoryStatCard
            key={item.title}
            {...item}
          />
        ))}
      </section>

      {/* Filtros */}
      <section className="mt-6 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Buscar y filtrar
              </p>
            </div>

            <h2 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-[-0.035em]">
              <SlidersHorizontal size={21} />
              Filtros del inventario
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Filtra por marca, condición, estado,
              visibilidad o sucursal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
              {vehicles.length} resultado
              {vehicles.length === 1 ? "" : "s"}
            </span>

            {hasFilters && (
              <Link
                href="/admin/inventario"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        </div>

        <form
          action="/admin/inventario"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(135px,1fr))_auto]"
        >
          <FilterSearchInput
            defaultValue={search}
          />

          <FilterSelect
            label="Marca"
            name="marca"
            defaultValue={
              selectedBrandId || ""
            }
          >
            <option value="">Todas</option>

            {brands.map((brand) => (
              <option
                key={brand.id}
                value={brand.id}
              >
                {brand.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Condición"
            name="condicion"
            defaultValue={selectedCondition}
          >
            <option value="TODAS">
              Todas
            </option>

            <option value="NUEVO">
              Nuevo
            </option>

            <option value="SEMINUEVO">
              Seminuevo
            </option>
          </FilterSelect>

          <FilterSelect
            label="Estado"
            name="estado"
            defaultValue={selectedStatus}
          >
            <option value="TODOS">
              Todos
            </option>

            <option value="DISPONIBLE">
              Disponible
            </option>

            <option value="APARTADO">
              Apartado
            </option>

            <option value="VENDIDO">
              Vendido
            </option>

            <option value="EN_TRANSITO">
              En tránsito
            </option>

            <option value="PROXIMAMENTE">
              Próximamente
            </option>

            <option value="INACTIVO">
              Inactivo
            </option>
          </FilterSelect>

          <FilterSelect
            label="Visibilidad"
            name="visibilidad"
            defaultValue={selectedVisibility}
          >
            <option value="TODOS">
              Todas
            </option>

            <option value="ACTIVO">
              Visibles
            </option>

            <option value="OCULTO">
              Ocultas
            </option>
          </FilterSelect>

          <FilterSelect
            label="Sucursal"
            name="sucursal"
            defaultValue={
              selectedBranchId || ""
            }
          >
            <option value="">Todas</option>

            {branches.map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name} · {branch.city}
              </option>
            ))}
          </FilterSelect>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] xl:self-end"
          >
            <Search size={17} />
            Filtrar
          </button>
        </form>
      </section>

      {/* Resultados */}
      <section className="mt-6">
        {vehicles.length > 0 ? (
          <div className="grid gap-5">
            {vehicles.map((vehicle) => {
              const image =
                vehicle.mainImage ||
                vehicle.images[0]?.url ||
                "";

              const publicVisible =
                vehicle.active &&
                vehicle.status ===
                "DISPONIBLE" &&
                vehicle.branch.active &&
                vehicle.brand.active;

              return (
                <article
                  key={vehicle.id}
                  className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="grid xl:grid-cols-[210px_minmax(0,1fr)_310px]">
                    {/* Imagen */}
                    <div className="relative h-[220px] overflow-hidden bg-slate-100 sm:h-[280px] xl:h-full xl:min-h-[330px]">
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

                      <span
                        className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-sm ${vehicle.active
                            ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                            : "border-slate-200 bg-white/95 text-slate-600"
                          }`}
                      >
                        {vehicle.active ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}

                        {vehicle.active
                          ? "Visible"
                          : "Oculto"}
                      </span>
                    </div>

                    {/* Información */}
                    <div className="min-w-0 p-5 md:p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                            {vehicle.brand.name}
                          </p>

                          <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14] md:text-3xl">
                            {vehicle.name}
                          </h3>

                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            {vehicle.year} ·{" "}
                            {getCategoryLabel(
                              vehicle.category
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            classes={getConditionClasses(
                              vehicle.condition
                            )}
                            label={getConditionLabel(
                              vehicle.condition
                            )}
                          />

                          <StatusBadge
                            classes={getStatusClasses(
                              vehicle.status
                            )}
                            label={getStatusLabel(
                              vehicle.status
                            )}
                          />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        <VehicleDetailItem
                          icon={Gauge}
                          label="Kilometraje"
                          value={formatMileage(
                            vehicle.mileage
                          )}
                        />

                        <VehicleDetailItem
                          icon={MapPin}
                          label="Ciudad"
                          value={
                            vehicle.branch.city
                          }
                        />

                        <VehicleDetailItem
                          icon={Building2}
                          label="Sucursal"
                          value={
                            vehicle.branch.name
                          }
                        />

                        <div
                          className={`rounded-[16px] border p-4 ${publicVisible
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-100 bg-[#f8fafb]"
                            }`}
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Publicación
                          </p>

                          <p
                            className={`mt-2 flex items-center gap-2 text-xs font-black ${publicVisible
                                ? "text-emerald-700"
                                : "text-slate-500"
                              }`}
                          >
                            <Tags size={15} />

                            {publicVisible
                              ? "Visible en sitio"
                              : "No publicada"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Precio publicado
                        </p>

                        <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#192a3a]">
                          {formatCurrency(
                            vehicle.price
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <VehicleActions
                      vehicle={vehicle}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Car
              size={50}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black">
              No hay unidades con esos filtros
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Modifica los criterios de búsqueda o
              registra una nueva unidad.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admin/inventario"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
              >
                Limpiar filtros
              </Link>

              <Link
                href="/admin/inventario/nuevo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Plus size={17} />
                Registrar unidad
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="text-sm font-black text-[#192a3a]">
          Resumen del inventario
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Hay {totalUsedVehicles} unidades
          seminuevas registradas. Los cambios de
          estado, condición o visibilidad se reflejan
          en el sitio público después de guardar.
        </p>
      </section>
    </div>
  );
}

function InventoryStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone:
  | "navy"
  | "blue"
  | "emerald"
  | "amber";
}) {
  const tones = {
    navy: "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
    blue:
      "border-blue-100 bg-blue-50 text-blue-700",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
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

      <h2 className="mt-2 text-sm font-black text-[#0a0f14]">
        {title}
      </h2>

      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function FilterSearchInput({
  defaultValue,
}: {
  defaultValue: string;
}) {
  return (
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
          defaultValue={defaultValue}
          placeholder="Modelo, marca o sucursal"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
        />
      </div>
    </label>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>
    </label>
  );
}

function StatusBadge({
  classes,
  label,
}: {
  classes: string;
  label: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${classes}`}
    >
      {label}
    </span>
  );
}

function VehicleDetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 flex min-w-0 items-center gap-2 text-xs font-black text-slate-700">
        <Icon
          size={15}
          className="shrink-0 text-[#192a3a]"
        />

        <span className="truncate">
          {value}
        </span>
      </p>
    </div>
  );
}

function VehicleActions({
  vehicle,
}: {
  vehicle: {
    id: number;
    active: boolean;
    condition: string;
    status: string;
  };
}) {
  return (
    <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 xl:border-l xl:border-t-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        Acciones
      </p>

      <div className="mt-4 grid gap-3">
        <Link
          href={`/admin/inventario/${vehicle.id}/editar`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
        >
          <Pencil size={16} />
          Editar unidad
        </Link>

        <Link
          href={`/vehiculos/${vehicle.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
        >
          <Eye size={16} />
          Ver en sitio
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <form action={toggleVehicleActive}>
            <input
              type="hidden"
              name="vehicleId"
              value={vehicle.id}
            />

            <input
              type="hidden"
              name="active"
              value={String(vehicle.active)}
            />

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
            >
              {vehicle.active ? (
                <>
                  <EyeOff size={14} />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Mostrar
                </>
              )}
            </button>
          </form>

          <form action={updateVehicleCondition}>
            <input
              type="hidden"
              name="vehicleId"
              value={vehicle.id}
            />

            <input
              type="hidden"
              name="condition"
              value={
                vehicle.condition === "NUEVO"
                  ? "SEMINUEVO"
                  : "NUEVO"
              }
            />

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
            >
              {vehicle.condition === "NUEVO"
                ? "A seminuevo"
                : "A nuevo"}
            </button>
          </form>
        </div>

        <form
          action={updateVehicleStatus}
          className="grid grid-cols-[minmax(0,1fr)_48px] gap-2"
        >
          <input
            type="hidden"
            name="vehicleId"
            value={vehicle.id}
          />

          <select
            name="status"
            defaultValue={vehicle.status}
            aria-label="Estado de la unidad"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 outline-none transition focus:border-[#192a3a]"
          >
            <option value="DISPONIBLE">
              Disponible
            </option>

            <option value="APARTADO">
              Apartado
            </option>

            <option value="VENDIDO">
              Vendido
            </option>

            <option value="EN_TRANSITO">
              En tránsito
            </option>

            <option value="PROXIMAMENTE">
              Próximamente
            </option>

            <option value="INACTIVO">
              Inactivo
            </option>
          </select>

          <button
            type="submit"
            className="grid h-11 place-items-center rounded-xl bg-[#e7edf1] text-[10px] font-black text-[#192a3a] transition hover:bg-[#192a3a] hover:text-white active:scale-[0.98]"
          >
            OK
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
                  No podrá eliminarse si tiene
                  solicitudes relacionadas.
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
                value={vehicle.id}
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