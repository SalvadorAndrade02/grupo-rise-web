import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  Gauge,
  ImageIcon,
  Inbox,
  Layers3,
  MessageSquare,
  Plus,
  Store,
  Tags,
} from "lucide-react";
import {
  LeadStatus,
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
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

function getLeadStatusClasses(status: string) {
  const classes: Record<string, string> = {
    NUEVO: "bg-blue-50 text-blue-700",
    CONTACTADO: "bg-purple-50 text-purple-700",
    EN_SEGUIMIENTO: "bg-amber-50 text-amber-700",
    CERRADO: "bg-emerald-50 text-emerald-700",
    PERDIDO: "bg-red-50 text-red-700",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600";
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
    totalNewVehicles,
    totalUsedVehicles,
    totalPublicInventory,
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
        condition: VehicleCondition.NUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        condition: VehicleCondition.SEMINUEVO,
      },
    }),

    prisma.vehicle.count({
      where: {
        active: true,
        condition: VehicleCondition.SEMINUEVO,
        status: VehicleStatus.DISPONIBLE,
        branch: {
          active: true,
        },
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
        status: LeadStatus.NUEVO,
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
        updatedAt: "desc",
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
          take: 1,
        },
      },
    }),

    prisma.catalogModel.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
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
      title: "Unidades registradas",
      value: totalVehicles,
      description: "Nuevas, seminuevas, vendidas u ocultas",
      icon: Car,
      href: "/admin/inventario",
      className: "bg-blue-50 text-blue-700",
    },
    {
      title: "Nuevos",
      value: totalNewVehicles,
      description: "Unidades registradas como nuevas",
      icon: BadgeCheck,
      href: "/admin/inventario?condicion=NUEVO",
      className: "bg-purple-50 text-purple-700",
    },
    {
      title: "Seminuevos",
      value: totalUsedVehicles,
      description: "Unidades registradas como seminuevas",
      icon: Gauge,
      href: "/admin/inventario?condicion=SEMINUEVO",
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "Inventario público",
      value: totalPublicInventory,
      description: "Seminuevos disponibles y visibles",
      icon: Eye,
      href: "/inventario",
      className: "bg-emerald-50 text-emerald-700",
    },
  ];

  const quickActions = [
    {
      title: "Registrar unidad",
      description: "Alta de vehículo nuevo o seminuevo.",
      href: "/admin/inventario/nuevo",
      icon: Plus,
    },
    {
      title: "Nuevo modelo catálogo",
      description: "Agregar ficha comercial por marca.",
      href: "/admin/catalogo/nuevo",
      icon: Tags,
    },
    {
      title: "Solicitudes",
      description: "Revisar cotizaciones y citas recibidas.",
      href: "/admin/leads",
      icon: MessageSquare,
    },
    {
      title: "Sucursales",
      description: "Administrar puntos de atención.",
      href: "/admin/sucursales",
      icon: Store,
    },
  ];

  const modules = [
    {
      title: "Inventario de unidades",
      description:
        "Administra vehículos reales nuevos o seminuevos, su estado, visibilidad, precio, fotos, sucursal y disponibilidad pública.",
      href: "/admin/inventario",
      publicHref: "/inventario",
      icon: Car,
      stats: `${totalVehicles} unidad(es) · ${totalPublicInventory} visible(s) en público`,
    },
    {
      title: "Catálogo de modelos",
      description:
        "Gestiona modelos comerciales por marca, categoría, descripción, precio desde, galería y ficha pública.",
      href: "/admin/catalogo",
      publicHref: "/catalogo",
      icon: Layers3,
      stats: `${activeCatalogModels} modelo(s) activo(s) de ${totalCatalogModels}`,
    },
    {
      title: "Solicitudes CRM",
      description:
        "Da seguimiento a cotizaciones, pruebas de manejo, citas, financiamiento y mensajes enviados desde el sitio.",
      href: "/admin/leads",
      publicHref: "/contacto",
      icon: MessageSquare,
      stats: `${newLeads} nueva(s) · ${totalLeads} total(es)`,
    },
    {
      title: "Sucursales",
      description:
        "Administra direcciones, ciudades, WhatsApp, teléfonos, horarios y datos de contacto por sucursal.",
      href: "/admin/sucursales",
      publicHref: "/sucursales",
      icon: Building2,
      stats: `${activeBranches} sucursal(es) activa(s)`,
    },
  ];

  return (
    <div>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Panel administrativo
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Dashboard Grupo Rise
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Administra unidades reales, catálogo comercial, solicitudes,
              sucursales y contenido público desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
            >
              <Eye size={17} />
              Ver sitio
            </Link>

            <Link
              href="/admin/inventario/nuevo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <Plus size={17} />
              Registrar unidad
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
              <h2 className="text-2xl font-black">Accesos rápidos</h2>

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
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Módulos
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Administración del sitio
            </h2>
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
                      <h3 className="text-2xl font-black">{module.title}</h3>

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
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${getLeadStatusClasses(
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
            <div>
              <h2 className="text-2xl font-black">Regla de publicación</h2>

              <p className="mt-1 text-sm text-slate-500">
                Así se decide qué aparece en el inventario público.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} />
                  <p className="font-black">Sí aparece en /inventario</p>
                </div>

                <p className="mt-2 text-sm font-bold">
                  Condición Seminuevo + Estado Disponible + Visible + Sucursal
                  activa.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 text-slate-600">
                <div className="flex items-center gap-3">
                  <Inbox size={24} />
                  <p className="font-black">No aparece públicamente</p>
                </div>

                <p className="mt-2 text-sm font-bold">
                  Si está como Nuevo, Vendido, Apartado, Inactivo u Oculto, se
                  queda solo para control interno.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Unidades recientes</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimos vehículos modificados en inventario.
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
                    className="grid gap-4 rounded-2xl bg-slate-50 p-3 transition hover:bg-white hover:shadow-md hover:shadow-slate-900/5 sm:grid-cols-[96px_1fr]"
                  >
                    <div className="h-24 overflow-hidden rounded-xl bg-slate-200">
                      {image ? (
                        <img
                          src={image}
                          alt={vehicle.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <ImageIcon size={28} />
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

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                          {vehicle.condition === VehicleCondition.SEMINUEVO
                            ? "Seminuevo"
                            : "Nuevo"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                          {getVehicleStatusLabel(vehicle.status)}
                        </span>
                      </div>

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
                    Aún no hay unidades registradas.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Catálogo reciente</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimos modelos comerciales modificados.
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
                  <article
                    key={model.id}
                    className="grid gap-4 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[96px_1fr]"
                  >
                    <div className="h-24 overflow-hidden rounded-xl bg-slate-200">
                      {image ? (
                        <img
                          src={image}
                          alt={model.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <ImageIcon size={28} />
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

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/catalogo/${model.id}/editar`}
                          className="rounded-full bg-[var(--rise-navy)] px-3 py-1 text-xs font-black uppercase tracking-wider text-white"
                        >
                          Editar
                        </Link>

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
                  </article>
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
    </div>
  );
}