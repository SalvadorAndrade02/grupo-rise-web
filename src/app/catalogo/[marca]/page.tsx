import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  ImageIcon,
  Layers3,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type CatalogBrandPageProps = {
  params: Promise<{
    marca: string;
  }>;
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    anio?: string;
  }>;
};

const brandSlugMap: Record<string, string> = {
  "can-am": "Can-Am",
  polaris: "Polaris",
  "royal-enfield": "Royal Enfield",
  "sea-doo": "Sea-Doo",
  "triumph-motorcycles": "Triumph",
  "indian-motorcycle": "Indian",
  zeekrlife: "Zeekr",
  "lynk-co": "Lynk & Co",
};

function getBrandNameFromSlug(slug: string) {
  return brandSlugMap[slug] ?? null;
}

function splitList(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[value] ?? value;
}

export default async function CatalogBrandPage({
  params,
  searchParams,
}: CatalogBrandPageProps) {
  const { marca } = await params;

  const filters = await searchParams;

  const search = filters.q?.trim().toLowerCase() ?? "";
  const selectedCategorySlug = filters.categoria ?? "TODAS";
  const selectedYear = filters.anio && filters.anio !== "TODOS" ? Number(filters.anio) : 0;

  const brandName = getBrandNameFromSlug(marca);

  if (!brandName) {
    notFound();
  }

  const brand = await prisma.brand.findFirst({
    where: {
      name: brandName,
    },
    include: {
      catalogCategories: {
        where: {
          active: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
        include: {
          children: {
            where: {
              active: true,
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                name: "asc",
              },
            ],
            include: {
              models: {
                where: {
                  active: true,
                },
                orderBy: [
                  {
                    sortOrder: "asc",
                  },
                  {
                    name: "asc",
                  },
                ],
                include: {
                  images: {
                    orderBy: {
                      order: "asc",
                    },
                  },
                },
              },
            },
          },
          models: {
            where: {
              active: true,
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                name: "asc",
              },
            ],
            include: {
              images: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      },
      catalogModels: {
        where: {
          active: true,
        },
      },
    },
  });

  if (!brand) {
    notFound();
  }

  const allCategories = brand.catalogCategories;

  const selectedCategory =
    selectedCategorySlug !== "TODAS"
      ? allCategories.find((category) => category.slug === selectedCategorySlug)
      : null;

  const selectedCategoryIds = selectedCategory
    ? selectedCategory.parentId
      ? [selectedCategory.id]
      : [
        selectedCategory.id,
        ...selectedCategory.children.map((child) => child.id),
      ]
    : null;

  const availableYears = Array.from(
    new Set(
      brand.catalogModels
        .map((model) => model.year)
        .filter((year): year is number => Boolean(year))
    )
  ).sort((a, b) => b - a);

  const hasActiveFilters =
    Boolean(search) || selectedCategorySlug !== "TODAS" || Boolean(selectedYear);

  function matchesFilters(model: {
    name: string;
    subtitle: string | null;
    description: string;
    features: string;
    specs: string;
    year: number | null;
    categoryId: number | null;
  }) {
    const text = [
      model.name,
      model.subtitle,
      model.description,
      model.features,
      model.specs,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = search ? text.includes(search) : true;

    const matchesCategory = selectedCategoryIds
      ? model.categoryId
        ? selectedCategoryIds.includes(model.categoryId)
        : false
      : true;

    const matchesYear = selectedYear ? model.year === selectedYear : true;

    return matchesSearch && matchesCategory && matchesYear;
  }

  const parentCategories = brand.catalogCategories.filter(
    (category) => !category.parentId
  );

  const totalModels = brand.catalogModels.length;

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.94))]" />

        <Container>
          <div className="relative z-10 py-12 md:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-black text-white/70 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Volver al inicio
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
                  <BadgeCheck size={16} />
                  Catálogo de modelos nuevos
                </span>

                <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">
                  {brand.name}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
                  Explora los modelos nuevos disponibles por categoría. Elige el
                  modelo de tu interés y solicita información con un asesor.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
                  Modelos activos
                </p>

                <p className="mt-2 text-5xl font-black">{totalModels}</p>

                <p className="mt-3 text-sm leading-6 text-white/60">
                  Administrables desde el catálogo interno de Grupo Rise.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container>
          <section className="mb-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-black text-[var(--rise-navy)]">
                  <SlidersHorizontal size={20} />
                  Filtrar catálogo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Busca modelos por nombre, categoría o año.
                </p>
              </div>

              <Link
                href={`/catalogo/${marca}`}
                className="rounded-xl border border-[var(--rise-border)] px-4 py-2 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-50"
              >
                Limpiar filtros
              </Link>
            </div>

            <form
              action={`/catalogo/${marca}`}
              className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto]"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Buscar modelo
                </span>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    name="q"
                    defaultValue={filters.q ?? ""}
                    placeholder="Ej. Defender, Maverick..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Categoría
                </span>

                <select
                  name="categoria"
                  defaultValue={selectedCategorySlug}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODAS">Todas</option>

                  {parentCategories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}

                  {parentCategories.flatMap((category) =>
                    category.children.map((child) => (
                      <option key={child.id} value={child.slug}>
                        {category.name} / {child.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <select
                  name="anio"
                  defaultValue={filters.anio ?? "TODOS"}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todos</option>

                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--rise-navy)] px-6 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] xl:self-end"
              >
                Filtrar
              </button>
            </form>
          </section>
          {parentCategories.length > 0 ? (
            <div className="space-y-10">
              {parentCategories.map((category) => {
                const categoryModels = [
                  ...category.models.filter(matchesFilters),
                  ...category.children.flatMap((child) => child.models.filter(matchesFilters)),
                ];

                const hasModels = categoryModels.length > 0;

                if (!hasModels && hasActiveFilters) {
                  return null;
                }

                if (!hasModels) {
                  return (
                    <section
                      key={category.id}
                      className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                        <Layers3 size={28} />
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        {category.name}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Esta categoría todavía no tiene modelos activos.
                      </p>
                    </section>
                  );
                }

                return (
                  <section
                    key={category.id}
                    className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8"
                  >
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                          Categoría
                        </p>

                        <h2 className="mt-3 text-3xl font-black md:text-4xl">
                          {category.name}
                        </h2>
                      </div>

                      <span className="rounded-full bg-[var(--rise-blue-soft)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--rise-blue)]">
                        {categoryModels.length} modelo(s)
                      </span>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {categoryModels.map((model) => (
                        <CatalogModelCard
                          key={model.id}
                          brandSlug={marca}
                          brandName={brand.name}
                          model={model}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
              {hasActiveFilters &&
                parentCategories.every((category) => {
                  const categoryModels = [
                    ...category.models.filter(matchesFilters),
                    ...category.children.flatMap((child) => child.models.filter(matchesFilters)),
                  ];

                  return categoryModels.length === 0;
                }) && (
                  <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <Search size={32} />
                    </div>

                    <h2 className="mt-5 text-2xl font-black">
                      No encontramos modelos con esos filtros.
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Intenta buscar otro modelo o limpia los filtros.
                    </p>

                    <Link
                      href={`/catalogo/${marca}`}
                      className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                    >
                      Limpiar filtros
                    </Link>
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <Car size={32} />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Aún no hay categorías para esta marca.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Cuando el admin agregue categorías y modelos, aparecerán aquí.
              </p>
            </div>
          )}
        </Container>
      </section>

      <Footer />
    </main>
  );
}

type CatalogModelCardProps = {
  brandSlug: string;
  brandName: string;
  model: {
    id: number;
    name: string;
    slug: string;
    year: number | null;
    priceFrom: number | null;
    subtitle: string | null;
    description: string;
    specs: string;
    features: string;
    mainImage: string | null;
    categoryType: string;
    images: {
      id: number;
      url: string;
      alt: string | null;
      order: number;
    }[];
  };
};

function CatalogModelCard({
  brandSlug,
  brandName,
  model,
}: CatalogModelCardProps) {
  const image = model.images[0]?.url || model.mainImage || "";
  const features = splitList(model.features).slice(0, 3);

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10">
      <Link href={`/catalogo/${brandSlug}/${model.slug}`}>
        <div className="relative h-52 overflow-hidden bg-slate-200">
          {image ? (
            <img
              src={image}
              alt={`${brandName} ${model.name}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">
              <div className="text-center">
                <ImageIcon className="mx-auto" size={42} />
                <p className="mt-2 text-xs font-black uppercase tracking-wider">
                  Sin imagen
                </p>
              </div>
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[var(--rise-navy)]">
            {getCategoryLabel(model.categoryType)}
          </div>
        </div>
      </Link>

      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
          {brandName}
        </p>

        <h3 className="mt-2 text-xl font-black text-[var(--rise-navy)]">
          {model.name}
        </h3>

        <p className="mt-1 text-sm font-bold text-slate-500">
          Modelo {model.year ?? "por definir"}
        </p>

        {model.subtitle && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {model.subtitle}
          </p>
        )}

        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <Tag size={15} />
            Precio desde
          </p>

          <p className="mt-1 text-xl font-black text-[var(--rise-blue)]">
            {model.priceFrom ? formatCurrency(model.priceFrom) : "Consultar"}
          </p>
        </div>

        {features.length > 0 && (
          <div className="mt-4 grid gap-2">
            {features.map((feature) => (
              <p
                key={feature}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"
              >
                <CheckCircle2
                  size={16}
                  className="shrink-0 text-emerald-600"
                />
                {feature}
              </p>
            ))}
          </div>
        )}

        <Link
          href={`/catalogo/${brandSlug}/${model.slug}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          Ver modelo
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}