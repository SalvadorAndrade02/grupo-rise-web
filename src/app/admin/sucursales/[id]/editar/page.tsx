import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Store,
  Tags,
  Upload,
  Users,
} from "lucide-react";
import {
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteBranchImageFile,
  saveBranchImageFile,
} from "@/lib/branch-uploads";

export const dynamic = "force-dynamic";

type EditBranchPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getTextValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getOptionalTextValue(
  formData: FormData,
  fieldName: string
) {
  const value = getTextValue(
    formData,
    fieldName
  );

  return value || null;
}

function getOptionalIntegerValue(
  formData: FormData,
  fieldName: string
) {
  const rawValue = String(
    formData.get(fieldName) ?? ""
  ).trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isInteger(value)
    ? value
    : null;
}

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

function redirectBranchError(
  branchId: number,
  message: string
): never {
  redirect(
    `/admin/sucursales/${branchId}/editar?error=${encodeURIComponent(
      message
    )}`
  );
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
  revalidatePath("/catalogo");
  revalidatePath("/inventario");
}

async function safelyDeleteBranchImage(
  fileUrl?: string | null
) {
  if (!fileUrl) {
    return;
  }

  try {
    await deleteBranchImageFile(fileUrl);
  } catch (error) {
    console.error(
      "No se pudo eliminar la imagen de sucursal:",
      error
    );
  }
}

async function updateBranch(
  branchId: number,
  formData: FormData
) {
  "use server";

  await requireAdmin();

  if (
    !Number.isInteger(branchId) ||
    branchId <= 0
  ) {
    redirect("/admin/sucursales");
  }

  const currentBranch =
    await prisma.branch.findUnique({
      where: {
        id: branchId,
      },

      select: {
        id: true,
        logoUrl: true,
        coverImageUrl: true,
      },
    });

  if (!currentBranch) {
    redirect(
      `/admin/sucursales?error=${encodeURIComponent(
        "La sucursal ya no existe."
      )}`
    );
  }

  const name = getTextValue(
    formData,
    "name"
  );

  const city = getTextValue(
    formData,
    "city"
  );

  const state = getTextValue(
    formData,
    "state"
  );

  const address = getTextValue(
    formData,
    "address"
  );

  const phone = getOptionalTextValue(
    formData,
    "phone"
  );

  const whatsapp =
    getOptionalTextValue(
      formData,
      "whatsapp"
    );

  const email = getOptionalTextValue(
    formData,
    "email"
  );

  const schedule =
    getOptionalTextValue(
      formData,
      "schedule"
    );

  const googleMapsUrl =
    getOptionalTextValue(
      formData,
      "googleMapsUrl"
    );

  const services =
    getOptionalTextValue(
      formData,
      "services"
    );

  const sortOrder =
    getOptionalIntegerValue(
      formData,
      "sortOrder"
    ) ?? 0;

  const active =
    formData.get("active") === "on";

  if (
    !name ||
    !city ||
    !state ||
    !address
  ) {
    redirectBranchError(
      branchId,
      "Nombre, ciudad, estado y dirección son obligatorios."
    );
  }

  if (sortOrder < 0) {
    redirectBranchError(
      branchId,
      "El orden debe ser un número entero igual o mayor a cero."
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    redirectBranchError(
      branchId,
      "El correo electrónico no tiene un formato válido."
    );
  }

  if (googleMapsUrl) {
    try {
      const parsedUrl = new URL(
        googleMapsUrl
      );

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        throw new Error(
          "Protocolo no válido"
        );
      }
    } catch {
      redirectBranchError(
        branchId,
        "La URL de Google Maps no es válida."
      );
    }
  }

  let uploadedLogoUrl:
    | string
    | null = null;

  let uploadedCoverImageUrl:
    | string
    | null = null;

  try {
    uploadedLogoUrl =
      await saveBranchImageFile(
        formData.get("logoFile"),
        "logos"
      );

    uploadedCoverImageUrl =
      await saveBranchImageFile(
        formData.get(
          "coverImageFile"
        ),
        "fachadas"
      );
  } catch (error) {
    await safelyDeleteBranchImage(
      uploadedLogoUrl
    );

    await safelyDeleteBranchImage(
      uploadedCoverImageUrl
    );

    redirectBranchError(
      branchId,
      error instanceof Error
        ? error.message
        : "No se pudieron guardar las imágenes."
    );
  }

  const manualLogoUrl =
    getOptionalTextValue(
      formData,
      "logoUrl"
    );

  const manualCoverImageUrl =
    getOptionalTextValue(
      formData,
      "coverImageUrl"
    );

  const finalLogoUrl =
    uploadedLogoUrl ??
    manualLogoUrl ??
    currentBranch.logoUrl;

  const finalCoverImageUrl =
    uploadedCoverImageUrl ??
    manualCoverImageUrl ??
    currentBranch.coverImageUrl;

  try {
    await prisma.branch.update({
      where: {
        id: branchId,
      },

      data: {
        name,
        city,
        state,
        address,
        phone,
        whatsapp,
        email,
        schedule,
        googleMapsUrl,
        services,
        logoUrl: finalLogoUrl,
        coverImageUrl:
          finalCoverImageUrl,
        sortOrder,
        active,
      },
    });
  } catch (error) {
    await safelyDeleteBranchImage(
      uploadedLogoUrl
    );

    await safelyDeleteBranchImage(
      uploadedCoverImageUrl
    );

    console.error(
      "Error actualizando sucursal:",
      error
    );

    redirectBranchError(
      branchId,
      "No se pudieron guardar los cambios de la sucursal."
    );
  }

  if (
    uploadedLogoUrl &&
    currentBranch.logoUrl &&
    currentBranch.logoUrl !==
      uploadedLogoUrl
  ) {
    await safelyDeleteBranchImage(
      currentBranch.logoUrl
    );
  }

  if (
    uploadedCoverImageUrl &&
    currentBranch.coverImageUrl &&
    currentBranch.coverImageUrl !==
      uploadedCoverImageUrl
  ) {
    await safelyDeleteBranchImage(
      currentBranch.coverImageUrl
    );
  }

  revalidateBranchPaths(branchId);

  redirect(
    `/admin/sucursales/${branchId}/editar?success=${encodeURIComponent(
      "Sucursal actualizada correctamente."
    )}`
  );
}

export default async function EditBranchPage({
  params,
  searchParams,
}: EditBranchPageProps) {
  await requireAdmin();

  const { id } = await params;
  const query = await searchParams;

  const branchId = Number(id);

  if (
    !Number.isInteger(branchId) ||
    branchId <= 0
  ) {
    notFound();
  }

  const branch =
    await prisma.branch.findUnique({
      where: {
        id: branchId,
      },

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
    });

  if (!branch) {
    notFound();
  }

  const services = splitServices(
    branch.services
  );

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

  const mapUrl =
    getMapExternalUrl(branch);

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <Link
              href="/admin/sucursales"
              className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Volver a sucursales
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <Building2 size={15} />
              Sucursal #{branch.id}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              {branch.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Actualiza ubicación, contacto,
              imágenes, servicios y configuración
              pública de esta sucursal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sucursales"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
            >
              Ver página pública
              <ExternalLink size={16} />
            </Link>

            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              <MapPin size={16} />
              Ver ubicación
            </a>
          </div>
        </div>
      </section>

      {/* Mensajes */}
      {query.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{query.error}</span>
        </div>
      )}

      {query.success && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700"
        >
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{query.success}</span>
        </div>
      )}

      {/* Resumen */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={
            branch.active
              ? Eye
              : EyeOff
          }
          label="Estado"
          value={
            branch.active
              ? "Sucursal activa"
              : "Sucursal inactiva"
          }
        />

        <SummaryCard
          icon={Tags}
          label="Vehículos nuevos"
          value={String(newVehicles)}
        />

        <SummaryCard
          icon={Store}
          label="Seminuevos"
          value={String(usedVehicles)}
        />

        <SummaryCard
          icon={Users}
          label="Solicitudes"
          value={String(
            branch._count.leads
          )}
        />
      </section>

      <form
        action={updateBranch.bind(
          null,
          branch.id
        )}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
      >
        <div className="space-y-6">
          {/* Información principal */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Building2}
              eyebrow="Información principal"
              title="Datos de la sucursal"
              description="Actualiza el nombre comercial, ciudad, estado y dirección."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <div className="md:col-span-2">
                <FormInput
                  label="Nombre de la sucursal"
                  name="name"
                  required
                  defaultValue={branch.name}
                />
              </div>

              <FormInput
                label="Ciudad"
                name="city"
                required
                defaultValue={branch.city}
              />

              <FormInput
                label="Estado"
                name="state"
                required
                defaultValue={branch.state}
              />

              <div className="md:col-span-2">
                <FormTextarea
                  label="Dirección"
                  name="address"
                  rows={3}
                  required
                  defaultValue={
                    branch.address
                  }
                />
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Phone}
              eyebrow="Atención al cliente"
              title="Datos de contacto"
              description="Información visible para los visitantes y utilizada en formularios."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <FormInput
                label="Teléfono"
                name="phone"
                defaultValue={
                  branch.phone ?? ""
                }
                placeholder="81 1099 4545"
              />

              <FormInput
                label="WhatsApp"
                name="whatsapp"
                defaultValue={
                  branch.whatsapp ?? ""
                }
                placeholder="81 1099 4545"
              />

              <div className="md:col-span-2">
                <FormInput
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  defaultValue={
                    branch.email ?? ""
                  }
                  placeholder="contacto@gruporise.com"
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Horario"
                  name="schedule"
                  defaultValue={
                    branch.schedule ?? ""
                  }
                  placeholder="Lunes a viernes de 9:00 a 19:00"
                />
              </div>
            </div>
          </section>

          {/* Ubicación y servicios */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={MapPin}
              eyebrow="Información pública"
              title="Mapa y servicios"
              description="Configura la ubicación de Google Maps y los servicios ofrecidos."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormInput
                label="URL de Google Maps"
                name="googleMapsUrl"
                defaultValue={
                  branch.googleMapsUrl ??
                  ""
                }
                placeholder="https://maps.google.com/..."
                description="Cuando se deja vacío, se genera una búsqueda con la dirección."
              />

              <FormTextarea
                label="Servicios"
                name="services"
                rows={4}
                defaultValue={
                  branch.services ?? ""
                }
                placeholder="Ventas, Servicio, Refacciones, Motos..."
                description="Separa cada servicio utilizando comas."
              />

              {services.length > 0 && (
                <div className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Servicios actuales
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {services.map(
                      (service) => (
                        <span
                          key={service}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600"
                        >
                          <CheckCircle2
                            size={13}
                            className="text-emerald-600"
                          />

                          {service}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Imágenes */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={ImageIcon}
              eyebrow="Identidad visual"
              title="Imágenes de la sucursal"
              description="Administra el logotipo y la fotografía principal de la agencia."
            />

            <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
              <BranchImageField
                title="Logotipo"
                description="Utilizado en tarjetas y elementos de identidad."
                imageUrl={branch.logoUrl}
                imageAlt={`Logo ${branch.name}`}
                hiddenName="logoUrl"
                fileName="logoFile"
                imageClassName="h-44 object-contain p-6"
              />

              <BranchImageField
                title="Foto de fachada"
                description="Imagen horizontal de la agencia o instalaciones."
                imageUrl={
                  branch.coverImageUrl
                }
                imageAlt={`Fachada de ${branch.name}`}
                hiddenName="coverImageUrl"
                fileName="coverImageFile"
                imageClassName="h-44 object-cover"
              />
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            {/* Publicación */}
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Eye size={18} />
                  </span>

                  <div>
                    <h2 className="text-xl font-black">
                      Publicación
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Controla visibilidad y orden.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <FormInput
                  label="Orden"
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={
                    branch.sortOrder
                  }
                  description="Las sucursales con números menores aparecen primero."
                />

                <ToggleOption
                  name="active"
                  title="Sucursal activa"
                  description="Aparecerá en el sitio público y podrá mostrar inventario."
                  icon={
                    branch.active
                      ? Eye
                      : EyeOff
                  }
                  defaultChecked={
                    branch.active
                  }
                />

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                >
                  <Save size={17} />
                  Guardar cambios
                </button>

                <Link
                  href="/admin/sucursales"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  Cancelar
                </Link>
              </div>
            </section>

            {/* Acciones */}
            <section className="rounded-[22px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
              <p className="text-sm font-black text-[#192a3a]">
                Acciones rápidas
              </p>

              <div className="mt-4 grid gap-3">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#192a3a] transition hover:bg-[#f8fafb] active:scale-[0.98]"
                >
                  <MapPin size={15} />
                  Abrir mapa
                </a>

                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                  >
                    <MessageCircle
                      size={15}
                    />
                    Probar WhatsApp
                  </a>
                )}

                {branch.phone && (
                  <a
                    href={`tel:${cleanPhone(
                      branch.phone
                    )}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#192a3a] transition hover:bg-[#f8fafb] active:scale-[0.98]"
                  >
                    <Phone size={15} />
                    Probar teléfono
                  </a>
                )}

                {branch.email && (
                  <a
                    href={`mailto:${branch.email}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#192a3a] transition hover:bg-[#f8fafb] active:scale-[0.98]"
                  >
                    <Mail size={15} />
                    Probar correo
                  </a>
                )}
              </div>

              <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
                Una sucursal inactiva se oculta
                públicamente y puede afectar la
                visibilidad de sus vehículos.
              </p>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]">
        <Icon size={20} />
      </span>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-[#192a3a]">
        {value}
      </p>
    </article>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
          <Icon size={20} />
        </span>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  type = "text",
  required = false,
  min,
  placeholder,
  defaultValue,
  description,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  placeholder?: string;
  defaultValue?: string | number;
  description?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function FormTextarea({
  label,
  name,
  rows,
  required = false,
  defaultValue,
  placeholder,
  description,
}: {
  label: string;
  name: string;
  rows: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

function BranchImageField({
  title,
  description,
  imageUrl,
  imageAlt,
  hiddenName,
  fileName,
  imageClassName,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  imageAlt: string;
  hiddenName: string;
  fileName: string;
  imageClassName: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>

      <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200 bg-[#f8fafb]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className={`w-full ${imageClassName}`}
          />
        ) : (
          <div className="grid h-44 place-items-center text-slate-400">
            <div className="text-center">
              <ImageIcon
                size={36}
                className="mx-auto"
              />

              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em]">
                Sin imagen
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        type="hidden"
        name={hiddenName}
        defaultValue={imageUrl ?? ""}
      />

      <label className="mt-4 block">
        <span className="mb-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>

        <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
          <Upload
            size={23}
            className="mx-auto text-[#192a3a]"
          />

          <input
            name={fileName}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-4 block w-full text-xs font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#192a3a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#29465c]"
          />
        </div>

        <span className="mt-2 block text-xs leading-5 text-slate-500">
          JPG, PNG, WEBP o AVIF. Máximo 6 MB.
        </span>
      </label>
    </div>
  );
}

function ToggleOption({
  name,
  title,
  description,
  icon: Icon,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition hover:border-[#192a3a]/30">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
      />

      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-[#192a3a]"
      />

      <span>
        <span className="block text-sm font-black text-slate-700">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}