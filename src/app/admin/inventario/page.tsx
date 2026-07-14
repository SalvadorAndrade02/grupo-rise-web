import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Car,
  Eye,
  EyeOff,
  ExternalLink,
  Gauge,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  AdminAlert,
  AdminHero,
  AdminInput,
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePublicFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const conditionOptions = [
  "TODAS",
  VehicleCondition.NUEVO,
  VehicleCondition.SEMINUEVO,
] as const;

const statusOptions = [
  "TODOS",
  VehicleStatus.DISPONIBLE,
  VehicleStatus.APARTADO,
  VehicleStatus.VENDIDO,
  VehicleStatus.EN_TRANSITO,
  VehicleStatus.PROXIMAMENTE,
  VehicleStatus.INACTIVO,
] as const;

const visibilityOptions = [
  "TODOS",
  "ACTIVO",
  "OCULTO",
] as const;

type ConditionFilter =
  (typeof conditionOptions)[number];

type StatusFilter =
  (typeof statusOptions)[number];

type VisibilityFilter =
  (typeof visibilityOptions)[number];

type InventoryQueryState = {
  search: string;
  brandId: number;
  condition: ConditionFilter;
  status: StatusFilter;
  visibility: VisibilityFilter;
  branchId: number;
};

const PAGE_SIZE = 6;

type AdminInventoryPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    condicion?: string;
    estado?: string;
    visibilidad?: string;
    sucursal?: string;
    pagina?: string;
    error?: string;
    success?: string;
  }>;
};

function getConditionLabel(
  condition: string
) {
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

function getCategoryLabel(
  category: string
) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

function getConditionClasses(
  condition: string
) {
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

function getStatusClasses(
  status: string
) {
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

function formatMileage(
  value: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Kilometraje N/D";
  }

  return `${new Intl.NumberFormat(
    "es-MX"
  ).format(value)} km`;
}

function parsePositiveInteger(
  value?: string
) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) &&
    parsedValue > 0
    ? parsedValue
    : 0;
}

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0
    ? page
    : 1;
}

function buildInventoryHref({
  search = "",
  brandId = 0,
  condition = "TODAS",
  status = "TODOS",
  visibility = "TODOS",
  branchId = 0,
  page = 1,
}: {
  search?: string;
  brandId?: number;
  condition?: string;
  status?: string;
  visibility?: string;
  branchId?: number;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  if (brandId > 0) {
    params.set(
      "marca",
      String(brandId)
    );
  }

  if (condition !== "TODAS") {
    params.set(
      "condicion",
      condition
    );
  }

  if (status !== "TODOS") {
    params.set("estado", status);
  }

  if (visibility !== "TODOS") {
    params.set(
      "visibilidad",
      visibility
    );
  }

  if (branchId > 0) {
    params.set(
      "sucursal",
      String(branchId)
    );
  }

  if (page > 1) {
    params.set(
      "pagina",
      String(page)
    );
  }

  const query = params.toString();

  return query
    ? `/admin/inventario?${query}`
    : "/admin/inventario";
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
): value is VehicleCondition {
  return (
    typeof value === "string" &&
    Object.values(
      VehicleCondition
    ).includes(value as VehicleCondition)
  );
}

function isVehicleStatus(
  value: FormDataEntryValue | null
): value is VehicleStatus {
  return (
    typeof value === "string" &&
    Object.values(
      VehicleStatus
    ).includes(value as VehicleStatus)
  );
}

function revalidateVehiclePaths(
  vehicleId?: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath(
    "/admin/inventario/salud"
  );
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath("/");

  if (vehicleId) {
    revalidatePath(
      `/admin/inventario/${vehicleId}/editar`
    );

    revalidatePath(
      `/vehiculos/${vehicleId}`
    );
  }
}

async function safelyDeleteUnreferencedFile(
  url?: string | null
) {
  if (
    !url ||
    !url.startsWith("/uploads/")
  ) {
    return;
  }

  const [
    vehicleReferences,
    catalogReferences,
  ] = await Promise.all([
    prisma.vehicleImage.count({
      where: {
        url,
      },
    }),

    prisma.catalogImage.count({
      where: {
        url,
      },
    }),
  ]);

  if (
    vehicleReferences > 0 ||
    catalogReferences > 0
  ) {
    return;
  }

  try {
    await deletePublicFile(url);
  } catch (error) {
    console.error(
      `No se pudo eliminar el archivo ${url}`,
      error
    );
  }
}

async function toggleVehicleActive(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const active =
    formData.get("active") === "true";

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0
  ) {
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

  revalidateVehiclePaths(vehicleId);
}

async function updateVehicleCondition(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const condition =
    formData.get("condition");

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0 ||
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

  revalidateVehiclePaths(vehicleId);
}

async function updateVehicleStatus(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const status =
    formData.get("status");

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0 ||
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
      active:
        status === VehicleStatus.INACTIVO
          ? false
          : undefined,
    },
  });

  revalidateVehiclePaths(vehicleId);
}

async function deleteVehicle(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const vehicleId = Number(
    formData.get("vehicleId")
  );

  const confirmText = String(
    formData.get("confirmText") || ""
  ).trim();

  if (
    !Number.isInteger(vehicleId) ||
    vehicleId <= 0
  ) {
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

  const urlsToDelete = Array.from(
    new Set(
      [
        vehicle.mainImage,
        ...vehicle.images.map(
          (image) => image.url
        ),
      ].filter(
        (url): url is string =>
          Boolean(url)
      )
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

  await Promise.allSettled(
    urlsToDelete.map((url) =>
      safelyDeleteUnreferencedFile(url)
    )
  );

  revalidateVehiclePaths(vehicleId);

  redirect(
    `/admin/inventario?success=${encodeURIComponent(
      "Unidad eliminada correctamente."
    )}`
  );
}

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const search =
    params.q?.trim() ?? "";

  const selectedBrandId =
    parsePositiveInteger(
      params.marca
    );

  const selectedBranchId =
    parsePositiveInteger(
      params.sucursal
    );

  const selectedCondition =
    parseConditionFilter(
      params.condicion
    );

  const selectedStatus =
    parseStatusFilter(
      params.estado
    );

  const selectedVisibility =
    parseVisibilityFilter(
      params.visibilidad
    );

  const requestedPage =
    parsePage(params.pagina);

  const where: Prisma.VehicleWhereInput = {
    ...(search
      ? {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            model: {
              contains: search,
            },
          },
          {
            brand: {
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
        branchId:
          selectedBranchId,
      }
      : {}),

    ...(selectedCondition !== "TODAS"
      ? {
        condition:
          selectedCondition,
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
    filteredVehicleCount,
    brands,
    branches,
    totalVehicles,
    totalNewVehicles,
    totalUsedVehicles,
    totalAvailableUsedVehicles,
    totalSoldVehicles,
  ] = await Promise.all([
    prisma.vehicle.count({
      where,
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

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.vehicle.count(),

    prisma.vehicle.count({
      where: {
        condition:
          VehicleCondition.NUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        condition:
          VehicleCondition.SEMINUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition:
          VehicleCondition.SEMINUEVO,
        status:
          VehicleStatus.DISPONIBLE,

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
        status:
          VehicleStatus.VENDIDO,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredVehicleCount /
      PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  const paginationSkip =
    (currentPage - 1) * PAGE_SIZE;

  const vehicles =
    await prisma.vehicle.findMany({
      where,
      skip: paginationSkip,
      take: PAGE_SIZE,

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

      orderBy: {
        createdAt: "desc",
      },
    });

  const hasFilters =
    Boolean(search) ||
    selectedBrandId > 0 ||
    selectedBranchId > 0 ||
    selectedCondition !== "TODAS" ||
    selectedStatus !== "TODOS" ||
    selectedVisibility !== "TODOS";

  const firstVisibleVehicle =
    filteredVehicleCount === 0
      ? 0
      : paginationSkip + 1;

  const lastVisibleVehicle = Math.min(
    paginationSkip + vehicles.length,
    filteredVehicleCount
  );

  const inventoryQueryState:
    InventoryQueryState = {
    search,
    brandId: selectedBrandId,
    condition: selectedCondition,
    status: selectedStatus,
    visibility: selectedVisibility,
    branchId: selectedBranchId,
  };

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow="Administración"
        title="Inventario de unidades"
        description="Administra vehículos nuevos, seminuevos, disponibles, vendidos, apartados y ocultos. Las unidades activas y disponibles se muestran en el sitio público."
        icon={Car}
        actions={
          <>
            <Link
              href="/inventario"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              Ver inventario público
              <ExternalLink size={16} />
            </Link>

            <Link
              href="/admin/inventario/nuevo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Plus size={17} />
              Registrar unidad
            </Link>
          </>
        }
      />

      {params.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {params.error}
        </AdminAlert>
      )}

      {params.success && (
        <AdminAlert
          variant="success"
          className="mt-5"
        >
          {params.success}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminSummaryCard
          icon={Car}
          label="Unidades registradas"
          value={totalVehicles}
        />

        <AdminSummaryCard
          icon={BadgeCheck}
          label="Nuevos"
          value={totalNewVehicles}
          tone="blue"
        />

        <AdminSummaryCard
          icon={Gauge}
          label="Seminuevos"
          value={totalUsedVehicles}
          tone="amber"
        />

        <AdminSummaryCard
          icon={Eye}
          label="Visibles en público"
          value={
            totalAvailableUsedVehicles
          }
          tone="emerald"
        />

        <AdminSummaryCard
          icon={Tags}
          label="Vendidos"
          value={totalSoldVehicles}
          tone="red"
        />
      </section>

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
              <Search size={20} />
              Unidades registradas
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Busca unidades por marca,
              condición, estado, sucursal o
              visibilidad pública.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
            {filteredVehicleCount} resultado
            {filteredVehicleCount === 1
              ? ""
              : "s"}
          </span>
        </div>

        <form
          action="/admin/inventario"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_1fr_1fr_1fr_1fr_1fr_auto]"
        >
          <AdminInput
            label="Buscar"
            name="q"
            defaultValue={search}
            placeholder="Modelo, marca o sucursal"
          />

          <AdminSelect
            label="Marca"
            name="marca"
            defaultValue={
              selectedBrandId || ""
            }
          >
            <option value="">
              Todas
            </option>

            {brands.map((brand) => (
              <option
                key={brand.id}
                value={brand.id}
              >
                {brand.name}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Condición"
            name="condicion"
            defaultValue={
              selectedCondition
            }
          >
            <option value="TODAS">
              Todas
            </option>

            <option
              value={
                VehicleCondition.NUEVO
              }
            >
              Nuevo
            </option>

            <option
              value={
                VehicleCondition.SEMINUEVO
              }
            >
              Seminuevo
            </option>
          </AdminSelect>

          <AdminSelect
            label="Estado"
            name="estado"
            defaultValue={
              selectedStatus
            }
          >
            <option value="TODOS">
              Todos
            </option>

            <option
              value={
                VehicleStatus.DISPONIBLE
              }
            >
              Disponible
            </option>

            <option
              value={
                VehicleStatus.APARTADO
              }
            >
              Apartado
            </option>

            <option
              value={
                VehicleStatus.VENDIDO
              }
            >
              Vendido
            </option>

            <option
              value={
                VehicleStatus.EN_TRANSITO
              }
            >
              En tránsito
            </option>

            <option
              value={
                VehicleStatus.PROXIMAMENTE
              }
            >
              Próximamente
            </option>

            <option
              value={
                VehicleStatus.INACTIVO
              }
            >
              Inactivo
            </option>
          </AdminSelect>

          <AdminSelect
            label="Visibilidad"
            name="visibilidad"
            defaultValue={
              selectedVisibility
            }
          >
            <option value="TODOS">
              Todas
            </option>

            <option value="ACTIVO">
              Activos
            </option>

            <option value="OCULTO">
              Ocultos
            </option>
          </AdminSelect>

          <AdminSelect
            label="Sucursal"
            name="sucursal"
            defaultValue={
              selectedBranchId || ""
            }
          >
            <option value="">
              Todas
            </option>

            {branches.map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name} ·{" "}
                {branch.city}
              </option>
            ))}
          </AdminSelect>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] xl:self-end"
          >
            <Search size={17} />
            Filtrar
          </button>
        </form>

        {hasFilters && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href="/admin/inventario"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              Limpiar filtros
            </Link>
          </div>
        )}

        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#192a3a]" />

              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Resultados
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Unidades registradas
            </h2>

            {filteredVehicleCount > 0 && (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Mostrando{" "}
                {firstVisibleVehicle}–
                {lastVisibleVehicle} de{" "}
                {filteredVehicleCount}
              </p>
            )}
          </div>

          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600">
            {filteredVehicleCount} unidad
            {filteredVehicleCount === 1
              ? ""
              : "es"}
          </span>
        </div>
      </section>

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
                VehicleStatus.DISPONIBLE &&
                vehicle.brand.active &&
                vehicle.branch.active;

              return (
                <article
                  key={vehicle.id}
                  className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:border-[#192a3a]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="grid xl:grid-cols-[220px_minmax(0,1fr)_330px]">
                    <div className="relative h-56 overflow-hidden bg-slate-100 xl:h-full xl:min-h-[315px]">
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
                              className="mx-auto"
                              size={42}
                            />

                            <p className="mt-2 text-xs font-black uppercase tracking-wider">
                              Sin imagen
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#192a3a] shadow-sm">
                        ID #{vehicle.id}
                      </div>

                      <span
                        className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-sm ${publicVisible
                          ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                          : "border-slate-200 bg-white/95 text-slate-600"
                          }`}
                      >
                        {publicVisible ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}

                        {publicVisible
                          ? "Publicado"
                          : "No publicado"}
                      </span>
                    </div>

                    <div className="min-w-0 p-5 md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#192a3a]">
                            {
                              vehicle.brand
                                .name
                            }
                          </p>

                          <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] text-[#192a3a] md:text-3xl">
                            {vehicle.name}
                          </h3>

                          <p className="mt-2 text-sm font-bold text-slate-500">
                            {vehicle.year} ·{" "}
                            {getCategoryLabel(
                              vehicle.category
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${getConditionClasses(
                              vehicle.condition
                            )}`}
                          >
                            {getConditionLabel(
                              vehicle.condition
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${getStatusClasses(
                              vehicle.status
                            )}`}
                          >
                            {getStatusLabel(
                              vehicle.status
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${vehicle.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                          >
                            {vehicle.active
                              ? "Visible"
                              : "Oculto"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm font-bold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                        <VehicleDetailBox
                          icon={Gauge}
                          label="Kilometraje"
                          value={formatMileage(
                            vehicle.mileage
                          )}
                        />

                        <VehicleDetailBox
                          icon={MapPin}
                          label="Ciudad"
                          value={
                            vehicle.branch
                              .city
                          }
                        />

                        <VehicleDetailBox
                          icon={Building2}
                          label="Sucursal"
                          value={
                            vehicle.branch
                              .name
                          }
                        />

                        <div
                          className={`rounded-[16px] border p-4 ${publicVisible
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-100 bg-[#f8fafb] text-slate-500"
                            }`}
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
                            Público
                          </p>

                          <p className="mt-2 flex items-center gap-2 text-xs font-black">
                            <Tags size={15} />
                            {publicVisible
                              ? vehicle.condition ===
                                VehicleCondition.NUEVO
                                ? "Catálogo"
                                : "Inventario"
                              : "No publicado"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Precio
                          </p>

                          <p className="mt-1 text-3xl font-black text-[#192a3a]">
                            {formatCurrency(
                              vehicle.price
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 xl:border-l xl:border-t-0">
                      <div className="grid gap-3">
                        <Link
                          href={`/admin/inventario/${vehicle.id}/editar`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                        >
                          <Pencil size={16} />
                          Editar unidad
                        </Link>

                        <Link
                          href={`/vehiculos/${vehicle.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                        >
                          <Eye size={16} />
                          Ver público
                        </Link>

                        <div className="grid grid-cols-2 gap-2">
                          <form
                            action={
                              toggleVehicleActive
                            }
                          >
                            <input
                              type="hidden"
                              name="vehicleId"
                              value={
                                vehicle.id
                              }
                            />

                            <input
                              type="hidden"
                              name="active"
                              value={String(
                                vehicle.active
                              )}
                            />

                            <button
                              type="submit"
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
                            >
                              {vehicle.active ? (
                                <>
                                  <EyeOff
                                    size={15}
                                  />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye
                                    size={15}
                                  />
                                  Mostrar
                                </>
                              )}
                            </button>
                          </form>

                          <form
                            action={
                              updateVehicleCondition
                            }
                          >
                            <input
                              type="hidden"
                              name="vehicleId"
                              value={
                                vehicle.id
                              }
                            />

                            <input
                              type="hidden"
                              name="condition"
                              value={
                                vehicle.condition ===
                                  VehicleCondition.NUEVO
                                  ? VehicleCondition.SEMINUEVO
                                  : VehicleCondition.NUEVO
                              }
                            />

                            <button
                              type="submit"
                              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98]"
                            >
                              {vehicle.condition ===
                                VehicleCondition.NUEVO
                                ? "A seminuevo"
                                : "A nuevo"}
                            </button>
                          </form>
                        </div>

                        <form
                          action={
                            updateVehicleStatus
                          }
                          className="grid grid-cols-[1fr_auto] gap-2"
                        >
                          <input
                            type="hidden"
                            name="vehicleId"
                            value={vehicle.id}
                          />

                          <select
                            name="status"
                            defaultValue={
                              vehicle.status
                            }
                            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none transition focus:border-[#192a3a] focus:ring-2 focus:ring-[#192a3a]/10"
                          >
                            <option
                              value={
                                VehicleStatus.DISPONIBLE
                              }
                            >
                              Disponible
                            </option>

                            <option
                              value={
                                VehicleStatus.APARTADO
                              }
                            >
                              Apartado
                            </option>

                            <option
                              value={
                                VehicleStatus.VENDIDO
                              }
                            >
                              Vendido
                            </option>

                            <option
                              value={
                                VehicleStatus.EN_TRANSITO
                              }
                            >
                              En tránsito
                            </option>

                            <option
                              value={
                                VehicleStatus.PROXIMAMENTE
                              }
                            >
                              Próximamente
                            </option>

                            <option
                              value={
                                VehicleStatus.INACTIVO
                              }
                            >
                              Inactivo
                            </option>
                          </select>

                          <button
                            type="submit"
                            className="h-11 rounded-xl bg-[#e7edf1] px-4 text-xs font-black text-[#192a3a] transition hover:bg-[#192a3a] hover:text-white active:scale-[0.98]"
                          >
                            OK
                          </button>
                        </form>

                        <details className="rounded-[16px] border border-red-100 bg-red-50 p-4">
                          <summary className="flex cursor-pointer items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                            <Trash2 size={16} />
                            Eliminar unidad
                          </summary>

                          <div className="mt-4 rounded-[16px] bg-white p-4">
                            <div className="flex gap-3">
                              <AlertTriangle
                                className="mt-1 shrink-0 text-red-600"
                                size={20}
                              />

                              <div>
                                <p className="text-sm font-black text-red-700">
                                  Esta acción no
                                  se puede deshacer.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Si tiene
                                  solicitudes
                                  asociadas, no se
                                  permitirá
                                  eliminarla.
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
                                value={
                                  vehicle.id
                                }
                              />

                              <input
                                name="confirmText"
                                placeholder="Escribe ELIMINAR"
                                className="h-11 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-700 outline-none transition placeholder:text-red-300 focus:border-red-300 focus:bg-white"
                              />

                              <button
                                type="submit"
                                className="h-11 rounded-xl bg-red-600 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700 active:scale-[0.98]"
                              >
                                Eliminar definitivamente
                              </button>
                            </form>
                          </div>
                        </details>
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Car
              className="mx-auto text-slate-400"
              size={52}
            />

            <h2 className="mt-4 text-2xl font-black">
              No hay unidades con esos filtros.
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ajusta la búsqueda o registra
              una nueva unidad.
            </p>

            <Link
              href="/admin/inventario/nuevo"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Registrar unidad
            </Link>
          </div>
        )}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVehicleCount}
          firstItem={firstVisibleVehicle}
          lastItem={lastVisibleVehicle}
          itemLabel="unidad"
          itemLabelPlural="unidades"
          hrefForPage={(page) =>
            buildInventoryHref({
              ...inventoryQueryState,
              page,
            })
          }
        />
      </section>
    </div>
  );
}

function VehicleDetailBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 flex items-center gap-2 text-xs font-black text-slate-700">
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