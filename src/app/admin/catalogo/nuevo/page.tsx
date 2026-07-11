import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  ImageIcon,
  Info,
  Layers3,
  Save,
  Sparkles,
  Tags,
  Upload,
} from "lucide-react";
import {
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deletePublicFile,
  saveVehicleMediaFiles,
} from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

type NewCatalogModelPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const validCategories: VehicleCategory[] = [
  VehicleCategory.AUTO,
  VehicleCategory.MOTO,
  VehicleCategory.TODOTERRENO,
];

function getNumberValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function getOptionalNumberValue(
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

  return Number.isFinite(value)
    ? value
    : null;
}

function getTextValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getUniqueCatalogSlug(
  brandId: number,
  name: string
) {
  const baseSlug =
    slugify(name) || "modelo";

  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.catalogModel.findUnique({
      where: {
        brandId_slug: {
          brandId,
          slug,
        },
      },

      select: {
        id: true,
      },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function getVehicleCategoryValue(
  value: FormDataEntryValue | null
) {
  const categoryValue = String(
    value ||
    VehicleCategory.TODOTERRENO
  );

  return validCategories.includes(
    categoryValue as VehicleCategory
  )
    ? (categoryValue as VehicleCategory)
    : VehicleCategory.TODOTERRENO;
}

function redirectCatalogError(
  message: string
): never {
  redirect(
    `/admin/catalogo/nuevo?error=${encodeURIComponent(
      message
    )}`
  );
}

function revalidateCatalogPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/catalogo");
  revalidatePath(
    "/admin/catalogo/nuevo"
  );
  revalidatePath(
    "/admin/inventario/nuevo"
  );
  revalidatePath("/catalogo");
}

async function createCatalogModel(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const brandId = getNumberValue(
    formData,
    "brandId"
  );

  const categoryId = getNumberValue(
    formData,
    "categoryId"
  );

  const name = getTextValue(
    formData,
    "name"
  );

  const subtitle = getTextValue(
    formData,
    "subtitle"
  );

  const description = getTextValue(
    formData,
    "description"
  );

  const specs = getTextValue(
    formData,
    "specs"
  );

  const features = getTextValue(
    formData,
    "features"
  );

  const mainImageInput = getTextValue(
    formData,
    "mainImage"
  );

  const categoryType =
    getVehicleCategoryValue(
      formData.get("categoryType")
    );

  const year = getOptionalNumberValue(
    formData,
    "year"
  );

  const priceFrom =
    getOptionalNumberValue(
      formData,
      "priceFrom"
    );

  const sortOrder =
    getOptionalNumberValue(
      formData,
      "sortOrder"
    ) ?? 0;

  const active =
    formData.get("active") === "on";

  if (!brandId) {
    redirectCatalogError(
      "Selecciona una marca para el modelo."
    );
  }

  if (!name) {
    redirectCatalogError(
      "Captura el nombre del modelo."
    );
  }

  if (
    year !== null &&
    (!Number.isInteger(year) ||
      year < 1900 ||
      year > 2100)
  ) {
    redirectCatalogError(
      "El año del modelo no es válido."
    );
  }

  if (
    priceFrom !== null &&
    (!Number.isFinite(priceFrom) ||
      priceFrom < 0)
  ) {
    redirectCatalogError(
      "El precio base no es válido."
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectCatalogError(
      "El orden debe ser un número entero igual o mayor a cero."
    );
  }

  const [brand, category] =
    await Promise.all([
      prisma.brand.findUnique({
        where: {
          id: brandId,
        },

        select: {
          id: true,
          active: true,
        },
      }),

      categoryId
        ? prisma.catalogCategory.findUnique({
          where: {
            id: categoryId,
          },

          select: {
            id: true,
            brandId: true,
            active: true,
          },
        })
        : Promise.resolve(null),
    ]);

  if (!brand) {
    redirectCatalogError(
      "La marca seleccionada ya no existe."
    );
  }

  if (!brand.active) {
    redirectCatalogError(
      "La marca seleccionada está inactiva."
    );
  }

  if (categoryId && !category) {
    redirectCatalogError(
      "La categoría seleccionada ya no existe."
    );
  }

  if (
    category &&
    category.brandId !== brandId
  ) {
    redirectCatalogError(
      "La categoría seleccionada no pertenece a la marca."
    );
  }

  if (category && !category.active) {
    redirectCatalogError(
      "La categoría seleccionada está inactiva."
    );
  }

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter(
      (value): value is File =>
        value instanceof File &&
        value.size > 0
    );

  let savedMedia: Awaited<
    ReturnType<
      typeof saveVehicleMediaFiles
    >
  > = [];

  try {
    savedMedia =
      await saveVehicleMediaFiles(
        mediaFiles
      );
  } catch (error) {
    console.error(
      "Error guardando archivos del catálogo:",
      error
    );

    redirectCatalogError(
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del modelo."
    );
  }

  const firstImage = savedMedia.find(
    (item) =>
      item.type ===
      VehicleMediaType.IMAGE
  );

  const finalMainImage =
    firstImage?.url ||
    mainImageInput ||
    null;

  const slug =
    await getUniqueCatalogSlug(
      brandId,
      name
    );

  try {
    await prisma.catalogModel.create({
      data: {
        brandId,
        categoryId:
          categoryId || null,
        name,
        slug,
        categoryType,
        year,
        priceFrom,
        subtitle,
        description,
        specs,
        features,
        mainImage:
          finalMainImage,
        active,
        sortOrder,

        images:
          savedMedia.length > 0
            ? {
              create: savedMedia.map(
                (item, index) => ({
                  url: item.url,
                  type: item.type,
                  alt: name,
                  order: index,
                })
              ),
            }
            : undefined,
      },
    });
  } catch (error) {
    for (const item of savedMedia) {
      if (
        item.url.startsWith(
          "/uploads/"
        )
      ) {
        try {
          await deletePublicFile(
            item.url
          );
        } catch (cleanupError) {
          console.error(
            "No se pudo limpiar el archivo:",
            cleanupError
          );
        }
      }
    }

    console.error(
      "Error creando modelo de catálogo:",
      error
    );

    redirectCatalogError(
      "No se pudo guardar el modelo comercial."
    );
  }

  revalidateCatalogPaths();

  redirect(
    `/admin/catalogo?success=${encodeURIComponent(
      "Modelo comercial creado correctamente."
    )}`
  );
}

export default async function NewCatalogModelPage({
  searchParams,
}: NewCatalogModelPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const currentYear =
    new Date().getFullYear();

  const [
    brands,
    catalogCategories,
  ] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogCategory.findMany({
      where: {
        active: true,

        brand: {
          active: true,
        },
      },

      include: {
        parent: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative">
          <Link
            href="/admin/catalogo"
            className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver al catálogo
          </Link>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
            <Tags size={15} />
            Catálogo base
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
            Registrar modelo comercial
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-white/60 md:text-base">
            Crea una plantilla comercial con
            imágenes, precio, descripción y
            especificaciones para reutilizarla al
            registrar unidades reales.
          </p>
        </div>
      </section>

      {/* Mensaje de error */}
      {params.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>{params.error}</span>
        </div>
      )}

      {/* Advertencia sin marcas */}
      {brands.length === 0 && (
        <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">
            No hay marcas activas
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Debes registrar o activar una marca
            antes de crear un modelo comercial.
          </p>

          <Link
            href="/admin/marcas"
            className="mt-3 inline-flex text-xs font-black text-amber-800 underline"
          >
            Ir a marcas
          </Link>
        </div>
      )}

      <form
        action={createCatalogModel}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          {/* Relación comercial */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Sparkles}
              eyebrow="Clasificación"
              title="Marca y categoría"
              description="Selecciona la marca y la familia comercial a la que pertenece el modelo."
            />

            <div className="p-5 md:p-6">
              <BrandCategorySelects
                mode="catalog"
                brands={brands.map(
                  (brand) => ({
                    id: brand.id,
                    name: brand.name,
                    category:
                      brand.category,
                  })
                )}
                categories={catalogCategories.map(
                  (category) => ({
                    id: category.id,
                    brandId:
                      category.brandId,
                    name: category.name,
                    parentId:
                      category.parentId,

                    parentName:
                      category.parent
                        ?.name ?? null,
                  })
                )}
              />
            </div>
          </section>

          {/* Datos del modelo */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Layers3}
              eyebrow="Información comercial"
              title="Datos del modelo"
              description="Captura el nombre, año, precio base y orden del modelo."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <div className="md:col-span-2">
                <FormInput
                  label="Nombre del modelo"
                  name="name"
                  required
                  placeholder="Ej. Defender HD11"
                  description="Utiliza el nombre comercial que verá el administrador."
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Subtítulo comercial"
                  name="subtitle"
                  placeholder="Ej. Utilitario para trabajo y aventura"
                  description="Texto breve para resumir el propósito del modelo."
                />
              </div>

              <FormSelect
                label="Tipo comercial"
                name="categoryType"
                defaultValue={
                  VehicleCategory.TODOTERRENO
                }
              >
                <option
                  value={
                    VehicleCategory.TODOTERRENO
                  }
                >
                  Todoterreno
                </option>

                <option
                  value={VehicleCategory.MOTO}
                >
                  Moto
                </option>

                <option
                  value={VehicleCategory.AUTO}
                >
                  Auto
                </option>
              </FormSelect>

              <FormInput
                label="Año modelo"
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={currentYear}
                description="Puede modificarse posteriormente."
              />

              <FormInput
                label="Precio desde"
                name="priceFrom"
                type="number"
                min={0}
                placeholder="Ej. 539900"
                description="Precio comercial de referencia."
              />

              <FormInput
                label="Orden"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
                description="Los números menores aparecen primero."
              />
            </div>
          </section>

          {/* Ficha comercial */}
          <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              icon={Tags}
              eyebrow="Contenido"
              title="Ficha comercial"
              description="Agrega información reutilizable al crear unidades reales."
            />

            <div className="grid gap-5 p-5 md:p-6">
              <FormTextarea
                label="Descripción"
                name="description"
                rows={6}
                placeholder="Descripción comercial del modelo..."
              />

              <FormTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                placeholder="Ej. Motor HD11, 95 hp, tracción 4x4..."
                description="Puedes separar las especificaciones utilizando comas."
              />

              <FormTextarea
                label="Características principales"
                name="features"
                rows={5}
                placeholder="Ej. Cabina cómoda, suspensión reforzada, manejo todoterreno..."
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
                      Define si podrá utilizarse
                      como plantilla.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <ToggleOption
                  name="active"
                  title="Modelo activo"
                  description="Podrá seleccionarse al registrar unidades reales."
                  icon={CheckCircle2}
                  defaultChecked
                />

                <div className="rounded-[16px] border border-[#192a3a]/10 bg-[#e7edf1] p-4">
                  <Sparkles
                    size={20}
                    className="text-[#192a3a]"
                  />

                  <p className="mt-3 text-sm font-black text-[#192a3a]">
                    Flujo recomendado
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Primero crea el modelo base.
                    Después selecciónalo al registrar
                    una unidad real en inventario.
                  </p>
                </div>
              </div>
            </section>

            {/* Galería */}
            <section className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
                    <ImageIcon size={18} />
                  </span>

                  <div>
                    <h2 className="text-xl font-black">
                      Galería
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Imágenes y videos comerciales
                      del modelo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <FormInput
                  label="Imagen externa"
                  name="mainImage"
                  placeholder="https://..."
                  description="Opcional. Una imagen subida tendrá prioridad."
                />

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Archivos
                  </span>

                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
                    <Upload
                      size={24}
                      className="mx-auto text-[#192a3a]"
                    />

                    <p className="mt-3 text-center text-xs font-black text-slate-700">
                      Selecciona imágenes o videos
                    </p>

                    <input
                      name="mediaFiles"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                      className="mt-4 block w-full text-xs font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#192a3a] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#29465c]"
                    />
                  </div>

                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    JPG, PNG, WEBP, AVIF, MP4,
                    WEBM o MOV.
                  </span>
                </label>

                <div className="rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4">
                  <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
                    <Info
                      size={15}
                      className="mt-0.5 shrink-0 text-[#192a3a]"
                    />

                    La primera imagen subida se
                    utilizará como portada del
                    modelo.
                  </p>
                </div>
              </div>
            </section>

            {/* Guardar */}
            <section className="rounded-[22px] border border-[#192a3a]/10 bg-[#e7edf1] p-5">
              <button
                type="submit"
                disabled={brands.length === 0}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                Guardar modelo
              </button>

              <Link
                href="/admin/catalogo"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#192a3a]/15 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#f8fafb] active:scale-[0.98]"
              >
                Cancelar
              </Link>
            </section>
          </div>
        </aside>
      </form>
    </div>
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
  max,
  placeholder,
  defaultValue,
  description,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
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
        max={max}
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

function FormSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>
    </label>
  );
}

function FormTextarea({
  label,
  name,
  rows,
  placeholder,
  description,
}: {
  label: string;
  name: string;
  rows: number;
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

function ToggleOption({
  name,
  title,
  description,
  icon: Icon,
  defaultChecked = false,
}: {
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultChecked?: boolean;
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