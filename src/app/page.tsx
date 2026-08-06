import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InstitutionalHero } from "@/components/home/InstitutionalHero";
import { HomeBrandCatalogs } from "@/components/home/HomeBrandCatalogs";
import { GroupRiseSection } from "@/components/home/GroupRiseSection";
import { BranchesCarousel } from "@/components/home/BranchesCarousel";
import { prisma } from "@/lib/prisma";
import {
  VehicleCategory,
  VehicleMediaType,
  VehicleStatus,
} from "@prisma/client";

import { VehicleCategoryShowcase } from "@/components/home/VehicleCategoryShowcase";

export const revalidate = 300;

const catalogBrandNames = [
  "Can-Am",
  "Polaris",
  "Sea-Doo",
  "Sea Doo",
  "SeaDoo",
  "Triumph",
  "Triumph Motorcycles",
  "Royal Enfield",
  "Indian",
  "Indian Motorcycle",
  "Zeekr",
  "Zeekrlife",
  "Lynk & Co",
];

const brandSlugOrder = [
  "can-am",
  "polaris",
  "sea-doo",
  "triumph-motorcycles",
  "royal-enfield",
  "indian-motorcycle",
  "zeekrlife",
  "lynk-co",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugifyBrand(value: string) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getBrandSlug(brandName: string) {
  const customSlugs: Record<string, string> = {
    "Can-Am": "can-am",
    Polaris: "polaris",
    "Sea-Doo": "sea-doo",
    "Sea Doo": "sea-doo",
    SeaDoo: "sea-doo",
    Triumph: "triumph-motorcycles",
    "Triumph Motorcycles": "triumph-motorcycles",
    "Royal Enfield": "royal-enfield",
    Indian: "indian-motorcycle",
    "Indian Motorcycle": "indian-motorcycle",
    Zeekr: "zeekrlife",
    Zeekrlife: "zeekrlife",
    "Lynk & Co": "lynk-co",
  };

  return customSlugs[brandName] ?? slugifyBrand(brandName);
}

function getBrandLogo(brandName: string) {
  const logos: Record<string, string> = {
    "Can-Am": "/catalog/brands/can-am.png",
    Polaris: "/catalog/brands/polaris.jpg",
    "Sea-Doo": "/catalog/brands/sea-doo.jpg",
    "Sea Doo": "/catalog/brands/sea-doo.jpg",
    SeaDoo: "/catalog/brands/sea-doo.jpg",
    Triumph: "/catalog/brands/triumph.png",
    "Triumph Motorcycles": "/catalog/brands/triumph.png",
    "Royal Enfield": "/catalog/brands/royal-enfield.jpg",
    Indian: "/catalog/brands/indian.jpg",
    "Indian Motorcycle": "/catalog/brands/indian.jpg",
    Zeekr: "/catalog/brands/zeekNegro.png",
    Zeekrlife: "/catalog/brands/zeekNegro.png",
    "Lynk & Co": "/catalog/brands/lynkco.png",
  };

  return logos[brandName] ?? null;
}

function getBrandSortOrder(brandName: string) {
  const index = brandSlugOrder.indexOf(getBrandSlug(brandName));

  return index === -1 ? 999 : index;
}

export default async function HomePage() {
  const [
    branches,
    catalogBrands,
    autoVehicle,
    motorcycleVehicle,
    offRoadVehicle,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: {
        active: true,
        countryCode: "MX",
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          city: "asc",
        },
      ],
    }),

    prisma.brand.findMany({
      where: {
        active: true,
        name: {
          in: catalogBrandNames,
        },
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.vehicle.findFirst({
      where: {
        active: true,
        status: VehicleStatus.DISPONIBLE,
        category: VehicleCategory.AUTO,
        brand: {
          active: true,
        },
        branch: {
          active: true,
        },
      },
      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        mainImage: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
    }),

    prisma.vehicle.findFirst({
      where: {
        active: true,
        status: VehicleStatus.DISPONIBLE,
        category: VehicleCategory.MOTO,
        brand: {
          active: true,
        },
        branch: {
          active: true,
        },
      },
      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        mainImage: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
    }),

    prisma.vehicle.findFirst({
      where: {
        active: true,
        status: VehicleStatus.DISPONIBLE,
        category: VehicleCategory.TODOTERRENO,
        brand: {
          active: true,
        },
        branch: {
          active: true,
        },
      },
      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        mainImage: true,
        images: {
          where: {
            type: VehicleMediaType.IMAGE,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
    }),
  ]);

  const autoImage =
    autoVehicle?.mainImage ||
    autoVehicle?.images[0]?.url ||
    null;

  const motorcycleImage =
    motorcycleVehicle?.mainImage ||
    motorcycleVehicle?.images[0]?.url ||
    null;

  const offRoadImage =
    offRoadVehicle?.mainImage ||
    offRoadVehicle?.images[0]?.url ||
    null;

  const brandCardsBySlug = new Map<
    string,
    {
      id: number;
      name: string;
      slug: string;
      logo: string | null;
    }
  >();

  catalogBrands.forEach((brand) => {
    const slug = getBrandSlug(brand.name);

    if (!brandCardsBySlug.has(slug)) {
      brandCardsBySlug.set(slug, {
        id: brand.id,
        name: brand.name,
        slug,
        logo: getBrandLogo(brand.name),
      });
    }
  });

  const formattedBrandCards = Array.from(
    brandCardsBySlug.values()
  ).sort(
    (a, b) =>
      getBrandSortOrder(a.name) - getBrandSortOrder(b.name)
  );

  return (
    <main className="min-h-screen overflow-x-clip text-[var(--public-text)]">
      <Header />

      <div className="public-home">
        <InstitutionalHero
          heroImage={autoImage || motorcycleImage || offRoadImage}
          brandCount={formattedBrandCards.length}
          branchCount={branches.length}
        />

        <GroupRiseSection />

        <div className="bg-[var(--home-background)]">
          <VehicleCategoryShowcase
            autoImage={autoImage}
            motorcycleImage={motorcycleImage}
            offRoadImage={offRoadImage}
          />
        </div>

        <div className="bg-[var(--home-surface)]">
          <HomeBrandCatalogs brands={formattedBrandCards} />
        </div>

        <section
          id="noticias"
          className="public-section border-y border-[var(--home-border)] bg-[var(--home-background)]"
        >
          <div className="public-container">
            <div className="flex flex-col justify-between gap-6 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
              <div>
                <p className="public-eyebrow">
                  Noticias y novedades
                </p>

                <h2 className="public-title mt-5 text-4xl md:text-6xl">
                  Lo nuevo en Grupo RISE.
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-[var(--public-muted)]">
                Espacio destinado a lanzamientos, noticias y novedades de las
                marcas que forman parte del grupo.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <article
                  key={item}
                  className="group relative min-h-[370px] overflow-hidden rounded-none border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_12px_32px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--home-border-strong)] hover:bg-[var(--home-card-hover)] hover:shadow-[var(--home-shadow)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                  <div className="flex h-full flex-col justify-between p-7">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                          Próximamente
                        </span>

                        <span className="text-xs font-semibold text-[var(--public-muted-light)]">
                          0{item}
                        </span>
                      </div>

                      <div className="relative mt-12 flex h-28 items-center justify-center overflow-hidden rounded-none border border-dashed border-[var(--home-border-strong)] bg-[var(--home-surface-alt)]">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--public-muted-light)]">
                          Imagen de noticia
                        </span>
                      </div>

                      <h3 className="mt-7 text-2xl font-bold tracking-[-0.03em] text-[var(--public-ink)]">
                        Contenido por definir
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                        Este espacio se utilizará para publicar información
                        oficial, novedades y lanzamientos del grupo.
                      </p>
                    </div>

                    <div className="mt-8 border-t border-[var(--home-border)] pt-5">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--public-muted-light)]">
                        Grupo RISE
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="eventos"
          className="public-section border-b border-[var(--home-border)] bg-[var(--home-surface-alt)]"
        >
          <div className="public-container">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="public-eyebrow">
                  Eventos y experiencias
                </p>

                <h2 className="public-title mt-5 text-4xl md:text-6xl">
                  Experiencias que se viven.
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-[var(--public-muted)]">
                  Espacio preparado para rodadas, exhibiciones, pruebas de
                  manejo, lanzamientos y actividades especiales.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <article className="relative min-h-[430px] overflow-hidden rounded-none bg-[var(--public-header)] p-8 text-white shadow-[0_22px_55px_rgba(18,24,28,0.18)] md:col-span-2 md:p-10">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-none bg-white/[0.05] blur-3xl" />

                  <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-none bg-[var(--public-accent)]/40 blur-3xl" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                        Evento destacado
                      </span>

                      <span className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/65">
                        Próximamente
                      </span>
                    </div>

                    <div className="mt-20 max-w-2xl">
                      <p className="text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                        Próxima experiencia Grupo RISE.
                      </p>

                      <p className="mt-5 max-w-xl text-base leading-7 text-white/55">
                        La información oficial del próximo evento se mostrará en
                        este espacio.
                      </p>
                    </div>

                    <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.15em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        Fecha por confirmar
                      </span>

                      <span>
                        Ubicación por confirmar
                      </span>
                    </div>
                  </div>
                </article>

                <article className="min-h-[220px] rounded-none border border-[var(--home-border)] bg-[var(--home-card)] p-7 shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--home-card-hover)] hover:shadow-[var(--home-shadow)]">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                    Rodadas
                  </span>

                  <h3 className="mt-10 text-2xl font-bold tracking-[-0.03em] text-[var(--public-ink)]">
                    Próximamente
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                    Espacio reservado para próximas experiencias en motocicleta.
                  </p>
                </article>

                <article className="min-h-[220px] rounded-none border border-[var(--home-border)] bg-[var(--home-card)] p-7 shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--home-card-hover)] hover:shadow-[var(--home-shadow)]">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                    Lanzamientos
                  </span>

                  <h3 className="mt-10 text-2xl font-bold tracking-[-0.03em] text-[var(--public-ink)]">
                    Próximamente
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                    Espacio destinado a presentaciones y novedades de las marcas.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[var(--home-background)]">
          <BranchesCarousel branches={branches} />
        </div>
      </div>

      <Footer />
    </main>
  );
}