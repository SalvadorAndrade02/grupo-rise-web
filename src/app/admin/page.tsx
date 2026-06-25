import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Car,
  EyeOff,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Settings,
  UsersRound,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

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

function getVehicleStatusLabel(status: string) {
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const [
    totalVehicles,
    activeVehicles,
    hiddenVehicles,
    soldVehicles,
    newLeads,
    activeBranches,
    latestLeads,
    latestVehicles,
  ] = await Promise.all([
    prisma.vehicle.count(),

    prisma.vehicle.count({
      where: {
        active: true,
      },
    }),

    prisma.vehicle.count({
      where: {
        active: false,
      },
    }),

    prisma.vehicle.count({
      where: {
        status: "VENDIDO",
      },
    }),

    prisma.lead.count({
      where: {
        status: "NUEVO",
      },
    }),

    prisma.branch.count({
      where: {
        active: true,
      },
    }),

    prisma.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        vehicle: {
          include: {
            brand: true,
          },
        },
        branch: true,
      },
    }),

    prisma.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
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
        },
      },
    }),
  ]);

  const stats = [
    {
      title: "Vehículos registrados",
      value: totalVehicles,
      description: "Total de unidades en sistema",
      icon: Car,
      href: "/admin/inventario",
    },
    {
      title: "Activos en sitio",
      value: activeVehicles,
      description: "Visibles en inventario público",
      icon: LayoutDashboard,
      href: "/inventario",
    },
    {
      title: "Ocultos",
      value: hiddenVehicles,
      description: "Unidades desactivadas",
      icon: EyeOff,
      href: "/admin/inventario",
    },
    {
      title: "Solicitudes nuevas",
      value: newLeads,
      description: "Leads pendientes de atención",
      icon: Inbox,
      href: "/admin/leads",
    },
    {
      title: "Sucursales activas",
      value: activeBranches,
      description: "Agencias disponibles",
      icon: Building2,
      href: "/admin/sucursales",
    },
    {
      title: "Vendidos",
      value: soldVehicles,
      description: "Unidades marcadas como vendidas",
      icon: UsersRound,
      href: "/admin/inventario",
    },
  ];

  const quickActions = [
    {
      title: "Nuevo vehículo",
      description: "Registrar una unidad con imágenes y videos.",
      href: "/admin/inventario/nuevo",
      icon: PlusCircle,
    },
    {
      title: "Administrar inventario",
      description: "Editar, activar o desactivar vehículos.",
      href: "/admin/inventario",
      icon: Car,
    },
    {
      title: "Solicitudes",
      description: "Ver cotizaciones, citas y contactos recibidos.",
      href: "/admin/leads",
      icon: Inbox,
    },
    {
      title: "Sucursales",
      description: "Administrar agencias, ubicación y contacto.",
      href: "/admin/sucursales",
      icon: Building2,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                <Settings size={18} />
                Administración
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Dashboard Grupo Rise
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Resumen general del inventario, sucursales y solicitudes
                recibidas desde el sitio.
              </p>
            </div>

            <Link
              href="/admin/inventario/nuevo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <PlusCircle size={19} />
              Nuevo vehículo
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[1.75rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-500">
                        {item.title}
                      </p>

                      <p className="mt-3 text-4xl font-black text-[var(--rise-navy)]">
                        {item.value}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                      <Icon size={24} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Últimas solicitudes</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Leads recibidos recientemente.
                  </p>
                </div>

                <Link
                  href="/admin/leads"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {latestLeads.length > 0 ? (
                  latestLeads.map((lead) => (
                    <article
                      key={lead.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                            {getLeadTypeLabel(lead.type)}
                          </span>

                          <h3 className="mt-3 text-base font-black text-[var(--rise-navy)]">
                            {lead.name}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {lead.phone}
                            {lead.email ? ` · ${lead.email}` : ""}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                          {lead.status}
                        </span>
                      </div>

                      {lead.vehicle && (
                        <p className="mt-3 text-sm font-bold text-slate-600">
                          Vehículo: {lead.vehicle.brand.name}{" "}
                          {lead.vehicle.name}
                        </p>
                      )}

                      {lead.branch && (
                        <p className="mt-1 text-sm text-slate-500">
                          Sucursal: {lead.branch.name}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-bold text-slate-500">
                      Todavía no hay solicitudes.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Últimos vehículos</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Unidades registradas recientemente.
                  </p>
                </div>

                <Link
                  href="/admin/inventario"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Ver inventario
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {latestVehicles.map((vehicle) => {
                  const thumbnailImage =
                    vehicle.images[0]?.url || vehicle.mainImage || null;

                  return (
                    <article
                      key={vehicle.id}
                      className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="overflow-hidden rounded-xl bg-slate-200">
                        {thumbnailImage ? (
                          <img
                            src={thumbnailImage}
                            alt={vehicle.name}
                            className="h-20 w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-20 place-items-center text-xs font-black text-slate-400">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                              vehicle.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {vehicle.active ? "Activo" : "Oculto"}
                          </span>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                            {getVehicleStatusLabel(vehicle.status)}
                          </span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-sm font-black text-[var(--rise-navy)]">
                          {vehicle.name}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {vehicle.brand.name} · {vehicle.year}
                        </p>

                        <p className="mt-1 text-sm font-black text-[var(--rise-blue)]">
                          {formatCurrency(vehicle.price)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-7">
            <div>
              <h2 className="text-2xl font-black">Accesos rápidos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ir directamente a las acciones principales del sistema.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-900/10"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-4 text-base font-black text-[var(--rise-navy)]">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {action.description}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                      Abrir
                      <ArrowRight
                        size={17}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </Container>
      </section>

      <Footer />
    </main>
  );
}