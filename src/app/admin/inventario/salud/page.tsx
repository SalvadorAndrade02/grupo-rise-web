import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
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

const issueOptions: { value: IssueKey | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "SIN_IMAGEN", label: "Sin imagen" },
  { value: "SIN_DESCRIPCION", label: "Sin descripción" },
  { value: "SIN_PRECIO", label: "Sin precio válido" },
  { value: "OCULTO", label: "Ocultos" },
  { value: "VISIBLE_NO_DISPONIBLE", label: "Visible no disponible" },
  { value: "MARCA_INACTIVA", label: "Marca inactiva" },
  { value: "SUCURSAL_INACTIVA", label: "Sucursal inactiva" },
  { value: "VENDIDO_APARTADO", label: "Vendido / apartado" },
  { value: "SIN_GALERIA", label: "Sin galería" },
];

function getIssueLabel(issue: IssueKey) {
  const labels: Record<IssueKey, string> = {
    SIN_IMAGEN: "Sin imagen",
    SIN_DESCRIPCION: "Sin descripción",
    SIN_PRECIO: "Sin precio válido",
    OCULTO: "Oculto",
    VISIBLE_NO_DISPONIBLE: "Visible pero no disponible",
    MARCA_INACTIVA: "Marca inactiva",
    SUCURSAL_INACTIVA: "Sucursal inactiva",
    VENDIDO_APARTADO: "Vendido / apartado",
    SIN_GALERIA: "Sin galería",
  };

  return labels[issue];
}

function getIssueClasses(issue: IssueKey) {
  const classes: Record<IssueKey, string> = {
    SIN_IMAGEN: "bg-amber-50 text-amber-700",
    SIN_DESCRIPCION: "bg-amber-50 text-amber-700",
    SIN_PRECIO: "bg-red-50 text-red-700",
    OCULTO: "bg-slate-200 text-slate-700",
    VISIBLE_NO_DISPONIBLE: "bg-red-50 text-red-700",
    MARCA_INACTIVA: "bg-purple-50 text-purple-700",
    SUCURSAL_INACTIVA: "bg-purple-50 text-purple-700",
    VENDIDO_APARTADO: "bg-blue-50 text-blue-700",
    SIN_GALERIA: "bg-amber-50 text-amber-700",
  };

  return classes[issue];
}

function getConditionLabel(condition: VehicleCondition) {
  const labels: Record<VehicleCondition, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition];
}

function getCategoryLabel(category: VehicleCategory) {
  const labels: Record<VehicleCategory, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}

function getStatusLabel(status: VehicleStatus) {
  const labels: Record<VehicleStatus, string> = {
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
  brand: { active: boolean };
  branch: { active: boolean };
}) {
  const canAppearPublicly =
    vehicle.active &&
    vehicle.status === VehicleStatus.DISPONIBLE &&
    vehicle.brand.active &&
    vehicle.branch.active;

  if (!canAppearPublicly) {
    return "No publicado";
  }

  if (vehicle.condition === VehicleCondition.NUEVO) {
    return "Catálogo";
  }

  return "Inventario";
}

function getVehicleIssues(vehicle: {
  mainImage: string;
  description: string;
  price: number;
  active: boolean;
  status: VehicleStatus;
  brand: { active: boolean };
  branch: { active: boolean };
  images: { type: VehicleMediaType }[];
}) {
  const issues: IssueKey[] = [];

  const hasImageInGallery = vehicle.images.some(
    (image) => image.type === VehicleMediaType.IMAGE
  );

  if (!vehicle.mainImage?.trim() && !hasImageInGallery) {
    issues.push("SIN_IMAGEN");
  }

  if (!vehicle.images.length) {
    issues.push("SIN_GALERIA");
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

  if (vehicle.active && vehicle.status !== VehicleStatus.DISPONIBLE) {
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

  return issues;
}

function buildHealthHref(issue: string, search = "") {
  const params = new URLSearchParams();

  if (issue !== "TODOS") {
    params.set("problema", issue);
  }

  if (search.trim()) {
    params.set("q", search.trim());
  }

  const query = params.toString();

  return query ? `/admin/inventario/salud?${query}` : "/admin/inventario/salud";
}

async function hideVehicle(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));

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
}

async function markVehicleInactive(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));

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
}

async function deleteVehicle(formData: FormData) {
  "use server";

  const vehicleId = Number(formData.get("vehicleId"));
  const confirmText = String(formData.get("confirmText") || "").trim();

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

  const leadCount = await prisma.lead.count({
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
      `/admin/inventario/salud?error=${encodeURIComponent(
        "La unidad ya no existe."
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
  revalidatePath("/admin/inventario/salud");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

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
  const normalizedSearch = search.toLowerCase();
  const issueFilter = params.problema ?? "TODOS";

  const vehicles = await prisma.vehicle.findMany({
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
      const issues = getVehicleIssues(vehicle);
      const image =
        vehicle.images.find((item) => item.type === VehicleMediaType.IMAGE)
          ?.url ||
        vehicle.mainImage ||
        "";

      return {
        vehicle,
        issues,
        image,
        publicTarget: getVehiclePublicTarget(vehicle),
      };
    })
    .filter((row) => row.issues.length > 0);

  const filteredRows = rows.filter((row) => {
    const matchesIssue =
      issueFilter === "TODOS" || row.issues.includes(issueFilter as IssueKey);

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
      getConditionLabel(row.vehicle.condition),
      getStatusLabel(row.vehicle.status),
      ...row.issues.map(getIssueLabel),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const issueStats = issueOptions
    .filter((option) => option.value !== "TODOS")
    .map((option) => ({
      ...option,
      count: rows.filter((row) => row.issues.includes(option.value as IssueKey))
        .length,
    }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Salud del inventario
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Revisión de registros
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Detecta unidades incompletas, ocultas, sin imagen, sin descripción
            o que ya no aparecen públicamente.
          </p>
        </div>

        <Link
          href="/admin/inventario/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <Car size={18} />
          Registrar unidad
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

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <AlertTriangle size={24} className="text-amber-600" />
          <p className="mt-4 text-4xl font-black">{rows.length}</p>
          <p className="mt-1 text-sm font-black uppercase tracking-wider text-slate-500">
            Con alertas
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <ImageIcon size={24} className="text-[var(--rise-blue)]" />
          <p className="mt-4 text-4xl font-black">
            {issueStats.find((item) => item.value === "SIN_IMAGEN")?.count ?? 0}
          </p>
          <p className="mt-1 text-sm font-black uppercase tracking-wider text-slate-500">
            Sin imagen
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <EyeOff size={24} className="text-slate-600" />
          <p className="mt-4 text-4xl font-black">
            {issueStats.find((item) => item.value === "OCULTO")?.count ?? 0}
          </p>
          <p className="mt-1 text-sm font-black uppercase tracking-wider text-slate-500">
            Ocultos
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm">
          <ShieldAlert size={24} className="text-red-600" />
          <p className="mt-4 text-4xl font-black">
            {issueStats.find((item) => item.value === "VISIBLE_NO_DISPONIBLE")
              ?.count ?? 0}
          </p>
          <p className="mt-1 text-sm font-black uppercase tracking-wider text-slate-500">
            Visibles no disponibles
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Filtros
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Buscar registros problemáticos
            </h2>
          </div>

          {(search || issueFilter !== "TODOS") && (
            <Link
              href="/admin/inventario/salud"
              className="rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
            >
              Limpiar filtros
            </Link>
          )}
        </div>

        <form
          action="/admin/inventario/salud"
          className="mt-5 grid gap-3 lg:grid-cols-[1fr_280px_auto]"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por unidad, marca, sucursal, año o problema..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
            />
          </div>

          <select
            name="problema"
            defaultValue={issueFilter}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
          >
            {issueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Buscar
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {issueOptions.map((option) => (
            <Link
              key={option.value}
              href={buildHealthHref(option.value, search)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                issueFilter === option.value
                  ? "bg-[var(--rise-navy)] text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Resultados
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {filteredRows.length} registro(s)
            </h2>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRows.length > 0 ? (
            filteredRows.map(({ vehicle, issues, image, publicTarget }) => (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm"
              >
                <div className="grid xl:grid-cols-[170px_minmax(0,1fr)_320px]">
                  <div className="relative h-48 bg-slate-100 xl:h-full">
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

                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--rise-blue)] shadow-sm">
                      ID #{vehicle.id}
                    </span>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                          {vehicle.brand.name}
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-[var(--rise-navy)]">
                          {vehicle.name}
                        </h3>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          {vehicle.year} · {getCategoryLabel(vehicle.category)} ·{" "}
                          {getConditionLabel(vehicle.condition)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          publicTarget === "Catálogo" ||
                          publicTarget === "Inventario"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {publicTarget}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Precio
                        </p>

                        <p className="mt-1 text-sm font-black text-[var(--rise-blue)]">
                          {formatCurrency(vehicle.price)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Estado
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-700">
                          {getStatusLabel(vehicle.status)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Sucursal
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-700">
                          {vehicle.branch.city}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Visibilidad
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-700">
                          {vehicle.active ? "Visible" : "Oculto"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {issues.map((issue) => (
                        <span
                          key={issue}
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getIssueClasses(
                            issue
                          )}`}
                        >
                          {getIssueLabel(issue)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <aside className="border-t border-slate-100 bg-slate-50 p-5 xl:border-l xl:border-t-0">
                    <div className="grid gap-3">
                      <Link
                        href={`/admin/inventario/${vehicle.id}/editar`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                      >
                        <Pencil size={17} />
                        Editar
                      </Link>

                      <Link
                        href={`/vehiculos/${vehicle.id}`}
                        target="_blank"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                      >
                        <Eye size={17} />
                        Ver público
                      </Link>

                      <form action={hideVehicle}>
                        <input type="hidden" name="vehicleId" value={vehicle.id} />

                        <button
                          type="submit"
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <EyeOff size={17} />
                          Ocultar
                        </button>
                      </form>

                      <form action={markVehicleInactive}>
                        <input type="hidden" name="vehicleId" value={vehicle.id} />

                        <button
                          type="submit"
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <XCircle size={17} />
                          Marcar inactivo
                        </button>
                      </form>

                      <details className="rounded-2xl border border-red-100 bg-red-50 p-4">
                        <summary className="flex cursor-pointer items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                          <Trash2 size={16} />
                          Eliminar
                        </summary>

                        <div className="mt-4">
                          <p className="text-xs leading-5 text-red-700">
                            Solo se eliminará si no tiene solicitudes asociadas.
                          </p>

                          <form action={deleteVehicle} className="mt-3 grid gap-2">
                            <input
                              type="hidden"
                              name="vehicleId"
                              value={vehicle.id}
                            />

                            <input
                              name="confirmText"
                              placeholder="Escribe ELIMINAR"
                              className="h-10 rounded-2xl border border-red-100 bg-white px-4 text-xs font-black text-red-700 outline-none"
                            />

                            <button
                              type="submit"
                              className="h-10 rounded-2xl bg-red-600 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700"
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
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-600" />

              <h3 className="mt-4 text-2xl font-black">
                No hay registros con ese criterio
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Cambia los filtros o limpia la búsqueda para ver más resultados.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}