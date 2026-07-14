import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
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
import {
  AdminAlert,
  AdminHero,
  AdminInput,
  AdminSection,
  AdminSummaryCard,
  AdminTextarea,
  AdminToggleOption,
} from "@/components/admin/ui";
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

function validateOptionalUrl(
  value: string | null
) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
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

  if (
    !validateOptionalUrl(
      googleMapsUrl
    )
  ) {
    redirectBranchError(
      branchId,
      "La URL de Google Maps no es válida."
    );
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
      <AdminHero
        eyebrow={`Sucursal #${branch.id}`}
        title={branch.name}
        description="Actualiza ubicación, contacto, imágenes, servicios y configuración pública de esta sucursal."
        icon={Building2}
        backHref="/admin/sucursales"
        backLabel="Volver a sucursales"
        actions={
          <>
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
          </>
        }
      />

      {query.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {query.error}
        </AdminAlert>
      )}

      {query.success && (
        <AdminAlert
          variant="success"
          className="mt-5"
        >
          {query.success}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
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
          tone={
            branch.active
              ? "emerald"
              : "red"
          }
        />

        <AdminSummaryCard
          icon={Tags}
          label="Vehículos nuevos"
          value={newVehicles}
          tone="blue"
        />

        <AdminSummaryCard
          icon={Store}
          label="Seminuevos"
          value={usedVehicles}
          tone="amber"
        />

        <AdminSummaryCard
          icon={Users}
          label="Solicitudes"
          value={branch._count.leads}
          tone="violet"
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
          <AdminSection
            icon={Building2}
            eyebrow="Información principal"
            title="Datos de la sucursal"
            description="Actualiza el nombre comercial, ciudad, estado y dirección."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Nombre de la sucursal"
                name="name"
                required
                defaultValue={branch.name}
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Ciudad"
                name="city"
                required
                defaultValue={branch.city}
              />

              <AdminInput
                label="Estado"
                name="state"
                required
                defaultValue={branch.state}
              />

              <AdminTextarea
                label="Dirección"
                name="address"
                rows={3}
                required
                defaultValue={
                  branch.address
                }
                containerClassName="md:col-span-2"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={Phone}
            eyebrow="Atención al cliente"
            title="Datos de contacto"
            description="Información visible para los visitantes y utilizada en formularios."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Teléfono"
                name="phone"
                defaultValue={
                  branch.phone ?? ""
                }
                placeholder="81 1099 4545"
              />

              <AdminInput
                label="WhatsApp"
                name="whatsapp"
                defaultValue={
                  branch.whatsapp ?? ""
                }
                placeholder="81 1099 4545"
              />

              <AdminInput
                label="Correo electrónico"
                name="email"
                type="email"
                defaultValue={
                  branch.email ?? ""
                }
                placeholder="contacto@gruporise.com"
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Horario"
                name="schedule"
                defaultValue={
                  branch.schedule ?? ""
                }
                placeholder="Lunes a viernes de 9:00 a 19:00"
                containerClassName="md:col-span-2"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={MapPin}
            eyebrow="Información pública"
            title="Mapa y servicios"
            description="Configura la ubicación de Google Maps y los servicios ofrecidos."
          >
            <div className="grid gap-5">
              <AdminInput
                label="URL de Google Maps"
                name="googleMapsUrl"
                defaultValue={
                  branch.googleMapsUrl ??
                  ""
                }
                placeholder="https://maps.google.com/..."
                description="Cuando se deja vacío, se genera una búsqueda utilizando la dirección."
              />

              <AdminTextarea
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
          </AdminSection>

          <AdminSection
            icon={ImageIcon}
            eyebrow="Identidad visual"
            title="Imágenes de la sucursal"
            description="Administra el logotipo y la fotografía principal de la agencia."
          >
            <div className="grid gap-6 md:grid-cols-2">
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
          </AdminSection>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
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
                <AdminInput
                  label="Orden"
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={
                    branch.sortOrder
                  }
                  description="Las sucursales con números menores aparecen primero."
                />

                <AdminToggleOption
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