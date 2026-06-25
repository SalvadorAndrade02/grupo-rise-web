import Link from "next/link";
import {
    Car,
    ChevronRight,
    Gauge,
    MapPin,
    Plus,
    Settings,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCategory(category: string) {
    const labels: Record<string, string> = {
        AUTO: "Auto",
        MOTO: "Moto",
        TODOTERRENO: "Todo terreno",
    };

    return labels[category] ?? category;
}

function formatCondition(condition: string) {
    const labels: Record<string, string> = {
        NUEVO: "Nuevo",
        SEMINUEVO: "Seminuevo",
    };

    return labels[condition] ?? condition;
}

function formatStatus(status: string) {
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

async function toggleVehicleActive(vehicleId: number, active: boolean) {
    "use server";

    await prisma.vehicle.update({
        where: {
            id: vehicleId,
        },
        data: {
            active,
            status: active ? "DISPONIBLE" : "INACTIVO",
        },
    });

    revalidatePath("/admin/inventario");
    revalidatePath("/inventario");
    revalidatePath(`/vehiculos/${vehicleId}`);
}

const categoryOptions = [
    { value: "TODOS", label: "Todas" },
    { value: "AUTO", label: "Autos" },
    { value: "MOTO", label: "Motos" },
    { value: "TODOTERRENO", label: "Todo terreno" },
];

const statusOptions = [
    { value: "TODOS", label: "Todos" },
    { value: "DISPONIBLE", label: "Disponible" },
    { value: "APARTADO", label: "Apartado" },
    { value: "VENDIDO", label: "Vendido" },
    { value: "EN_TRANSITO", label: "En tránsito" },
    { value: "PROXIMAMENTE", label: "Próximamente" },
    { value: "INACTIVO", label: "Inactivo" },
];

const visibilityOptions = [
    { value: "TODOS", label: "Todos" },
    { value: "ACTIVOS", label: "Activos en sitio" },
    { value: "OCULTOS", label: "Ocultos" },
];

function getValidCategory(value?: string) {
    if (value === "AUTO" || value === "MOTO" || value === "TODOTERRENO") {
        return value;
    }

    return "TODOS";
}

function getValidStatus(value?: string) {
    if (
        value === "DISPONIBLE" ||
        value === "APARTADO" ||
        value === "VENDIDO" ||
        value === "EN_TRANSITO" ||
        value === "PROXIMAMENTE" ||
        value === "INACTIVO"
    ) {
        return value;
    }

    return "TODOS";
}

function getValidVisibility(value?: string) {
    if (value === "ACTIVOS" || value === "OCULTOS") {
        return value;
    }

    return "TODOS";
}

type AdminInventoryPageProps = {
    searchParams: Promise<{
        q?: string;
        categoria?: string;
        estado?: string;
        visibilidad?: string;
        sucursal?: string;
    }>;
};

export default async function AdminInventoryPage({
    searchParams,
}: AdminInventoryPageProps) {
    const params = await searchParams;

    const search = params.q?.trim() ?? "";
    const categoryFilter = getValidCategory(params.categoria);
    const statusFilter = getValidStatus(params.estado);
    const visibilityFilter = getValidVisibility(params.visibilidad);
    const branchFilter =
        params.sucursal && params.sucursal !== "TODOS"
            ? Number(params.sucursal)
            : 0;

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
                        version: {
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
                ],
            }
            : {}),

        ...(categoryFilter !== "TODOS"
            ? {
                category: categoryFilter,
            }
            : {}),

        ...(statusFilter !== "TODOS"
            ? {
                status: statusFilter,
            }
            : {}),

        ...(visibilityFilter === "ACTIVOS"
            ? {
                active: true,
            }
            : {}),

        ...(visibilityFilter === "OCULTOS"
            ? {
                active: false,
            }
            : {}),

        ...(branchFilter
            ? {
                branchId: branchFilter,
            }
            : {}),
    };
    const [vehicles, branches] = await Promise.all([
        prisma.vehicle.findMany({
            where,
            include: {
                brand: true,
                branch: true,
                images: {
                    orderBy: {
                        order: "asc",
                    },
                },
                branchAvailabilities: {
                    include: {
                        branch: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
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
                    city: "asc",
                },
            ],
        }),
    ]);

    const total = vehicles.length;
    const autos = vehicles.filter((vehicle) => vehicle.category === "AUTO").length;
    const motos = vehicles.filter((vehicle) => vehicle.category === "MOTO").length;
    const todoTerreno = vehicles.filter(
        (vehicle) => vehicle.category === "TODOTERRENO"
    ).length;

    return (
        <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
            <Header />

            <section className="bg-[var(--rise-navy)] py-12 text-white">
                <Container>
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                                Administración
                            </p>

                            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                                Inventario
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                                Módulo interno para consultar y gestionar unidades registradas
                                en la base de datos de prueba.
                            </p>
                        </div>

                        <Link
                            href="/admin/inventario/nuevo"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                        >
                            <Plus size={18} />
                            Nuevo vehículo
                        </Link>
                    </div>
                </Container>
            </section>

            <section className="py-8">
                <Container>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
                            <Car className="text-[var(--rise-blue)]" />
                            <p className="mt-4 text-sm font-bold text-slate-500">Total</p>
                            <p className="mt-1 text-3xl font-black">{total}</p>
                        </div>

                        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
                            <Car className="text-[var(--rise-blue)]" />
                            <p className="mt-4 text-sm font-bold text-slate-500">Autos</p>
                            <p className="mt-1 text-3xl font-black">{autos}</p>
                        </div>

                        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
                            <Gauge className="text-[var(--rise-blue)]" />
                            <p className="mt-4 text-sm font-bold text-slate-500">Motos</p>
                            <p className="mt-1 text-3xl font-black">{motos}</p>
                        </div>

                        <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
                            <Settings className="text-[var(--rise-blue)]" />
                            <p className="mt-4 text-sm font-bold text-slate-500">
                                Todo terreno
                            </p>
                            <p className="mt-1 text-3xl font-black">{todoTerreno}</p>
                        </div>
                    </div>
                </Container>
            </section>

            <section className="pb-16">
                <Container>
                    <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-6">
                            <h2 className="text-2xl font-black">Unidades registradas</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Información de la base de datos de prueba.
                            </p>
                        </div>

                        <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--rise-navy)]">
                                        Filtros de inventario
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Busca y filtra unidades por categoría, estado, visibilidad o sucursal.
                                    </p>
                                </div>

                                <Link
                                    href="/admin/inventario"
                                    className="rounded-xl border border-[var(--rise-border)] px-4 py-2 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                                >
                                    Limpiar filtros
                                </Link>
                            </div>

                            <form
                                action="/admin/inventario"
                                className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]"
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
                                            placeholder="Nombre, marca, modelo..."
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Categoría
                                    </span>

                                    <select
                                        name="categoria"
                                        defaultValue={categoryFilter}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Estado
                                    </span>

                                    <select
                                        name="estado"
                                        defaultValue={statusFilter}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Visibilidad
                                    </span>

                                    <select
                                        name="visibilidad"
                                        defaultValue={visibilityFilter}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                    >
                                        {visibilityOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Sucursal
                                    </span>

                                    <select
                                        name="sucursal"
                                        defaultValue={branchFilter || "TODOS"}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                    >
                                        <option value="TODOS">Todas</option>

                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.city} · {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="submit"
                                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] xl:self-end"
                                >
                                    Filtrar
                                </button>
                            </form>

                            <p className="mt-4 text-sm font-bold text-slate-500">
                                Mostrando {vehicles.length} vehículo(s)
                            </p>
                        </section>

                        <div className="overflow-x-auto">
                            <div className="mt-8 space-y-4">
                                {vehicles.map((vehicle) => {
                                    const thumbnailImage =
                                        vehicle.images.find((image) => image.type === "IMAGE")?.url ||
                                        vehicle.mainImage ||
                                        null;

                                    return (
                                        <article
                                            key={vehicle.id}
                                            className={`rounded-[1.75rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:shadow-lg hover:shadow-slate-900/10 ${!vehicle.active ? "opacity-75" : ""
                                                }`}
                                        >
                                            <div className="grid gap-5 xl:grid-cols-[140px_1.3fr_0.8fr_0.9fr_170px] xl:items-center">
                                                <div className="overflow-hidden rounded-2xl bg-slate-100">
                                                    {thumbnailImage ? (
                                                        <img
                                                            src={thumbnailImage}
                                                            alt={vehicle.name}
                                                            className="h-32 w-full object-cover xl:h-28"
                                                        />
                                                    ) : (
                                                        <div className="grid h-32 w-full place-items-center text-xs font-black text-slate-400 xl:h-28">
                                                            Sin imagen
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-black ${vehicle.active
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-red-50 text-red-700"
                                                                }`}
                                                        >
                                                            {vehicle.active ? "Activo en sitio" : "Oculto del sitio"}
                                                        </span>

                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                                            {vehicle.status}
                                                        </span>
                                                    </div>

                                                    <h3 className="mt-3 text-xl font-black leading-tight text-[var(--rise-navy)]">
                                                        {vehicle.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                                        {vehicle.brand.name} · {vehicle.model} · {vehicle.year}
                                                    </p>

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                                                            {vehicle.category === "AUTO"
                                                                ? "Auto"
                                                                : vehicle.category === "MOTO"
                                                                    ? "Moto"
                                                                    : "Todo terreno"}
                                                        </span>

                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                                            {vehicle.condition === "NUEVO" ? "Nuevo" : "Seminuevo"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 p-4">
                                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                        Precio
                                                    </p>

                                                    <p className="mt-1 text-2xl font-black text-[var(--rise-navy)]">
                                                        {formatCurrency(vehicle.price)}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 p-4">
                                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                        Sucursal principal
                                                    </p>

                                                    <p className="mt-2 text-sm font-black text-[var(--rise-navy)]">
                                                        {vehicle.branch.city}
                                                    </p>

                                                    {vehicle.branchAvailabilities.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-black text-slate-400">
                                                                Disponible en {vehicle.branchAvailabilities.length} sucursal(es)
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                {vehicle.branchAvailabilities.slice(0, 4).map((item) => (
                                                                    <span
                                                                        key={item.id}
                                                                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600"
                                                                    >
                                                                        {item.branch.city}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    {vehicle.active ? (
                                                        <a
                                                            href={`/vehiculos/${vehicle.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center rounded-xl border border-[var(--rise-border)] px-4 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                                                        >
                                                            Ver público
                                                        </a>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
                                                        >
                                                            Oculto
                                                        </button>
                                                    )}

                                                    <a
                                                        href={`/admin/inventario/${vehicle.id}/editar`}
                                                        className="inline-flex items-center justify-center rounded-xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                                                    >
                                                        Editar
                                                    </a>

                                                    <form action={toggleVehicleActive.bind(null, vehicle.id, !vehicle.active)}>
                                                        <button
                                                            type="submit"
                                                            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition ${vehicle.active
                                                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                }`}
                                                        >
                                                            {vehicle.active ? "Desactivar" : "Activar"}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            <Footer />
        </main>
    );
}