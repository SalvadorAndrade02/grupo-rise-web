import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  ImageIcon,
  Layers3,
  Save,
  Sparkles,
  Tags,
  Upload,
} from "lucide-react";
import {
  Currency,
  VehicleCategory,
  VehicleMediaType,
} from "@prisma/client";
import {
  AdminAlert,
  AdminHero,
  AdminInput,
  AdminSection,
  AdminSelect,
  AdminSummaryCard,
  AdminTextarea,
  AdminToggleOption,
} from "@/components/admin/ui";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deletePublicFile,
  saveVehicleMediaFiles,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";

type NewCatalogModelPageProps = {
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

function getPositiveIntegerValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isInteger(value) &&
    value > 0
    ? value
    : 0;
}

function getOptionalNumberValue(
  formData: FormData,
  fieldName: string
) {
  const rawValue = getTextValue(
    formData,
    fieldName
  );

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value)
    ? value
    : null;
}

function getSortOrderValue(
  formData: FormData
) {
  const rawValue = getTextValue(
    formData,
    "sortOrder"
  );

  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);

  return Number.isInteger(value)
    ? value
    : Number.NaN;
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

  const validCategories: VehicleCategory[] = [
    VehicleCategory.AUTO,
    VehicleCategory.MOTO,
    VehicleCategory.TODOTERRENO,
    VehicleCategory.NAUTICA,
  ];

  return validCategories.includes(
    categoryValue as VehicleCategory
  )
    ? (categoryValue as VehicleCategory)
    : VehicleCategory.TODOTERRENO;
}

function getCurrencyValue(
  value: FormDataEntryValue | null
) {
  const currencyValue = String(
    value || Currency.MXN
  );

  const validCurrencies: Currency[] = [
    Currency.MXN,
    Currency.USD,
  ];

  return validCurrencies.includes(
    currencyValue as Currency
  )
    ? (currencyValue as Currency)
    : Currency.MXN;
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
  revalidatePath("/inventario");
}

function isValidImageReference(
  value: string | null
) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/")) {
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

async function safelyDeleteMedia(
  media: {
    url: string;
  }[]
) {
  await Promise.allSettled(
    media.map(async (item) => {
      if (
        !item.url.startsWith("/uploads/")
      ) {
        return;
      }

      try {
        await deletePublicFile(item.url);
      } catch (error) {
        console.error(
          `No se pudo eliminar ${item.url}:`,
          error
        );
      }
    })
  );
}

async function createCatalogModel(
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const brandId =
    getPositiveIntegerValue(
      formData,
      "brandId"
    );

  const categoryId =
    getPositiveIntegerValue(
      formData,
      "categoryId"
    );

  const name = getTextValue(
    formData,
    "name"
  );

  const subtitle =
    getOptionalTextValue(
      formData,
      "subtitle"
    );

  const description =
    getOptionalTextValue(
      formData,
      "description"
    );

  const specs =
    getOptionalTextValue(
      formData,
      "specs"
    );

  const features =
    getOptionalTextValue(
      formData,
      "features"
    );

  const mainImageInput =
    getOptionalTextValue(
      formData,
      "mainImage"
    );

  const categoryType =
    getVehicleCategoryValue(
      formData.get("categoryType")
    );

  const year =
    getOptionalNumberValue(
      formData,
      "year"
    );

  const priceFrom =
    getOptionalNumberValue(
      formData,
      "priceFrom"
    );

  const currency =
    getCurrencyValue(
      formData.get("currency")
    );

  const sortOrder =
    getSortOrderValue(formData);

  const active =
    formData.get("active") === "on";

  if (!brandId || !name) {
    redirectCatalogError(
      "Selecciona una marca y captura el nombre del modelo."
    );
  }

  if (name.length < 2) {
    redirectCatalogError(
      "El nombre del modelo debe contener al menos dos caracteres."
    );
  }

  if (
    year !== null &&
    (!Number.isInteger(year) ||
      year < 1900 ||
      year >
      new Date().getFullYear() + 3)
  ) {
    redirectCatalogError(
      "El año del modelo no es válido."
    );
  }

  if (
    priceFrom !== null &&
    priceFrom < 0
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

  if (
    !isValidImageReference(
      mainImageInput
    )
  ) {
    redirectCatalogError(
      "La URL de la imagen principal no es válida."
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
          category: true,
          active: true,
        },
      }),

      categoryId
        ? prisma.catalogCategory.findUnique(
          {
            where: {
              id: categoryId,
            },

            select: {
              id: true,
              brandId: true,
              active: true,
            },
          }
        )
        : Promise.resolve(null),
    ]);

  if (!brand || !brand.active) {
    redirectCatalogError(
      "La marca seleccionada no existe o está inactiva."
    );
  }

  if (
    brand.category !== categoryType
  ) {
    redirectCatalogError(
      "El tipo del modelo no corresponde con la categoría de la marca."
    );
  }

  if (
    categoryId &&
    (!category ||
      !category.active ||
      category.brandId !== brandId)
  ) {
    redirectCatalogError(
      "La categoría seleccionada no corresponde con la marca."
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
      "Error guardando archivos:",
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
        categoryId: categoryId || null,
        name,
        slug,
        categoryType,
        year,
        priceFrom,
        currency,
        subtitle,
        description: description ?? undefined,
        specs: specs ?? undefined,
        features: features ?? undefined,
        mainImage: finalMainImage,
        active,
        sortOrder,

        images: savedMedia.length
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
    await safelyDeleteMedia(savedMedia);

    console.error(
      "Error creando modelo:",
      error
    );

    redirectCatalogError(
      "No se pudo registrar el modelo comercial."
    );
  }

  revalidateCatalogPaths();

  redirect(
    `/admin/catalogo?success=${encodeURIComponent(
      "Modelo registrado correctamente."
    )}`
  );
}

export default async function NewCatalogModelPage({
  searchParams,
}: NewCatalogModelPageProps) {
  await requireAdmin();

  const query = await searchParams;

  const [brands, catalogCategories] =
    await Promise.all([
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
      <AdminHero
        eyebrow="Catálogo base"
        title="Registrar modelo comercial"
        description="Crea una plantilla comercial por marca para utilizarla posteriormente al registrar unidades reales en inventario."
        icon={Layers3}
        backHref="/admin/catalogo"
        backLabel="Volver al catálogo base"
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
          icon={Layers3}
          label="Modelo base"
          value="Información comercial"
        />

        <AdminSummaryCard
          icon={Tags}
          label="Clasificación"
          value="Marca y categoría"
          tone="blue"
        />

        <AdminSummaryCard
          icon={ImageIcon}
          label="Multimedia"
          value="Imágenes y videos"
          tone="violet"
        />

        <AdminSummaryCard
          icon={Eye}
          label="Publicación"
          value="Visibilidad en inventario"
          tone="emerald"
        />
      </section>

      <form
        action={createCatalogModel}
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
      >
        <div className="space-y-6">
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

          <AdminSection
            icon={Layers3}
            eyebrow="Información principal"
            title="Datos del modelo"
            description="Información comercial que servirá como base al registrar unidades reales."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Nombre del modelo"
                name="name"
                required
                placeholder="Ej. Defender HD11, Maverick R..."
                containerClassName="md:col-span-2"
              />

              <AdminInput
                label="Subtítulo comercial"
                name="subtitle"
                placeholder="Ej. Side-by-side utilitario para trabajo y aventura"
                containerClassName="md:col-span-2"
              />

              <AdminSelect
                label="Tipo"
                name="categoryType"
                defaultValue={
                  VehicleCategory.TODOTERRENO
                }
              >
                <option
                  value={
                    VehicleCategory.AUTO
                  }
                >
                  Auto
                </option>

                <option
                  value={
                    VehicleCategory.MOTO
                  }
                >
                  Moto
                </option>

                <option
                  value={
                    VehicleCategory.TODOTERRENO
                  }
                >
                  Todo terreno
                </option>

                <option
                  value={VehicleCategory.NAUTICA}
                >
                  Náutica
                </option>
              </AdminSelect>

              <AdminInput
                label="Año modelo"
                name="year"
                type="number"
                min={1900}
                max={
                  new Date().getFullYear() +
                  3
                }
                placeholder={String(
                  new Date().getFullYear()
                )}
              />

              <AdminInput
                label="Precio desde"
                name="priceFrom"
                type="number"
                min={0}
                step="1"
                placeholder="539900"
              />

              <AdminSelect
                label="Moneda"
                name="currency"
                defaultValue={Currency.MXN}
              >
                <option value={Currency.MXN}>
                  MXN - Peso mexicano
                </option>

                <option value={Currency.USD}>
                  USD - Dólar estadounidense
                </option>
              </AdminSelect>

              <AdminInput
                label="Orden"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
                description="Los valores menores aparecen primero."
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={BookOpen}
            eyebrow="Contenido comercial"
            title="Ficha del modelo"
            description="Agrega la descripción, especificaciones y características principales."
          >
            <div className="grid gap-5">
              <AdminTextarea
                label="Descripción"
                name="description"
                rows={5}
                placeholder="Descripción comercial del modelo..."
              />

              <AdminTextarea
                label="Especificaciones rápidas"
                name="specs"
                rows={4}
                placeholder="Motor HD11, 95 hp, tracción 4x4..."
                description="Puedes separar cada especificación utilizando comas o saltos de línea."
              />

              <AdminTextarea
                label="Características principales"
                name="features"
                rows={5}
                placeholder="Cabina cómoda, suspensión reforzada..."
                description="Puedes separar cada característica utilizando comas o saltos de línea."
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
                      Controla la disponibilidad del modelo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <AdminToggleOption
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
                    Primero registra el modelo base.
                    Después crea las unidades reales
                    desde inventario.
                  </p>
                </div>
              </div>
            </section>

            <AdminSection
              icon={ImageIcon}
              eyebrow="Archivos"
              title="Galería"
              description="Carga imágenes o videos comerciales del modelo."
              contentClassName="p-5"
            >
              <div className="grid gap-5">
                <AdminInput
                  label="Imagen principal externa"
                  name="mainImage"
                  type="url"
                  placeholder="https://... o /ruta/imagen.webp"
                  description="Se utilizará cuando no se cargue una imagen local."
                />

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Archivos multimedia
                  </span>

                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-[#f8fafb] p-4">
                    <Upload
                      size={25}
                      className="mx-auto text-[#192a3a]"
                    />

                    <p className="mt-3 text-center text-xs font-black text-slate-700">
                      Imágenes y videos
                    </p>

                    <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                      Puedes seleccionar varios
                      archivos.
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
              </div>
            </AdminSection>

            <section className="rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98]"
              >
                <Save size={17} />
                Guardar modelo
              </button>

              <Link
                href="/admin/catalogo"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
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