import Link from "next/link";
import { Building2, MapPin, Phone, Plus, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const branches = await prisma.branch.findMany({
    include: {
      vehicles: true,
      leads: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
  });

  const total = branches.length;
  const active = branches.filter((branch) => branch.active).length;
  const inactive = branches.filter((branch) => !branch.active).length;

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">

      <section className="py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Administración
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Sucursales
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Gestiona las agencias, ubicaciones, teléfonos, horarios y
                servicios disponibles de Grupo Rise.
              </p>
            </div>

            <Link
              href="/admin/sucursales/nueva"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <Plus size={18} />
              Nueva sucursal
            </Link>
          </div>
      </section>

      <section className="py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <Building2 className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Total sucursales
              </p>
              <p className="mt-1 text-3xl font-black">{total}</p>
            </div>

            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <Store className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Activas</p>
              <p className="mt-1 text-3xl font-black">{active}</p>
            </div>

            <div className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm">
              <Store className="text-[var(--rise-blue)]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Inactivas</p>
              <p className="mt-1 text-3xl font-black">{inactive}</p>
            </div>
          </div>
      </section>

      <section className="pb-16">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-black">Sucursales registradas</h2>
              <p className="mt-2 text-sm text-slate-500">
                Aquí se mostrará la información real de las ubicaciones de Grupo Rise.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-3xl border border-[var(--rise-border)] bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          branch.active
                            ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {branch.active ? "Activa" : "Inactiva"}
                      </span>

                      <h3 className="mt-4 text-xl font-black">
                        {branch.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {branch.city}, {branch.state}
                      </p>
                    </div>

                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--rise-blue)]">
                      <Building2 size={22} />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="flex gap-2">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                      />
                      <span>{branch.address}</span>
                    </div>

                    {branch.phone && (
                      <div className="flex gap-2">
                        <Phone
                          size={17}
                          className="mt-0.5 shrink-0 text-[var(--rise-blue)]"
                        />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                  </div>

                  {branch.services && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {branch.services
                        .split(",")
                        .map((service) => service.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((service) => (
                          <span
                            key={service}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
                          >
                            {service}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-4">
                    <Link
                      href={`/admin/sucursales/${branch.id}/editar`}
                      className="text-sm font-black text-[var(--rise-blue)] hover:text-[var(--rise-navy)]"
                    >
                      Editar
                    </Link>

                    {branch.googleMapsUrl && (
                      <a
                        href={branch.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-black text-slate-600 hover:text-[var(--rise-blue)]"
                      >
                        Ver mapa
                      </a>
                    )}
                  </div>
                </article>
              ))}

              {branches.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center md:col-span-2 xl:col-span-3">
                  <h3 className="text-xl font-black">Sin sucursales</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Agrega la primera sucursal para comenzar a estructurar el sitio.
                  </p>
                </div>
              )}
            </div>
          </div>
      </section>
      </main>
  );
}