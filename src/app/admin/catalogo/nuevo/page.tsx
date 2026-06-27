import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { saveVehicleMediaFiles } from "@/lib/uploads";
import { BrandCategorySelects } from "@/components/admin/catalog/BrandCategorySelects";

export const dynamic = "force-dynamic";

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

async function createCatalogModel(formData: FormData) {
    "use server";

    const brandId = Number(formData.get("brandId"));
    const categoryId = Number(formData.get("categoryId"));
    const name = String(formData.get("name") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();
    const year = Number(formData.get("year"));
    const priceFromInput = String(formData.get("priceFrom") ?? "").trim();
    const subtitle = String(formData.get("subtitle") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const specs = String(formData.get("specs") ?? "").trim();
    const features = String(formData.get("features") ?? "").trim();
    const categoryType = String(formData.get("categoryType") ?? "TODOTERRENO");
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const active = formData.get("active") === "on";

    if (!brandId || !name) {
        throw new Error("Marca y nombre son obligatorios.");
    }

    const slug = slugInput ? slugify(slugInput) : slugify(name);

    const mediaFiles = formData
        .getAll("mediaFiles")
        .filter((value): value is File => value instanceof File && value.size > 0);

    const savedMedia = await saveVehicleMediaFiles(mediaFiles);
    const firstImage = savedMedia.find((item) => item.type === "IMAGE");

    await prisma.catalogModel.create({
        data: {
            brandId,
            categoryId: categoryId || null,
            name,
            slug,
            categoryType:
                categoryType === "AUTO" ||
                    categoryType === "MOTO" ||
                    categoryType === "TODOTERRENO"
                    ? categoryType
                    : "TODOTERRENO",
            year: Number.isNaN(year) ? null : year,
            priceFrom: priceFromInput ? Number(priceFromInput) : null,
            subtitle: subtitle || null,
            description,
            specs,
            features,
            mainImage: firstImage?.url ?? null,
            active,
            sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
            images:
                savedMedia.length > 0
                    ? {
                        create: savedMedia.map((item, index) => ({
                            url: item.url,
                            type: item.type,
                            alt: name,
                            order: index,
                        })),
                    }
                    : undefined,
        },
    });

    redirect("/admin/catalogo");
}

export default async function NewCatalogModelPage() {
    const [brands, categories] = await Promise.all([
        prisma.brand.findMany({
            orderBy: {
                name: "asc",
            },
        }),
        prisma.catalogCategory.findMany({
            where: {
                active: true,
                parentId: null,
            },
            include: {
                brand: true,
            },
            orderBy: [
                {
                    brand: {
                        name: "asc",
                    },
                },
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
        <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
            <Header />

            <section className="py-10">
                <Container>
                    <Link
                        href="/admin/catalogo"
                        className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
                    >
                        <ArrowLeft size={17} />
                        Volver al catálogo
                    </Link>

                    <div className="mt-6">
                        <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                            Catálogo
                        </p>

                        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                            Nuevo modelo
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                            Agrega un modelo nuevo por marca y categoría para mostrarlo en el
                            catálogo público.
                        </p>
                    </div>

                    <form
                        action={createCatalogModel}
                        className="mt-8 grid gap-6 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8"
                    >
                        <section className="grid gap-5 md:grid-cols-2">
                            <BrandCategorySelects
                                brands={brands}
                                categories={categories.map((category) => ({
                                    id: category.id,
                                    brandId: category.brandId,
                                    name: category.name,
                                    parentId: category.parentId,
                                }))}
                            />

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Nombre del modelo
                                </span>

                                <input
                                    name="name"
                                    required
                                    placeholder="Ej. Maverick R"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Slug
                                </span>

                                <input
                                    name="slug"
                                    placeholder="Ej. maverick-r"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Tipo general
                                </span>

                                <select
                                    name="categoryType"
                                    defaultValue="TODOTERRENO"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                >
                                    <option value="AUTO">Auto</option>
                                    <option value="MOTO">Moto</option>
                                    <option value="TODOTERRENO">Todo terreno</option>
                                </select>
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Año
                                </span>

                                <input
                                    name="year"
                                    type="number"
                                    placeholder="2026"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Precio desde
                                </span>

                                <input
                                    name="priceFrom"
                                    type="number"
                                    placeholder="899900"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Orden
                                </span>

                                <input
                                    name="sortOrder"
                                    type="number"
                                    defaultValue={0}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>
                        </section>

                        <label>
                            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Subtítulo
                            </span>

                            <input
                                name="subtitle"
                                placeholder="Descripción corta para cards"
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                            />
                        </label>

                        <label>
                            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Descripción
                            </span>

                            <textarea
                                name="description"
                                rows={5}
                                placeholder="Descripción comercial del modelo..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                            />
                        </label>

                        <section className="grid gap-5 md:grid-cols-2">
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Características
                                </span>

                                <textarea
                                    name="features"
                                    rows={5}
                                    placeholder="Separadas por coma. Ej: Motor Rotax, Suspensión FOX, Modos de manejo"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Especificaciones
                                </span>

                                <textarea
                                    name="specs"
                                    rows={5}
                                    placeholder="Separadas por coma. Ej: 999 cc, 2 pasajeros, transmisión automática"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>
                        </section>

                        <label>
                            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                Imágenes / videos
                            </span>

                            <input
                                name="mediaFiles"
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500"
                            />
                        </label>

                        <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                            <input
                                name="active"
                                type="checkbox"
                                defaultChecked
                                className="h-5 w-5 rounded border-slate-300"
                            />

                            <span className="text-sm font-black text-slate-600">
                                Mostrar modelo en catálogo público
                            </span>
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                            >
                                <Save size={18} />
                                Guardar modelo
                            </button>

                            <Link
                                href="/admin/catalogo"
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </Container>
            </section>

            <Footer />
        </main>
    );
}