import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  Gauge,
  Inbox,
  Layers3,
  MessageSquare,
  Plus,
  Store,
  Tags,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
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

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    NUEVO: "bg-blue-50 text-blue-700",
    CONTACTADO: "bg-purple-50 text-purple-700",
    EN_SEGUIMIENTO: "bg-amber-50 text-amber-700",
    CERRADO: "bg-emerald-50 text-emerald-700",
    PERDIDO: "bg-red-50 text-red-700",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600";
}

function getBrandSlug(name: string) {
  const map: Record<string, string> = {
    "Can-Am": "can-am",
    Polaris: "polaris",
    "Royal Enfield": "royal-enfield",
    "Sea-Doo": "sea-doo",
    "Sea Doo": "sea-doo",
    SeaDoo: "sea-doo",
    Triumph: "triumph-motorcycles",
    Indian: "indian-motorcycle",
    Zeekr: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return map[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

export default async function AdminDashboardPage() {
  const [
    totalVehicles,
    activeVehicles,
    usedVehicles,
    totalCatalogModels,
    activeCatalogModels,
    activeBranches,
    totalLeads,
    newLeads,
    latestLeads,
    latestVehicles,
    latestCatalogModels,
  ] = await Promise.all([
    prisma.vehicle.count(),

    prisma.vehicle.count({
      where: {
        active: true,
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition: "SEMINUEVO",
      },
    }),

    prisma.catalogModel.count(),

    prisma.catalogModel.count({
      where: {
        active: true,
      },
    }),

    prisma.branch.count({
      where: {
        active: true,
      },
    }),

    prisma.lead.count(),

    prisma.lead.count({
      where: {
        status: "NUEVO",
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
      where: {
        active: true,
        condition: "SEMINUEVO",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
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
    }),

    prisma.catalogModel.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      include: {
        brand: true,
        category: true,
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
    }),
  ]);

  const stats = [
    {
      title: "Seminuevos activos",
      value: usedVehicles,
      description: "Vehículos visibles en inventario",
      icon: Car,
      href: "/admin/inventario",
      className: "bg-blue-50 text-blue-700",
    },
    {
      title: "Modelos catálogo",
      value: activeCatalogModels,
      description: `${totalCatalogModels} modelo(s) registrados`,
      icon: Tags,
      href: "/admin/catalogo",
      className: "bg-purple-50 text-purple-700",
    },
    {
      title: "Solicitudes nuevas",
      value: newLeads,
      description: `${totalLeads} solicitud(es) en total`,
      icon: Inbox,
      href: "/admin/leads?estado=NUEVO",
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "Sucursales activas",
      value: activeBranches,
      description: "Puntos de atención configurados",
      icon: Building2,
      href: "/admin/sucursales",
      className: "bg-emerald-50 text-emerald-700",
    },
  ];

  const quickActions = [
    {
      title: "Nuevo seminuevo",
      description: "Registrar unidad de venta rápida.",
      href: "/admin/inventario/nuevo",
      icon: Plus,
    },
    {
      title: "Nuevo modelo",
      description: "Agregar modelo nuevo al catálogo.",
      href: "/admin/catalogo/nuevo",
      icon: Tags,
    },
    {
      title: "Ver solicitudes",
      description: "Gestionar prospectos y citas.",
      href: "/admin/leads",
      icon: MessageSquare,
    },
    {
      title: "Nueva sucursal",
      description: "Crear punto de atención.",
      href: "/admin/sucursales/nueva",
      icon: Store,
    },
  ];

  const modules = [
    {
      title: "Inventario seminuevos",
      description:
        "Administra unidades reales, fotos, precio, kilometraje, sucursal y visibilidad.",
      href: "/admin/inventario",
      publicHref: "/inventario",
      icon: Car,
      stats: `${activeVehicles} activo(s) · ${usedVehicles} seminuevo(s)`,
    },
    {
      title: "Catálogo nuevos",
      description:
        "Gestiona modelos nuevos por marca, categoría, imágenes, precio desde y ficha pública.",
      href: "/admin/catalogo",
      publicHref: "/catalogo",
      icon: Layers3,
      stats: `${activeCatalogModels} modelo(s) activo(s)`,
    },
    {
      title: "Solicitudes CRM",
      description:
        "Da seguimiento a cotizaciones, citas, pruebas de manejo y contactos del sitio.",
      href: "/admin/leads",
      publicHref: "/contacto",
      icon: MessageSquare,
      stats: `${newLeads} nueva(s)`,
    },
    {
      title: "Sucursales",
      description:
        "Administra direcciones, teléfonos, WhatsApp, mapas y servicios por sucursal.",
      href: "/admin/sucursales",
      publicHref: "/sucursales",
      icon: Building2,
      stats: `${activeBranches} activa(s)`,
    },
  ];

  return (
      <section className="py-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Panel administrativo
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Dashboard Grupo Rise
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Administra inventario seminuevo, catálogo de modelos nuevos,
                solicitudes, sucursales y contenido público del sitio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                <Eye size={17} />
                Ver sitio
              </Link>

              <Link
                href="/admin/leads"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <MessageSquare size={17} />
                Solicitudes
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
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

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                    Abrir
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                  <Gauge size={23} />
                  Accesos rápidos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Acciones frecuentes para operar el sitio.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:bg-white hover:shadow-lg hover:shadow-slate-900/10"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                      <Icon size={21} />
                    </div>

                    <h3 className="mt-4 font-black">{action.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {action.description}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                      Ir
                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Módulos
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Administración del sitio
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;

                return (
                  <article
                    key={module.href}
                    className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--rise-navy)] text-white">
                        <Icon size={25} />
                      </div>

                      <div>
                        <h3 className="text-2xl font-black">
                          {module.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {module.description}
                        </p>

                        <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                          {module.stats}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={module.href}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                      >
                        Administrar
                        <ArrowRight size={17} />
                      </Link>

                      <Link
                        href={module.publicHref}
                        target="_blank"
                        className="inline-flex items-center justify-center rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
                      >
                        Ver público
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                    <Clock size={23} />
                    Últimas solicitudes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Prospectos recientes recibidos desde el sitio.
                  </p>
                </div>

                <Link
                  href="/admin/leads"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {latestLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href="/admin/leads"
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md hover:shadow-slate-900/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{lead.name}</p>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {getLeadTypeLabel(lead.type)}
                          {lead.vehicle
                            ? ` · ${lead.vehicle.brand.name} ${lead.vehicle.name}`
                            : ""}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {formatDate(lead.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getStatusClasses(
                          lead.status
                        )}`}
                      >
                        {getLeadStatusLabel(lead.status)}
                      </span>
                    </div>
                  </Link>
                ))}

                {latestLeads.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <MessageSquare className="mx-auto text-slate-400" size={42} />

                    <p className="mt-3 text-sm font-black text-slate-500">
                      Aún no hay solicitudes.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                    <BarChart3 size={23} />
                    Resumen operativo
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Estado general de contenido cargado.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-500">
                        Vehículos registrados
                      </p>
                      <p className="mt-1 text-3xl font-black">
                        {totalVehicles}
                      </p>
                    </div>

                    <Car className="text-[var(--rise-blue)]" size={32} />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-500">
                        Modelos activos en catálogo
                      </p>
                      <p className="mt-1 text-3xl font-black">
                        {activeCatalogModels}
                      </p>
                    </div>

                    <Tags className="text-[var(--rise-blue)]" size={32} />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-500">
                        Solicitudes nuevas
                      </p>
                      <p className="mt-1 text-3xl font-black">{newLeads}</p>
                    </div>

                    <CheckCircle2 className="text-emerald-600" size={32} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    Seminuevos recientes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Últimas unidades activas en inventario público.
                  </p>
                </div>

                <Link
                  href="/admin/inventario"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Administrar
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {latestVehicles.map((vehicle) => {
                  const image = vehicle.images[0]?.url || vehicle.mainImage || "";

                  return (
                    <Link
                      key={vehicle.id}
                      href={`/admin/inventario/${vehicle.id}/editar`}
                      className="grid gap-4 rounded-2xl bg-slate-50 p-3 transition hover:bg-white hover:shadow-md hover:shadow-slate-900/5 sm:grid-cols-[90px_1fr]"
                    >
                      <div className="h-24 overflow-hidden rounded-xl bg-slate-200">
                        {image ? (
                          <img
                            src={image}
                            alt={vehicle.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs font-black text-slate-400">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-black">
                          {vehicle.brand.name} {vehicle.name}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {vehicle.year} · {vehicle.branch.city}
                        </p>

                        <p className="mt-2 text-sm font-black text-[var(--rise-blue)]">
                          {formatCurrency(vehicle.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {latestVehicles.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Car className="mx-auto text-slate-400" size={42} />

                    <p className="mt-3 text-sm font-black text-slate-500">
                      Aún no hay seminuevos activos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    Catálogo reciente
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Últimos modelos nuevos registrados.
                  </p>
                </div>

                <Link
                  href="/admin/catalogo"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Administrar
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {latestCatalogModels.map((model) => {
                  const image = model.images[0]?.url || model.mainImage || "";
                  const brandSlug = getBrandSlug(model.brand.name);

                  return (
                    <Link
                      key={model.id}
                      href={`/admin/catalogo/${model.id}/editar`}
                      className="grid gap-4 rounded-2xl bg-slate-50 p-3 transition hover:bg-white hover:shadow-md hover:shadow-slate-900/5 sm:grid-cols-[90px_1fr]"
                    >
                      <div className="h-24 overflow-hidden rounded-xl bg-slate-200">
                        {image ? (
                          <img
                            src={image}
                            alt={model.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs font-black text-slate-400">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-black">
                          {model.brand.name} {model.name}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {model.category?.name ?? "Sin categoría"} ·{" "}
                          {model.year ?? "Año N/D"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                              model.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {model.active ? "Activo" : "Oculto"}
                          </span>

                          {model.active && (
                            <Link
                              href={`/catalogo/${brandSlug}/${model.slug}`}
                              target="_blank"
                              className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]"
                            >
                              Ver público
                            </Link>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {latestCatalogModels.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Tags className="mx-auto text-slate-400" size={42} />

                    <p className="mt-3 text-sm font-black text-slate-500">
                      Aún no hay modelos de catálogo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
      </section>
  );
}