import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  Eye,
  ImageIcon,
  Info,
  MapPin,
  Phone,
  Save,
  Store,
  Upload,
} from "lucide-react";
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

type NewBranchPageProps = {
  searchParams: Promise<{
    error?: string;
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

function redirectBranchError(
  message: string
): never {
  redirect(
    `/admin/sucursales/nueva?error=${encodeURIComponent(
      message
    )}`
  );
}

function revalidateBranchPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/sucursales");
  revalidatePath(
    "/admin/sucursales/nueva"
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
      "No se pudo eliminar la imagen:",
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

async function createBranch(
  formData: FormData
) {
  "use server";

  await requireAdmin();

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
      "Nombre, ciudad, estado y dirección son obligatorios."
    );
  }

  if (sortOrder < 0) {
    redirectBranchError(
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
      "El correo electrónico no tiene un formato válido."
    );
  }

  if (
    !validateOptionalUrl(
      googleMapsUrl
    )
  ) {
    redirectBranchError(
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
      error instanceof Error
        ? error.message
        : "No se pudieron guardar las imágenes."
    );
  }

  try {
    await prisma.branch.create({
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
        logoUrl: uploadedLogoUrl,
        coverImageUrl:
          uploadedCoverImageUrl,
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
      "Error creando sucursal:",
      error
    );

    redirectBranchError(
      "No se pudo registrar la sucursal."
    );
  }

  revalidateBranchPaths();

  redirect(
    `/admin/sucursales?success=${encodeURIComponent(
      "Sucursal registrada correctamente."
    )}`
  );
}

export default async function NewBranchPage({
  searchParams,
}: NewBranchPageProps) {
  await requireAdmin();

  const query = await searchParams;

  return (
    <div className="pb-10">
      <AdminHero
        eyebrow="Nueva ubicación"
        title="Registrar sucursal"
        description="Agrega una agencia o punto de atención con su información de contacto, ubicación, servicios e imágenes."
        icon={Building2}
        backHref="/admin/sucursales"
        backLabel="Volver a sucursales"
      />

      {query.error && (
        <AdminAlert
          variant="error"
          className="mt-5"
        >
          {query.error}
        </AdminAlert>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          icon={Building2}
          label="Información"
          value="Datos comerciales"
        />

        <AdminSummaryCard
          icon={Phone}
          label="Contacto"
          value="Teléfono y correo"
        />

        <AdminSummaryCard
          icon={MapPin}
          label="Ubicación"
          value="Dirección y mapa"
        />

        <AdminSummaryCard
          icon={ImageIcon}
          label="Identidad"
          value="Logo y fachada"
        />
      </section>

      <form
        action={createBranch}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
      >
        <div className="space-y-6">
          <AdminSection
            icon={Building2}
            eyebrow="Información principal"
            title="Datos de la sucursal"
            description="Captura la identidad y dirección física de la nueva ubicación."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Nombre de la sucursal"
                name="name"
                required
                placeholder="Ej. Polaris Monterrey Cumbres"
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Ciudad"
                name="city"
                required
                placeholder="Monterrey"
              />

              <AdminInput
                label="Estado"
                name="state"
                required
                placeholder="Nuevo León"
              />

              <AdminTextarea
                label="Dirección"
                name="address"
                rows={3}
                required
                placeholder="Calle, número, colonia y código postal"
                containerClassName="md:col-span-2"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={Phone}
            eyebrow="Atención al cliente"
            title="Datos de contacto"
            description="Información que se mostrará a los clientes en el sitio público."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Teléfono"
                name="phone"
                placeholder="81 1099 4545"
              />

              <AdminInput
                label="WhatsApp"
                name="whatsapp"
                placeholder="81 1099 4545"
              />

              <AdminInput
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="contacto@gruporise.com"
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Horario"
                name="schedule"
                placeholder="Lunes a viernes de 9:00 a 19:00"
                containerClassName="md:col-span-2"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={MapPin}
            eyebrow="Información pública"
            title="Mapa y servicios"
            description="Configura la ubicación digital y los servicios disponibles."
          >
            <div className="grid gap-5">
              <AdminInput
                label="URL de Google Maps"
                name="googleMapsUrl"
                placeholder="https://maps.google.com/..."
                description="Puede ser un enlace normal o compartido de Google Maps."
              />

              <AdminTextarea
                label="Servicios"
                name="services"
                rows={4}
                placeholder="Ventas, Servicio, Refacciones, Motos, Todoterreno"
                description="Separa cada servicio utilizando comas."
              />

              <AdminAlert variant="info">
                Cuando no se registra una URL de
                Maps, el sitio puede generar una
                búsqueda utilizando la dirección
                capturada.
              </AdminAlert>
            </div>
          </AdminSection>

          <AdminSection
            icon={ImageIcon}
            eyebrow="Identidad visual"
            title="Imágenes de la sucursal"
            description="Carga el logotipo y una fotografía horizontal de la agencia."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <BranchUploadField
                title="Logotipo"
                description="Imagen de identidad utilizada en tarjetas y encabezados."
                name="logoFile"
                icon={Store}
              />

              <BranchUploadField
                title="Foto de fachada"
                description="Fotografía horizontal de la sucursal o sus instalaciones."
                name="coverImageFile"
                icon={ImageIcon}
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
                      Configura visibilidad y
                      posición en el sitio.
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
                  defaultValue={0}
                  description="Las sucursales con números menores aparecen primero."
                />

                <AdminToggleOption
                  name="active"
                  title="Sucursal activa"
                  description="Estará visible públicamente y podrá relacionarse con inventario."
                  icon={CheckCircle2}
                  defaultChecked
                />

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
                >
                  <Save size={17} />
                  Guardar sucursal
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
                Antes de guardar
              </p>

              <div className="mt-4 grid gap-3">
                <ChecklistItem text="Confirma que la dirección esté completa." />

                <ChecklistItem text="Usa un teléfono y WhatsApp con lada." />

                <ChecklistItem text="Carga una fachada horizontal y nítida." />

                <ChecklistItem text="Separa los servicios utilizando comas." />
              </div>

              <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
                La sucursal podrá editarse después
                para agregar o sustituir imágenes.
              </p>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}

function BranchUploadField({
  title,
  description,
  name,
  icon: Icon,
}: {
  title: string;
  description: string;
  name: string;
  icon: LucideIcon;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </span>

      <div className="mt-3 rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-5">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
          <Icon size={22} />
        </span>

        <p className="mt-3 text-center text-xs font-black text-slate-700">
          Selecciona una imagen
        </p>

        <p className="mt-1 text-center text-xs leading-5 text-slate-500">
          {description}
        </p>

        <div className="mt-4 flex justify-center">
          <Upload
            size={16}
            className="mr-2 mt-2 text-[#192a3a]"
          />

          <input
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="block min-w-0 text-xs font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#192a3a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#29465c]"
          />
        </div>
      </div>

      <span className="mt-2 block text-xs leading-5 text-slate-500">
        JPG, PNG, WEBP o AVIF. Máximo 6 MB.
      </span>
    </label>
  );
}

function ChecklistItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        size={15}
        className="mt-0.5 shrink-0 text-[#192a3a]"
      />

      <p className="text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}