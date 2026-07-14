import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Store,
  Users,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import {
  AdminHero,
  AdminSection,
  AdminSummaryCard,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function cleanPhone(
  value?: string | null
) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppHref(
  phone?: string | null,
  message?: string
) {
  const phoneNumber = cleanPhone(phone);

  if (!phoneNumber) {
    return "";
  }

  const finalPhone =
    phoneNumber.startsWith("52")
      ? phoneNumber
      : `52${phoneNumber}`;

  const text = message
    ? `?text=${encodeURIComponent(
      message
    )}`
    : "";

  return `https://wa.me/${finalPhone}${text}`;
}

function splitServices(
  value?: string | null
) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBranchLocationText(branch: {
  address: string;
  city: string;
  state: string;
}) {
  return `${branch.address}, ${branch.city}, ${branch.state}`;
}

function getMapExternalUrl(branch: {
  address: string;
  city: string;
  state: string;
  googleMapsUrl?: string | null;
}) {
  if (branch.googleMapsUrl?.trim()) {
    return branch.googleMapsUrl;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getBranchLocationText(branch)
  )}`;
}

function getBranchIssues(branch: {
  active: boolean;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  schedule: string | null;
  services: string | null;
  googleMapsUrl: string | null;
  vehicles: {
    id: number;
  }[];
}) {
  const issues: string[] = [];

  if (!branch.address?.trim()) {
    issues.push("Sin dirección");
  }

  if (!branch.phone?.trim()) {
    issues.push("Sin teléfono");
  }

  if (!branch.whatsapp?.trim()) {
    issues.push("Sin WhatsApp");
  }

  if (!branch.email?.trim()) {
    issues.push("Sin correo");
  }

  if (!branch.schedule?.trim()) {
    issues.push("Sin horario");
  }

  if (!branch.services?.trim()) {
    issues.push("Sin servicios");
  }

  if (!branch.googleMapsUrl?.trim()) {
    issues.push("Sin Google Maps");
  }

  if (
    !branch.active &&
    branch.vehicles.length > 0
  ) {
    issues.push(
      "Inactiva con vehículos disponibles"
    );
  }

  return issues;
}

function revalidateBranchPaths(
  branchId: number
) {
  revalidatePath("/admin");
  revalidatePath("/admin/sucursales");

  revalidatePath(
    `/admin/sucursales/${branchId}/editar`
  );

  revalidatePath("/sucursales");

  revalidatePath(
    `/sucursales/${branchId}`
  );

  revalidatePath("/catalogo");
  revalidatePath("/inventario");
  revalidatePath("/");
}

async function toggleBranchActive(
  branchId: number
) {
  "use server";

  await requireAdmin();

  if (
    !Number.isInteger(branchId) ||
    branchId <= 0
  ) {
    return;
  }

  const branch =
    await prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
        active: true,
      },
    });

  if (!branch) {
    return;
  }

  await prisma.branch.update({
    where: {
      id: branchId,
    },

    data: {
      active: !branch.active,
    },
  });

  revalidateBranchPaths(branchId);
}

export default async function AdminBranchesPage() {
  await requireAdmin();

  const branches =
    await prisma.branch.findMany({
      include: {
        vehicles: {
          where: {
            active: true,

            status:
              VehicleStatus.DISPONIBLE,

            brand: {
              active: true,
            },
          },

          select: {
            id: true,
            condition: true,
          },
        },

        _count: {
          select: {
            leads: true,
          },
        },
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          city: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const total = branches.length;

  const activeBranches =
    branches.filter(
      (branch) => branch.active
    ).length;

  const inactiveBranches =
    branches.filter(
      (branch) => !branch.active
    ).length;

  const totalVehicles =
    branches.reduce(
      (sum, branch) =>
        sum + branch.vehicles.length,
      0
    );

  const totalNewVehicles =
    branches.reduce(
      (sum, branch) =>
        sum +
        branch.vehicles.filter(
          (vehicle) =>
            vehicle.condition ===
            VehicleCondition.NUEVO
        ).length,
      0
    );

  const totalUsedVehicles =
    branches.reduce(
      (sum, branch) =>
        sum +
        branch.vehicles.filter(
          (vehicle) =>
            vehicle.condition ===
            VehicleCondition.SEMINUEVO
        ).length,
      0
    );

  const totalLeads =
    branches.reduce(
      (sum, branch) =>
        sum + branch._count.leads,
      0
    );

  const branchesWithIssues =
    branches.filter(
      (branch) =>
        getBranchIssues(branch).length >
        0
    ).length;

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow="Administración"
        title="Sucursales"
        description="Gestiona agencias, ubicaciones, teléfonos, horarios, servicios, mapas y disponibilidad pública de Grupo Rise."
        icon={Building2}
        actions={
          <>
            <Link
              href="/sucursales"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              Ver sitio público
              <ExternalLink size={16} />
            </Link>

            <Link
              href="/admin/sucursales/nueva"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nueva sucursal
            </Link>
          </>
        }
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <AdminSummaryCard
          icon={Building2}
          label="Total sucursales"
          value={total}
        />

        <AdminSummaryCard
          icon={Store}
          label="Activas"
          value={activeBranches}
          tone="emerald"
        />

        <AdminSummaryCard
          icon={EyeOff}
          label="Inactivas"
          value={inactiveBranches}
          tone="red"
        />

        <AdminSummaryCard
          icon={Car}
          label="Vehículos"
          value={totalVehicles}
          tone="blue"
        />

        <AdminSummaryCard
          icon={Users}
          label="Solicitudes"
          value={totalLeads}
          tone="violet"
        />

        <AdminSummaryCard
          icon={AlertTriangle}
          label="Requieren atención"
          value={branchesWithIssues}
          tone="amber"
        />
      </section>

      <AdminSection
        icon={Store}
        eyebrow="Directorio"
        title="Sucursales registradas"
        description="La información de esta sección alimenta el directorio público, la disponibilidad de vehículos y las solicitudes comerciales."
        className="mt-6"
        contentClassName="p-5 md:p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500">
            {total} sucursal
            {total === 1 ? "" : "es"}{" "}
            registrada
            {total === 1 ? "" : "s"}
          </p>

          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafb] px-4 py-2 text-xs font-black text-slate-600">
            <BadgeCheck size={15} />

            Nuevos: {totalNewVehicles} ·
            Seminuevos: {totalUsedVehicles}
          </span>
        </div>

        {branches.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => {
              const services =
                splitServices(
                  branch.services
                );

              const issues =
                getBranchIssues(branch);

              const newVehicles =
                branch.vehicles.filter(
                  (vehicle) =>
                    vehicle.condition ===
                    VehicleCondition.NUEVO
                ).length;

              const usedVehicles =
                branch.vehicles.filter(
                  (vehicle) =>
                    vehicle.condition ===
                    VehicleCondition.SEMINUEVO
                ).length;

              const whatsappHref =
                getWhatsAppHref(
                  branch.whatsapp,
                  `Hola, me gustaría recibir información de ${branch.name}.`
                );

              const phone = cleanPhone(
                branch.phone
              );

              const mapUrl =
                getMapExternalUrl(branch);

              return (
                <article
                  key={branch.id}
                  className="group overflow-hidden rounded-[20px] border border-black/[0.08] bg-[#f8fafb] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/25 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  {branch.coverImageUrl && (
                    <div className="relative h-32 overflow-hidden bg-slate-100">
                      <img
                        src={
                          branch.coverImageUrl
                        }
                        alt={`Fachada de ${branch.name}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#101c27]/60 to-transparent" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${branch.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                        >
                          {branch.active ? (
                            <Eye size={12} />
                          ) : (
                            <EyeOff
                              size={12}
                            />
                          )}

                          {branch.active
                            ? "Activa"
                            : "Inactiva"}
                        </span>

                        <h3 className="mt-4 truncate text-xl font-black tracking-[-0.025em] text-[#192a3a]">
                          {branch.name}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {branch.city},{" "}
                          {branch.state}
                        </p>
                      </div>

                      {branch.logoUrl ? (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-slate-100 bg-white p-2 shadow-sm">
                          <img
                            src={
                              branch.logoUrl
                            }
                            alt={`Logo ${branch.name}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#e7edf1] text-[#192a3a]">
                          <Building2
                            size={22}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-slate-600">
                      <div className="flex gap-3 rounded-[14px] border border-slate-100 bg-white p-3">
                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-[#192a3a]"
                        />

                        <span className="line-clamp-2 text-xs font-semibold leading-5">
                          {branch.address}
                        </span>
                      </div>

                      {branch.phone && (
                        <div className="flex gap-3 rounded-[14px] border border-slate-100 bg-white p-3">
                          <Phone
                            size={17}
                            className="mt-0.5 shrink-0 text-[#192a3a]"
                          />

                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              className="truncate text-xs font-black hover:text-[#29465c]"
                            >
                              {
                                branch.phone
                              }
                            </a>
                          ) : (
                            <span className="truncate text-xs font-semibold">
                              {
                                branch.phone
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex gap-3 rounded-[14px] border border-slate-100 bg-white p-3">
                          <Mail
                            size={17}
                            className="mt-0.5 shrink-0 text-[#192a3a]"
                          />

                          <a
                            href={`mailto:${branch.email}`}
                            className="truncate text-xs font-black hover:text-[#29465c]"
                          >
                            {branch.email}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2">
                      <BranchMetric
                        label="Total"
                        value={
                          branch.vehicles
                            .length
                        }
                      />

                      <BranchMetric
                        label="Nuevos"
                        value={newVehicles}
                      />

                      <BranchMetric
                        label="Semi"
                        value={usedVehicles}
                      />

                      <BranchMetric
                        label="Leads"
                        value={
                          branch._count
                            .leads
                        }
                      />
                    </div>

                    {services.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {services
                          .slice(0, 5)
                          .map(
                            (service) => (
                              <span
                                key={
                                  service
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600"
                              >
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-600"
                                />

                                {service}
                              </span>
                            )
                          )}

                        {services.length >
                          5 && (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-400">
                              +
                              {services.length -
                                5}
                            </span>
                          )}
                      </div>
                    )}

                    {issues.length > 0 && (
                      <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                        <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
                          <AlertTriangle
                            size={14}
                          />
                          Requiere revisión
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {issues
                            .slice(0, 4)
                            .map((issue) => (
                              <span
                                key={issue}
                                className="rounded-full border border-amber-100 bg-white px-3 py-1 text-[10px] font-black text-amber-700"
                              >
                                {issue}
                              </span>
                            ))}

                          {issues.length >
                            4 && (
                              <span className="rounded-full border border-amber-100 bg-white px-3 py-1 text-[10px] font-black text-amber-700">
                                +
                                {issues.length -
                                  4}
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/admin/sucursales/${branch.id}/editar`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                        >
                          Editar
                          <ArrowRight
                            size={15}
                          />
                        </Link>

                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-[#192a3a] hover:text-[#192a3a] active:scale-[0.98]"
                        >
                          Mapa
                          <ExternalLink
                            size={15}
                          />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {whatsappHref ? (
                          <a
                            href={
                              whatsappHref
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                          >
                            <MessageCircle
                              size={15}
                            />
                            WhatsApp
                          </a>
                        ) : (
                          <div className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-100 px-4 text-xs font-black text-slate-400">
                            Sin WhatsApp
                          </div>
                        )}

                        <form
                          action={toggleBranchActive.bind(
                            null,
                            branch.id
                          )}
                        >
                          <button
                            type="submit"
                            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition active:scale-[0.98] ${branch.active
                                ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                          >
                            {branch.active ? (
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
                                Activar
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-[#f8fafb] p-10 text-center">
            <Building2
              size={48}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-xl font-black text-[#192a3a]">
              Sin sucursales
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Agrega la primera sucursal para
              comenzar a estructurar el sitio.
            </p>

            <Link
              href="/admin/sucursales/nueva"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nueva sucursal
            </Link>
          </div>
        )}
      </AdminSection>
    </div>
  );
}

function BranchMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[14px] border border-slate-100 bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-[#192a3a]">
        {value}
      </p>
    </div>
  );
}