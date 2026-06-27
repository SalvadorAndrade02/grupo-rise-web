import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  MapPin,
  Save,
} from "lucide-react";
import { VehicleCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saveVehicleMediaFiles } from "@/lib/uploads";
import { VehicleCondition, VehicleStatus } from "@prisma/client";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

function getNumberValue(formData: FormData, fieldName: string) {
  const value = Number(formData.get(fieldName));

  return Number.isFinite(value) ? value : 0;
}

async function createVehicle(formData: FormData) {
  "use server";

  const condition: VehicleCondition =
    formData.get("condition") === VehicleCondition.SEMINUEVO
      ? VehicleCondition.SEMINUEVO
      : VehicleCondition.NUEVO;

  const statusValue = String(
    formData.get("status") || VehicleStatus.DISPONIBLE
  );

  const validStatuses: VehicleStatus[] = [
    VehicleStatus.DISPONIBLE,
    VehicleStatus.APARTADO,
    VehicleStatus.VENDIDO,
    VehicleStatus.EN_TRANSITO,
    VehicleStatus.PROXIMAMENTE,
    VehicleStatus.INACTIVO,
  ];

  const status: VehicleStatus = validStatuses.includes(
    statusValue as VehicleStatus
  )
    ? (statusValue as VehicleStatus)
    : VehicleStatus.DISPONIBLE;

  const active = formData.get("active") === "on";
  const isFeatured = formData.get("isFeatured") === "on";

  const brandId = getNumberValue(formData, "brandId");
  const branchId = getNumberValue(formData, "branchId");

  const availabilityBranchIds = formData
    .getAll("branchIds")
    .map((value) => Number(value))
    .filter(Boolean);

  const uniqueBranchIds = Array.from(
    new Set([branchId, ...availabilityBranchIds].filter(Boolean))
  );

  const year = Number(formData.get("year"));
  const price = Number(formData.get("price"));

  const name = String(formData.get("name") || "").trim();
  const model = String(formData.get("model") || name).trim();

  const categoryValue = String(
    formData.get("category") || VehicleCategory.AUTO
  );

  const validCategories: VehicleCategory[] = [
    VehicleCategory.AUTO,
    VehicleCategory.MOTO,
    VehicleCategory.TODOTERRENO,
  ];

  const category: VehicleCategory = validCategories.includes(
    categoryValue as VehicleCategory
  )
    ? (categoryValue as VehicleCategory)
    : VehicleCategory.AUTO;

  const type = String(formData.get("type") || category || "General").trim();

  const mileageValue = formData.get("mileage");
  const mileage =
    mileageValue && String(mileageValue).trim() !== ""
      ? Number(mileageValue)
      : null;

  const specs = String(formData.get("specs") || "").trim();
  const features = String(formData.get("features") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const mainImageInput = String(formData.get("mainImage") || "").trim();

  if (!brandId || !branchId || !name || !model || !type) {
    throw new Error("Faltan campos obligatorios para crear el vehículo.");
  }

  if (!Number.isFinite(year) || year < 1900) {
    throw new Error("El año del vehículo no es válido.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("El precio del vehículo no es válido.");
  }

  if (mileage !== null && (!Number.isFinite(mileage) || mileage < 0)) {
    throw new Error("El kilometraje del vehículo no es válido.");
  }

  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let savedMedia: Awaited<ReturnType<typeof saveVehicleMediaFiles>> = [];

  try {
    savedMedia = await saveVehicleMediaFiles(mediaFiles);
  } catch (error) {
    console.error(error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los archivos del vehículo."
    );
  }

  const firstImage = savedMedia.find((item) => item.type === "IMAGE");
  const finalMainImage = firstImage?.url || mainImageInput || "";

  await prisma.vehicle.create({
    data: {
      name,
      model,
      type,
      brandId,
      branchId,
      category,
      condition,
      status,
      year,
      price,
      mileage,
      description,
      specs,
      features,
      mainImage: finalMainImage,
      active,
      isFeatured,

      images: savedMedia.length
        ? {
          create: savedMedia.map((item, index) => ({
            url: item.url,
            type: item.type,
            alt: name,
            order: index,
          })),
        }
        : undefined,

      branchAvailabilities: {
        create: uniqueBranchIds.map((branchId) => ({
          branchId,
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  revalidatePath("/inventario");

  redirect("/admin/inventario");
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category] ?? category;
}

export default async function NewVehiclePage() {
  const [brands, branches, catalogModels, catalogCategories] = await Promise.all([
    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.branch.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.catalogModel.findMany({
      where: {
        active: true,
        brand: {
          active: true,
        },
      },
      include: {
        category: true,
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
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            Inventario de unidades
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Registrar vehículo
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Registra una unidad nueva o seminueva. Si la unidad queda como nuevo,
            disponible y visible aparecerá en catálogo; si queda como seminuevo,
            disponible y visible aparecerá en inventario público.
          </p>
        </div>
      </div>

      <form
        action={createVehicle}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-6">
          <BrandCategorySelects
            mode="vehicle"
            brands={brands.map((brand) => ({
              id: brand.id,
              name: brand.name,
              category: brand.category,
            }))}
            categories={catalogCategories.map((category) => ({
              id: category.id,
              brandId: category.brandId,
              name: category.name,
              parentId: category.parentId,
              parentName: category.parent?.name ?? null,
            }))}
            catalogModels={catalogModels.map((model) => ({
              id: model.id,
              brandId: model.brandId,
              categoryId: model.categoryId,
              name: model.name,
              categoryType: model.categoryType,
              year: model.year,
              priceFrom: model.priceFrom,
              categoryName: model.category?.name ?? null,
            }))}
          />

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <Car size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Datos comerciales</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Completa la información principal con la que se mostrará la
                  unidad en el sitio.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Versión
                </span>

                <input
                  name="version"
                  placeholder="Ej. Premium, Sport, Limited"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Útil para diferenciar versiones del mismo modelo.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Color
                </span>

                <input
                  name="color"
                  placeholder="Ej. Negro, Rojo, Azul"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <input
                  name="year"
                  required
                  type="number"
                  defaultValue={2024}
                  min={1900}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Precio
                </span>

                <input
                  name="price"
                  required
                  type="number"
                  min={0}
                  placeholder="799000"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Kilometraje
                </span>

                <input
                  name="mileage"
                  type="number"
                  min={0}
                  placeholder="0"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Para vehículos nuevos puedes dejarlo en 0 o vacío.
                </p>
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <MapPin size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Sucursal y disponibilidad</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Selecciona la sucursal principal y, si aplica, otras sucursales
                  donde también esté disponible.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sucursal principal
                </span>

                <select
                  name="branchId"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="">Selecciona una sucursal</option>

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} · {branch.city}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Disponible también en
                </span>

                <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  {branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md hover:shadow-slate-900/5"
                    >
                      <input
                        type="checkbox"
                        name="branchIds"
                        value={branch.id}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <span>
                        <span className="block text-sm font-black text-[var(--rise-navy)]">
                          {branch.name}
                        </span>

                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {branch.city}, {branch.state}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  La sucursal principal se agregará automáticamente.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <CheckCircle2 size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">Ficha pública</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Información descriptiva que verá el visitante en el detalle del
                  vehículo.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Especificaciones rápidas
                </span>

                <input
                  name="specs"
                  placeholder="Ej. 689 cc, ABS, 2 cilindros"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Sepáralas por coma para mostrarlas como lista.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Características principales
                </span>

                <textarea
                  name="features"
                  rows={4}
                  placeholder="Ej. Cámara 360, pantalla central, ABS, control de tracción"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Descripción
                </span>

                <textarea
                  name="description"
                  rows={5}
                  placeholder="Descripción comercial del vehículo..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/5 md:p-6">
              <h2 className="text-2xl font-black">Publicación</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Controla dónde aparecerá esta unidad dentro del sitio público.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Condición
                  </span>

                  <select
                    name="condition"
                    defaultValue="NUEVO"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  >
                    <option value="NUEVO">Nuevo</option>
                    <option value="SEMINUEVO">Seminuevo</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Estado
                  </span>

                  <select
                    name="status"
                    defaultValue="DISPONIBLE"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="APARTADO">Apartado</option>
                    <option value="VENDIDO">Vendido</option>
                    <option value="EN_TRANSITO">En tránsito</option>
                    <option value="PROXIMAMENTE">Próximamente</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-700">
                      Visible en el sitio
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Si está oculto, no aparecerá públicamente.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-700">
                      Mostrar como destacado
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Se podrá usar en secciones principales del sitio.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-black">Galería</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sube fotos o videos reales de la unidad.
              </p>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Imagen principal externa
                </span>

                <input
                  name="mainImage"
                  placeholder="Opcional: URL de imagen"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Archivos
                </span>

                <input
                  name="mediaFiles"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--rise-navy)] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-[var(--rise-blue)] focus:border-[var(--rise-blue)] focus:bg-white"
                />

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Hasta 10 archivos. JPG, PNG, WEBP, AVIF, MP4, WEBM o MOV.
                </p>
              </label>
            </section>

            <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                <p className="text-sm font-black">Regla de publicación</p>

                <p className="mt-2 text-xs font-bold leading-5">
                  Nuevo + Disponible + Visible aparece en Catálogo.
                  Seminuevo + Disponible + Visible aparece en Inventario.
                </p>
              </div>

              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <Save size={18} />
                Guardar vehículo
              </button>

              <Link
                href="/admin/inventario"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
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