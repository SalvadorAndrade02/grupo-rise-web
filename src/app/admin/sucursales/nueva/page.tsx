import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
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
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative">
          <Link
            href="/admin/sucursales"
            className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver a sucursales
          </Link>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
            <Building2 size={15} />
            Nueva ubicación
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
            Registrar sucursal
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-white/60 md:text-base">
            Agrega una agencia o punto de
            atención con su información de
            contacto, ubicación, servicios e
            imágenes.
          </p>
        </div>
      </section>

      {/* Error */}
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

      {/* Resumen del flujo */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Building2}
          label="Información"
          value="Datos comerciales"
        />

        <SummaryCard
          icon={Phone}
          label="Contacto"
          value="Teléfono y correo"
        />

        <SummaryCard
          icon={MapPin}
          label="Ubicación"
          value="Dirección y mapa"
        />

        <SummaryCard
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
          {/* Información principal */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Building2}
              eyebrow="Información principal"
              title="Datos de la sucursal"
              description="Captura la identidad y dirección física de la nueva ubicación."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <div className="md:col-span-2">
                <FormInput
                  label="Nombre de la sucursal"
                  name="name"
                  required
                  placeholder="Ej. Polaris Monterrey Cumbres"
                />
              </div>

              <FormInput
                label="Ciudad"
                name="city"
                required
                placeholder="Monterrey"
              />

              <FormInput
                label="Estado"
                name="state"
                required
                placeholder="Nuevo León"
              />

              <div className="md:col-span-2">
                <FormTextarea
                  label="Dirección"
                  name="address"
                  rows={3}
                  required
                  placeholder="Calle, número, colonia y código postal"
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
              description="Información que se mostrará a los clientes en el sitio público."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <FormInput
                label="Teléfono"
                name="phone"
                placeholder="81 1099 4545"
              />

              <FormInput
                label="WhatsApp"
                name="whatsapp"
                placeholder="81 1099 4545"
              />

              <div className="md:col-span-2">
                <FormInput
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  placeholder="contacto@gruporise.com"
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Horario"
                  name="schedule"
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
              description="Configura la ubicación digital y los servicios disponibles."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormInput
                label="URL de Google Maps"
                name="googleMapsUrl"
                placeholder="https://maps.google.com/..."
                description="Puede ser un enlace normal o compartido de Google Maps."
              />

              <FormTextarea
                label="Servicios"
                name="services"
                rows={4}
                placeholder="Ventas, Servicio, Refacciones, Motos, Todoterreno"
                description="Separa cada servicio utilizando comas."
              />

              <div className="flex items-start gap-3 rounded-[16px] border border-[#192a3a]/10 bg-[#e7edf1] p-4">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-[#192a3a]"
                />

                <p className="text-xs font-semibold leading-5 text-slate-600">
                  Cuando no se registra una URL de
                  Maps, el sitio puede generar una
                  búsqueda utilizando la dirección
                  capturada.
                </p>
              </div>
            </div>
          </section>

          {/* Imágenes */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={ImageIcon}
              eyebrow="Identidad visual"
              title="Imágenes de la sucursal"
              description="Carga el logotipo y una fotografía horizontal de la agencia."
            />

            <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
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
                      Configura visibilidad y
                      posición en el sitio.
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
                  defaultValue={0}
                  description="Las sucursales con números menores aparecen primero."
                />

                <ToggleOption
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

            {/* Ayuda */}
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

      <p className="mt-2 text-sm font-black text-[#192a3a]">
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
  placeholder,
  description,
}: {
  label: string;
  name: string;
  rows: number;
  required?: boolean;
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