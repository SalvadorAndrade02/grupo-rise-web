import Link from "next/link";
import {
  CalendarDays,
  Car,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

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

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      vehicle: {
        include: {
          brand: true,
        },
      },
      branch: true,
    },
  });

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] px-4 py-8 text-[var(--rise-navy)]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
              Administración
            </p>
            <h1 className="mt-2 text-3xl font-black">Solicitudes</h1>
            <p className="mt-2 text-sm text-slate-600">
              Cotizaciones, citas, pruebas de manejo y contactos recibidos.
            </p>
          </div>

          <Link
            href="/admin/inventario"
            className="rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Volver al inventario
          </Link>
        </div>

        <div className="mt-8 grid gap-5">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                    {getLeadTypeLabel(lead.type)}
                  </span>

                  <h2 className="mt-4 text-xl font-black text-[var(--rise-navy)]">
                    {lead.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <Phone size={16} />
                      {lead.phone}
                    </span>

                    {lead.email && (
                      <span className="inline-flex items-center gap-2">
                        <Mail size={16} />
                        {lead.email}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-2">
                      <User size={16} />
                      {lead.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-500">
                  {new Intl.DateTimeFormat("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(lead.createdAt)}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {lead.vehicle && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                      <Car size={15} />
                      Vehículo
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-700">
                      {lead.vehicle.brand.name} {lead.vehicle.name}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--rise-blue)]">
                      {formatCurrency(lead.vehicle.price)}
                    </p>
                  </div>
                )}

                {lead.branch && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Sucursal
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-700">
                      {lead.branch.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {lead.branch.city}, {lead.branch.state}
                    </p>
                  </div>
                )}

                {(lead.preferredDate || lead.preferredTime) && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                      <CalendarDays size={15} />
                      Fecha preferida
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-700">
                      {formatDate(lead.preferredDate)}
                    </p>
                    {lead.preferredTime && (
                      <p className="mt-1 text-sm text-slate-500">
                        {lead.preferredTime}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {lead.message && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    <MessageSquare size={15} />
                    Mensaje
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lead.message}
                  </p>
                </div>
              )}
            </article>
          ))}

          {leads.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-bold text-slate-500">
                Todavía no hay solicitudes registradas.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}