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

export default async function AdminInventoryPage() {
    const vehicles = await prisma.vehicle.findMany({
        include: {
            brand: true,
            branch: true,
            branchAvailabilities: {
                include: {
                    branch: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

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

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Vehículo</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Condición</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Precio</th>
                                        <th className="px-6 py-4">Sucursal</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {vehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={vehicle.mainImage ?? ""}
                                                        alt={vehicle.name}
                                                        className="h-14 w-20 rounded-xl object-cover"
                                                    />

                                                    <div>
                                                        <p className="font-black text-[var(--rise-navy)]">
                                                            {vehicle.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {vehicle.brand.name} · {vehicle.model} ·{" "}
                                                            {vehicle.year}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-slate-600">
                                                {formatCategory(vehicle.category)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                                                    {formatCondition(vehicle.condition)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                                    {formatStatus(vehicle.status)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 font-black">
                                                {formatCurrency(vehicle.price)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin size={15} className="text-[var(--rise-blue)]" />
                                                        <span>{vehicle.branch.city}</span>
                                                    </div>

                                                    {vehicle.branchAvailabilities.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            <p className="text-xs font-black text-slate-400">
                                                                Disponible en {vehicle.branchAvailabilities.length} sucursal(es)
                                                            </p>

                                                            <div className="flex flex-wrap gap-1">
                                                                {vehicle.branchAvailabilities.slice(0, 3).map((item) => (
                                                                    <span
                                                                        key={item.id}
                                                                        className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                                                                    >
                                                                        {item.branch.city}
                                                                    </span>
                                                                ))}

                                                                {vehicle.branchAvailabilities.length > 3 && (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                                                                        +{vehicle.branchAvailabilities.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Link
                                                        href={`/vehiculos/${vehicle.id}`}
                                                        className="inline-flex items-center gap-1 font-black text-[var(--rise-blue)] hover:text-[var(--rise-navy)]"
                                                    >
                                                        Ver
                                                        <ChevronRight size={16} />
                                                    </Link>

                                                    <Link
                                                        href={`/admin/inventario/${vehicle.id}/editar`}
                                                        className="inline-flex items-center gap-1 font-black text-slate-600 hover:text-[var(--rise-blue)]"
                                                    >
                                                        Editar
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Container>
            </section>

            <Footer />
        </main>
    );
}