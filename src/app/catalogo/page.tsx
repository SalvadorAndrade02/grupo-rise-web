import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ImageIcon,
  Layers3,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const brandSlugMap: Record<string, string> = {
  "Can-Am": "can-am",
  Polaris: "polaris",
  "Royal Enfield": "royal-enfield",
  "Sea-Doo": "sea-doo",
  "Sea Doo": "sea-doo",
  SeaDoo: "sea-doo",
  Triumph: "triumph-motorcycles",
  Indian: "indian-motorcycle",
  Zeekr: "zeekrlife",
  "Lynk & Co": "lynk-co",
};

function getBrandSlug(name: string) {
  return brandSlugMap[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

function getBrandCover(name: string) {
  const slug = getBrandSlug(name);

  const covers: Record<string, string> = {
    "can-am": "/catalog/brands/can-am.jpg",
    polaris: "/catalog/brands/polaris.jpg",
    "royal-enfield": "/catalog/brands/royal-enfield.jpg",
    "sea-doo": "/catalog/brands/sea-doo.jpg",
    "triumph-motorcycles": "/catalog/brands/triumph.jpg",
    "indian-motorcycle": "/catalog/brands/indian.jpg",
    zeekrlife: "/catalog/brands/zeekr.jpg",
    "lynk-co": "/catalog/brands/lynkco.jpg",
  };

  return covers[slug] ?? "";
}

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[value] ?? value;
}

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    tipo?: string;
    anio?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const search = params.q?.trim().toLowerCase() ?? "";
  const selectedBrand = params.marca ?? "TODAS";
  const selectedType = params.tipo ?? "TODOS";
  const selectedYear =
    params.anio && params.anio !== "TODOS" ? Number(params.anio) : 0;
  const brands = await prisma.brand.findMany({
    include: {
      catalogModels: {
        where: {
          active: true,
        },
        include: {
          images: {
            where: {
              type: "IMAGE",
            },
            orderBy: {
              order: "asc",
            },
            take: 1,
          },
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
      },
      catalogCategories: {
        where: {
          active: true,
          parentId: null,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const visibleBrands = brands.filter((brand) => brandSlugMap[brand.name]);

  const allCatalogModels = visibleBrands.flatMap((brand) =>
    brand.catalogModels.map((model) => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      year: model.year,
      priceFrom: model.priceFrom,
      categoryType: model.categoryType,
      subtitle: model.subtitle,
      description: model.description,
      features: model.features,
      specs: model.specs,
      mainImage: model.mainImage,
      images: model.images,
      category: model.category,
      brandName: brand.name,
      brandSlug: getBrandSlug(brand.name),
    }))
  );

  const availableYears = Array.from(
    new Set(
      allCatalogModels
        .map((model) => model.year)
        .filter((year): year is number => Boolean(year))
    )
  ).sort((a, b) => b - a);

  const hasActiveSearch =
    Boolean(search) ||
    selectedBrand !== "TODAS" ||
    selectedType !== "TODOS" ||
    Boolean(selectedYear);

  const filteredModels = allCatalogModels.filter((model) => {
    const searchableText = [
      model.brandName,
      model.name,
      model.subtitle,
      model.description,
      model.features,
      model.specs,
      model.category?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = search ? searchableText.includes(search) : true;

    const matchesBrand =
      selectedBrand !== "TODAS" ? model.brandSlug === selectedBrand : true;

    const matchesType =
      selectedType !== "TODOS" ? model.categoryType === selectedType : true;

    const matchesYear = selectedYear ? model.year === selectedYear : true;

    return matchesSearch && matchesBrand && matchesType && matchesYear;
  });

  const modelsToShow = hasActiveSearch
    ? filteredModels
    : allCatalogModels.slice(0, 8);

  const totalModels = visibleBrands.reduce(
    (total, brand) => total + brand.catalogModels.length,
    0
  );

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.94))]" />

        <Container>
          <div className="relative z-10 py-14 md:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
              <BadgeCheck size={16} />
              Catálogo Grupo Rise
            </span>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
                  Modelos nuevos por marca.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
                  Selecciona una marca para explorar sus modelos nuevos,
                  categorías, características y opciones de contacto.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/inventario"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
                  >
                    Ver seminuevos
                  </Link>

                  <Link
                    href="/contacto"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[var(--rise-navy)] transition hover:bg-slate-100"
                  >
                    Contactar asesor
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
                    Catálogo activo
                  </p>

                  <p className="mt-2 text-5xl font-black">
                    {visibleBrands.length}
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/60">
                    marcas disponibles
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-black">{totalModels}</p>
                  <p className="mt-1 text-xs font-bold text-white/60">
                    modelos registrados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Explora por marca
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                Marcas disponibles
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Elige una marca para ver sus modelos nuevos registrados en el
                catálogo.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
              <Search size={17} />
              {visibleBrands.length} marca(s)
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleBrands.map((brand) => {
              const brandSlug = getBrandSlug(brand.name);
              const firstModel = brand.catalogModels[0];
              const fallbackImage =
                firstModel?.images[0]?.url || firstModel?.mainImage || "";
              const brandImage = getBrandCover(brand.name) || fallbackImage;

              return (
                <Link
                  key={brand.id}
                  href={`/catalogo/${brandSlug}`}
                  className="group overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100">
                    {brandImage ? (
                      <img
                        src={brandImage}
                        alt={brand.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-400">
                        <div className="text-center">
                          <ImageIcon className="mx-auto" size={46} />
                          <p className="mt-2 text-xs font-black uppercase tracking-wider">
                            Sin imagen de marca
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                        Grupo Rise
                      </p>

                      <h3 className="mt-1 text-3xl font-black text-white">
                        {brand.name}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-white/70">
                        {brand.catalogModels.length} modelo(s) registrados
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-4 py-3 text-sm font-black text-white transition group-hover:bg-[var(--rise-blue)]">
                      Ver catálogo
                      <ArrowRight size={17} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {visibleBrands.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <Layers3 className="mx-auto text-slate-400" size={52} />

              <h2 className="mt-5 text-2xl font-black">
                Aún no hay marcas configuradas.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Cuando agregues modelos al catálogo, las marcas aparecerán aquí.
              </p>
            </div>
          )}
        </Container>
      </section>

      <section id="buscar-modelos" className="scroll-mt-28 pb-12 md:pb-16">
        <Container>
          <div className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Buscar modelos
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  Encuentra el modelo de tu interés
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Filtra por marca, tipo, año o busca directamente por nombre del
                  modelo.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-500">
                <SlidersHorizontal size={17} />
                {filteredModels.length} resultado(s)
              </div>
            </div>

            <form
              action="/catalogo#buscar-modelos"
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Buscar
                </span>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    name="q"
                    defaultValue={params.q ?? ""}
                    placeholder="Ej. Defender, RZR, Classic..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Marca
                </span>

                <select
                  name="marca"
                  defaultValue={selectedBrand}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODAS">Todas</option>

                  {visibleBrands.map((brand) => (
                    <option key={brand.id} value={getBrandSlug(brand.name)}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tipo
                </span>

                <select
                  name="tipo"
                  defaultValue={selectedType}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                >
                  <option value="TODOS">Todos</option>
                  <option value="AUTO">Autos</option>
                  <option value="MOTO">Motos</option>
                  <option value="TODOTERRENO">Todo terreno</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Año
                </span>

                <select
                  name="anio"
                  defaultValue={params.anio ?? "TODOS"}
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
                Buscar
              </button>
            </form>

            {hasActiveSearch && (
              <div className="mt-4">
                <Link
                  href="/catalogo#buscar-modelos"
                  className="text-sm font-black text-[var(--rise-blue)] hover:underline"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}

            {modelsToShow.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {modelsToShow.map((model) => {
                  const image = model.images[0]?.url || model.mainImage || "";

                  return (
                    <Link
                      key={model.id}
                      href={`/catalogo/${model.brandSlug}/${model.slug}`}
                      className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-900/10"
                    >
                      <div className="h-44 overflow-hidden bg-slate-100">
                        {image ? (
                          <img
                            src={image}
                            alt={`${model.brandName} ${model.name}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <ImageIcon size={40} />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rise-blue)]">
                          {model.brandName}
                        </p>

                        <h3 className="mt-2 line-clamp-2 text-xl font-black text-[var(--rise-navy)]">
                          {model.name}
                        </h3>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          {getCategoryLabel(model.categoryType)} ·{" "}
                          {model.year ?? "Año por definir"}
                        </p>

                        {model.category && (
                          <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">
                            {model.category.name}
                          </p>
                        )}

                        <p className="mt-4 text-lg font-black text-[var(--rise-blue)]">
                          {model.priceFrom
                            ? formatCurrency(model.priceFrom)
                            : "Consultar precio"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ImageIcon className="mx-auto text-slate-400" size={48} />

                <h3 className="mt-4 text-xl font-black">
                  No encontramos modelos con esos filtros.
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Intenta buscar por otra marca, año o nombre de modelo.
                </p>

                <Link
                  href="/catalogo"
                  className="mt-5 inline-flex rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}