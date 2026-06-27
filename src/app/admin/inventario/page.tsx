import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  AlertTriangle,
  Trash2,
  BadgeCheck,
  Building2,
  Car,
  Eye,
  EyeOff,
  Gauge,
  ImageIcon,
  MapPin,
  Pencil,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";
import { redirect } from "next/navigation";
import { deletePublicFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const conditionOptions = ["TODAS", "NUEVO", "SEMINUEVO"] as const;

const statusOptions = [
  "TODOS",
  "DISPONIBLE",
  "APARTADO",
  "VENDIDO",
  "EN_TRANSITO",
  "PROXIMAMENTE",
  "INACTIVO",
] as const;

const visibilityOptions = ["TODOS", "ACTIVO", "OCULTO"] as const;

const validVehicleConditions = ["NUEVO", "SEMINUEVO"] as const;

const validVehicleStatuses = [
  "DISPONIBLE",
  "APARTADO",
  "VENDIDO",
  "EN_TRANSITO",
  "PROXIMAMENTE",
  "INACTIVO",
] as const;

type ConditionFilter = (typeof conditionOptions)[number];
type StatusFilter = (typeof statusOptions)[number];
type VisibilityFilter = (typeof visibilityOptions)[number];
type VehicleConditionValue = (typeof validVehicleConditions)[number];
type VehicleStatusValue = (typeof validVehicleStatuses)[number];

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
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

function getConditionClasses(condition: string) {
  const classes: Record<string, string> = {
    NUEVO: "bg-blue-50 text-blue-700",
    SEMINUEVO: "bg-amber-50 text-amber-700",
  };

  return classes[condition] ?? "bg-slate-100 text-slate-600";
}

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    DISPONIBLE: "bg-emerald-50 text-emerald-700",
    APARTADO: "bg-amber-50 text-amber-700",
    VENDIDO: "bg-red-50 text-red-700",
    EN_TRANSITO: "bg-blue-50 text-blue-700",
    PROXIMAMENTE: "bg-purple-50 text-purple-700",
    INACTIVO: "bg-slate-200 text-slate-600",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600";
}

function formatMileage(value: number | null) {
  if (value === null || value === undefined) {
    return "Kilometraje N/D";
  }

  return `${new Intl.NumberFormat("es-MX").format(value)} km`;
}

function parseConditionFilter(value?: string): ConditionFilter {
  return conditionOptions.includes(value as ConditionFilter)
    ? (value as ConditionFilter)
    : "TODAS";
}

function parseStatusFilter(value?: string): StatusFilter {
  return statusOptions.includes(value as StatusFilter)
    ? (value as StatusFilter)
    : "TODOS";
}

function parseVisibilityFilter(value?: string): VisibilityFilter {
  return visibilityOptions.includes(value as VisibilityFilter)
    ? (value as VisibilityFilter)
    : "TODOS";
}

function isVehicleCondition(value: FormDataEntryValue | null): value is VehicleConditionValue {
  return (
    typeof value === "string" &&
    validVehicleConditions.includes(value as VehicleConditionValue)
  );
}

function isVehicleStatus(value: FormDataEntryValue | null): value is VehicleStatusValue {
  return (
    typeof value === "string" &&
    validVehicleStatuses.includes(value as VehicleStatusValue)
  );
}

async function toggleVehicleActive(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));
  const active = formData.get("active") === "true";

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
  revalidatePath("/inventario");
}

async function updateVehicleCondition(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));
  const condition = formData.get("condition");

  if (!vehicleId || !isVehicleCondition(condition)) {
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
  revalidatePath("/inventario");
}

async function updateVehicleStatus(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));
  const status = formData.get("status");

  if (!vehicleId || !isVehicleStatus(status)) {
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
  revalidatePath("/inventario");
}

async function deleteVehicle(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));
  const confirmText = String(formData.get("confirmText") || "").trim();

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

  const vehicle = await prisma.vehicle.findUnique({
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

  const leadCount = await prisma.lead.count({
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
      ...vehicle.images.map((image) => image.url),
    ].filter((url): url is string => Boolean(url))
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
        console.error(`No se pudo eliminar el archivo ${url}`, error);
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
  const selectedBrandId = params.marca ? Number(params.marca) : 0;
  const selectedBranchId = params.sucursal ? Number(params.sucursal) : 0;
  const selectedCondition = parseConditionFilter(params.condicion);
  const selectedStatus = parseStatusFilter(params.estado);
  const selectedVisibility = parseVisibilityFilter(params.visibilidad);

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
      description: "Nuevas, seminuevas y no visibles",
      icon: Car,
      className: "bg-blue-50 text-blue-700",
    },
    {
      title: "Nuevos",
      value: totalNewVehicles,
      description: "Unidades registradas como nuevas",
      icon: BadgeCheck,
      className: "bg-purple-50 text-purple-700",
    },
    {
      title: "Seminuevos",
      value: totalUsedVehicles,
      description: "Unidades registradas como seminuevas",
      icon: Gauge,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "Visibles en público",
      value: totalAvailableUsedVehicles,
      description: "Seminuevos disponibles y activos",
      icon: Eye,
      className: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Administración
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Inventario de unidades
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Administra vehículos nuevos, seminuevos, disponibles, vendidos,
              apartados y ocultos. Los seminuevos activos y disponibles aparecen
              automáticamente en el inventario público.
            </p>
          </div>

          <Link
            href="/admin/inventario/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Registrar unidad
            <ArrowRight size={17} />
          </Link>
        </div>

        {params.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {params.success}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm"
              >
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${item.className}`}
                >
                  <Icon size={23} />
                </div>

                <p className="mt-5 text-4xl font-black">{item.value}</p>

                <h2 className="mt-2 text-base font-black">{item.title}</h2>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                <SlidersHorizontal size={23} />
                Filtros
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Busca unidades por marca, condición, estado, sucursal o
                visibilidad.
              </p>
            </div>

            <p className="rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
              {vehicles.length} resultado(s)
            </p>
          </div>

          <form
            action="/admin/inventario"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto]"
          >
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Buscar
              </span>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Modelo, marca o sucursal"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Marca
              </span>

              <select
                name="marca"
                defaultValue={selectedBrandId || ""}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value="">Todas</option>

                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Condición
              </span>

              <select
                name="condicion"
                defaultValue={selectedCondition}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value="TODAS">Todas</option>
                <option value="NUEVO">Nuevo</option>
                <option value="SEMINUEVO">Seminuevo</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Estado
              </span>

              <select
                name="estado"
                defaultValue={selectedStatus}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value="TODOS">Todos</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="APARTADO">Apartado</option>
                <option value="VENDIDO">Vendido</option>
                <option value="EN_TRANSITO">En tránsito</option>
                <option value="PROXIMAMENTE">Próximamente</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Visibilidad
              </span>

              <select
                name="visibilidad"
                defaultValue={selectedVisibility}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value="TODOS">Todas</option>
                <option value="ACTIVO">Activos</option>
                <option value="OCULTO">Ocultos</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sucursal
              </span>

              <select
                name="sucursal"
                defaultValue={selectedBranchId || ""}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              >
                <option value="">Todas</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} · {branch.city}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="h-12 rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] xl:self-end"
            >
              Filtrar
            </button>
          </form>

          <div className="mt-4">
            <Link
              href="/admin/inventario"
              className="text-sm font-black text-[var(--rise-blue)] hover:underline"
            >
              Limpiar filtros
            </Link>
          </div>
        </div>

        <section className="mt-8">
          {vehicles.length > 0 ? (
            <div className="grid gap-4">
              {vehicles.map((vehicle) => {
                const image = vehicle.images[0]?.url || vehicle.mainImage || "";
                const publicVisible =
                  vehicle.active &&
                  vehicle.condition === "SEMINUEVO" &&
                  vehicle.status === "DISPONIBLE";

                return (
                  <article
                    key={vehicle.id}
                    className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    <div className="grid gap-0 xl:grid-cols-[190px_minmax(0,1fr)_330px]">
                      <div className="relative h-52 bg-slate-100 xl:h-full">
                        {image ? (
                          <img
                            src={image}
                            alt={`${vehicle.brand.name} ${vehicle.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <div className="text-center">
                              <ImageIcon className="mx-auto" size={42} />
                              <p className="mt-2 text-xs font-black uppercase tracking-wider">
                                Sin imagen
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--rise-blue)] shadow-sm">
                          ID #{vehicle.id}
                        </div>
                      </div>

                      <div className="p-5 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                              {vehicle.brand.name}
                            </p>

                            <h3 className="mt-2 text-2xl font-black leading-tight text-[var(--rise-navy)] md:text-3xl">
                              {vehicle.name}
                            </h3>

                            <p className="mt-2 text-sm font-bold text-slate-500">
                              {vehicle.year} · {getCategoryLabel(vehicle.category)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getConditionClasses(
                                vehicle.condition
                              )}`}
                            >
                              {getConditionLabel(vehicle.condition)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getStatusClasses(
                                vehicle.status
                              )}`}
                            >
                              {getStatusLabel(vehicle.status)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${vehicle.active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                                }`}
                            >
                              {vehicle.active ? "Visible" : "Oculto"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                              Kilometraje
                            </p>

                            <p className="mt-1 flex items-center gap-2 text-slate-700">
                              <Gauge size={16} className="text-[var(--rise-blue)]" />
                              {formatMileage(vehicle.mileage)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                              Ciudad
                            </p>

                            <p className="mt-1 flex items-center gap-2 text-slate-700">
                              <MapPin size={16} className="text-[var(--rise-blue)]" />
                              {vehicle.branch.city}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                              Sucursal
                            </p>

                            <p className="mt-1 flex items-center gap-2 text-slate-700">
                              <Building2 size={16} className="text-[var(--rise-blue)]" />
                              {vehicle.branch.name}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl p-3 ${publicVisible
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-50 text-slate-500"
                              }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-wider opacity-70">
                              Público
                            </p>

                            <p className="mt-1 flex items-center gap-2 text-sm font-black">
                              <Tags size={16} />
                              {publicVisible ? "Visible en sitio" : "No publicado"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Precio
                            </p>

                            <p className="mt-1 text-3xl font-black text-[var(--rise-blue)]">
                              {formatCurrency(vehicle.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <aside className="border-t border-slate-100 bg-slate-50 p-5 xl:border-l xl:border-t-0">
                        <div className="grid gap-3">
                          <Link
                            href={`/admin/inventario/${vehicle.id}/editar`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                          >
                            <Pencil size={17} />
                            Editar unidad
                          </Link>

                          <Link
                            href={`/vehiculos/${vehicle.id}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                          >
                            <Eye size={17} />
                            Ver público
                          </Link>

                          <div className="grid grid-cols-2 gap-2">
                            <form action={toggleVehicleActive}>
                              <input type="hidden" name="vehicleId" value={vehicle.id} />
                              <input type="hidden" name="active" value={String(vehicle.active)} />

                              <button
                                type="submit"
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                              >
                                {vehicle.active ? (
                                  <>
                                    <EyeOff size={15} />
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <Eye size={15} />
                                    Mostrar
                                  </>
                                )}
                              </button>
                            </form>

                            <form action={updateVehicleCondition}>
                              <input type="hidden" name="vehicleId" value={vehicle.id} />

                              <input
                                type="hidden"
                                name="condition"
                                value={
                                  vehicle.condition === "NUEVO" ? "SEMINUEVO" : "NUEVO"
                                }
                              />

                              <button
                                type="submit"
                                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                              >
                                {vehicle.condition === "NUEVO"
                                  ? "A seminuevo"
                                  : "A nuevo"}
                              </button>
                            </form>
                          </div>

                          <form action={updateVehicleStatus} className="grid grid-cols-[1fr_auto] gap-2">
                            <input type="hidden" name="vehicleId" value={vehicle.id} />

                            <select
                              name="status"
                              defaultValue={vehicle.status}
                              className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-[var(--rise-blue)]"
                            >
                              <option value="DISPONIBLE">Disponible</option>
                              <option value="APARTADO">Apartado</option>
                              <option value="VENDIDO">Vendido</option>
                              <option value="EN_TRANSITO">En tránsito</option>
                              <option value="PROXIMAMENTE">Próximamente</option>
                              <option value="INACTIVO">Inactivo</option>
                            </select>

                            <button
                              type="submit"
                              className="h-11 rounded-2xl bg-[var(--rise-blue-soft)] px-4 text-xs font-black text-[var(--rise-blue)] transition hover:bg-[var(--rise-blue)] hover:text-white"
                            >
                              OK
                            </button>
                          </form>

                          <details className="rounded-2xl border border-red-100 bg-red-50 p-4">
                            <summary className="flex cursor-pointer items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                              <Trash2 size={16} />
                              Eliminar unidad
                            </summary>

                            <div className="mt-4 rounded-2xl bg-white p-4">
                              <div className="flex gap-3">
                                <AlertTriangle className="mt-1 shrink-0 text-red-600" size={20} />

                                <div>
                                  <p className="text-sm font-black text-red-700">
                                    Esta acción no se puede deshacer.
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Si tiene solicitudes asociadas, no se permitirá eliminarla.
                                  </p>
                                </div>
                              </div>

                              <form action={deleteVehicle} className="mt-4 grid gap-3">
                                <input type="hidden" name="vehicleId" value={vehicle.id} />

                                <input
                                  name="confirmText"
                                  placeholder="Escribe ELIMINAR"
                                  className="h-11 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-700 outline-none transition placeholder:text-red-300 focus:border-red-300 focus:bg-white"
                                />

                                <button
                                  type="submit"
                                  className="h-11 rounded-2xl bg-red-600 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700"
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
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Car className="mx-auto text-slate-400" size={52} />

              <h2 className="mt-4 text-2xl font-black">
                No hay unidades con esos filtros.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ajusta la búsqueda o registra una nueva unidad.
              </p>

              <Link
                href="/admin/inventario/nuevo"
                className="mt-5 inline-flex rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                Registrar unidad
              </Link>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}