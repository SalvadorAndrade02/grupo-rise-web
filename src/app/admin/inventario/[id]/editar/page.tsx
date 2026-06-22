import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ImageIcon,
  MapPin,
  Save,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditVehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DbVehicleCategory = "AUTO" | "MOTO" | "TODOTERRENO";
type DbVehicleCondition = "NUEVO" | "SEMINUEVO";
type DbVehicleStatus =
  | "DISPONIBLE"
  | "APARTADO"
  | "VENDIDO"
  | "EN_TRANSITO"
  | "PROXIMAMENTE"
  | "INACTIVO";

async function updateVehicle(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const category = formData.get("category") as DbVehicleCategory;
  const condition = formData.get("condition") as DbVehicleCondition;
  const status = formData.get("status") as DbVehicleStatus;

  const brandId = Number(formData.get("brandId"));
  const branchId = Number(formData.get("branchId"));

  const name = String(formData.get("name") ?? "");
  const model = String(formData.get("model") ?? "");
  const version = String(formData.get("version") ?? "");
  const year = Number(formData.get("year"));
  const price = Number(formData.get("price"));
  const type = String(formData.get("type") ?? "");
  const color = String(formData.get("color") ?? "");

  const mileageValue = formData.get("mileage");
  const mileage =
    mileageValue && String(mileageValue).trim() !== ""
      ? Number(mileageValue)
      : null;

  const specs = String(formData.get("specs") ?? "");
  const features = String(formData.get("features") ?? "");
  const description = String(formData.get("description") ?? "");
  const mainImage = String(formData.get("mainImage") ?? "");
  const isFeatured = formData.get("isFeatured") === "on";
  const active = formData.get("active") === "on";

  if (!id || !brandId || !branchId || !name || !model || !year || !price || !type) {
    throw new Error("Faltan campos obligatorios para actualizar el vehículo.");
  }

  await prisma.vehicle.update({
    where: {
      id,
    },
    data: {
      category,
      condition,
      status,
      brandId,
      branchId,
      name,
      model,
      version: version || null,
      year,
      price,
      type,
      color: color || null,
      mileage,
      specs,
      features,
      description,
      mainImage: mainImage || null,
      isFeatured,
      active,
    },
  });

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

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params;

  const [vehicle, brands, branches] = await Promise.all([
    prisma.vehicle.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        brand: true,
        branch: true,
      },
    }),
    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.branch.findMany({
      where: {
        active: true,
      },
      orderBy: {
        city: "asc",
      },
    }),
  ]);

  if (!vehicle) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container className="py-6">
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>
        </Container>
      </section>

      <section className="bg-[var(--rise-navy)] py-12 text-white">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Administración
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Editar vehículo
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Actualiza la información de la unidad registrada en el inventario.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <form
            action={updateVehicle}
            className="grid gap-8 lg:grid-cols-[1fr_360px]"
          >
            <input type="hidden" name="id" value={vehicle.id} />

            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <Car size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      Información principal
                    </h2>
                    <p className="text-sm text-slate-500">
                      Datos generales del auto, moto o todo terreno.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Categoría
                    </span>
                    <select
                      name="category"
                      required
                      defaultValue={vehicle.category}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      <option value="AUTO">Auto</option>
                      <option value="MOTO">Moto</option>
                      <option value="TODOTERRENO">Todo terreno</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Marca
                    </span>
                    <select
                      name="brandId"
                      required
                      defaultValue={vehicle.brandId}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name} · {formatCategory(brand.category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Nombre comercial
                    </span>
                    <input
                      name="name"
                      required
                      defaultValue={vehicle.name}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Modelo
                    </span>
                    <input
                      name="model"
                      required
                      defaultValue={vehicle.model}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Versión
                    </span>
                    <input
                      name="version"
                      defaultValue={vehicle.version ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Año
                    </span>
                    <input
                      name="year"
                      required
                      type="number"
                      defaultValue={vehicle.year}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Precio
                    </span>
                    <input
                      name="price"
                      required
                      type="number"
                      defaultValue={vehicle.price}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Características</h2>
                    <p className="text-sm text-slate-500">
                      Datos visibles en la ficha del vehículo.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Tipo / Clasificación
                    </span>
                    <input
                      name="type"
                      required
                      defaultValue={vehicle.type}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Color
                    </span>
                    <input
                      name="color"
                      defaultValue={vehicle.color ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Kilometraje
                    </span>
                    <input
                      name="mileage"
                      type="number"
                      defaultValue={vehicle.mileage ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Sucursal
                    </span>
                    <select
                      name="branchId"
                      required
                      defaultValue={vehicle.branchId}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} · {branch.city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Condición
                    </span>
                    <select
                      name="condition"
                      required
                      defaultValue={vehicle.condition}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    >
                      <option value="NUEVO">Nuevo</option>
                      <option value="SEMINUEVO">Seminuevo</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Estado
                    </span>
                    <select
                      name="status"
                      required
                      defaultValue={vehicle.status}
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

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Especificaciones rápidas
                    </span>
                    <input
                      name="specs"
                      defaultValue={vehicle.specs}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Sepáralas por coma. Ejemplo: 689 cc, ABS, 2 cilindros.
                    </p>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Características principales
                    </span>
                    <textarea
                      name="features"
                      rows={4}
                      defaultValue={vehicle.features}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Descripción
                    </span>
                    <textarea
                      name="description"
                      rows={5}
                      defaultValue={vehicle.description}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <ImageIcon size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Imagen</h2>
                    <p className="text-sm text-slate-500">
                      Imagen principal usada en el catálogo y detalle.
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    URL de imagen principal
                  </span>
                  <input
                    name="mainImage"
                    defaultValue={vehicle.mainImage ?? ""}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </label>

                {vehicle.mainImage && (
                  <img
                    src={vehicle.mainImage}
                    alt={vehicle.name}
                    className="mt-5 h-64 w-full rounded-3xl object-cover"
                  />
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-black">Publicación</h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Actualiza la unidad para reflejar cambios en el módulo
                  administrativo.
                </p>

                <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    defaultChecked={vehicle.isFeatured}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Mostrar como destacado
                  </span>
                </label>

                <label className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={vehicle.active}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Publicación activa
                  </span>
                </label>

                <button
                  type="submit"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  <Save size={18} />
                  Guardar cambios
                </button>

                <Link
                  href="/admin/inventario"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                >
                  Cancelar
                </Link>

                <div className="mt-6 rounded-2xl bg-[var(--rise-blue-soft)] p-4">
                  <div className="flex gap-3">
                    <MapPin
                      size={20}
                      className="shrink-0 text-[var(--rise-blue)]"
                    />
                    <p className="text-xs leading-5 text-slate-600">
                      Al desactivar la publicación, el vehículo puede seguir en
                      base de datos pero ocultarse del sitio público más
                      adelante.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </Container>
      </section>

      <Footer />
    </main>
  );
}