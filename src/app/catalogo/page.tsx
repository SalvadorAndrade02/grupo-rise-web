import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Catálogos por marca | Grupo RISE",
  description:
    "Selecciona una marca de Grupo RISE para consultar su catálogo de vehículos.",
};

type BrandGroupKey =
  | "AUTOMOVILES"
  | "MOTOCICLETAS"
  | "AVENTURA"
  | "NAUTICA";

type BrandDefinition = {
  name: string;
  slug: string;
  aliases: string[];
  logo: string;
  group: BrandGroupKey;
};

type VisibleBrand = BrandDefinition & {
  id: number;
};

const brandDefinitions: BrandDefinition[] = [
  {
    name: "ZEEKR",
    slug: "zeekrlife",
    aliases: ["Zeekr", "Zeekrlife", "ZEEKR"],
    logo: "/catalog/brands/zeekNegro.png",
    group: "AUTOMOVILES",
  },
  {
    name: "Lynk & Co",
    slug: "lynk-co",
    aliases: ["Lynk & Co", "Lynk and Co"],
    logo: "/catalog/brands/lynkco.png",
    group: "AUTOMOVILES",
  },
  {
    name: "Indian Motorcycle",
    slug: "indian-motorcycle",
    aliases: ["Indian", "Indian Motorcycle"],
    logo: "/catalog/brands/indian.jpg",
    group: "MOTOCICLETAS",
  },
  {
    name: "Triumph",
    slug: "triumph-motorcycles",
    aliases: ["Triumph", "Triumph Motorcycles"],
    logo: "/catalog/brands/triumph.png",
    group: "MOTOCICLETAS",
  },
  {
    name: "Royal Enfield",
    slug: "royal-enfield",
    aliases: ["Royal Enfield"],
    logo: "/catalog/brands/royal-enfield.jpg",
    group: "MOTOCICLETAS",
  },
  {
    name: "Can-Am",
    slug: "can-am",
    aliases: ["Can-Am", "Can Am", "CanAm"],
    logo: "/catalog/brands/can-am.png",
    group: "AVENTURA",
  },
  {
    name: "Polaris",
    slug: "polaris",
    aliases: ["Polaris"],
    logo: "/catalog/brands/polaris.jpg",
    group: "AVENTURA",
  },
  {
    name: "Sea-Doo",
    slug: "sea-doo",
    aliases: ["Sea-Doo", "Sea Doo", "SeaDoo"],
    logo: "/catalog/brands/sea-doo.jpg",
    group: "AVENTURA",
  },
  {
    name: "Slingshot",
    slug: "slingshot",
    aliases: ["Slingshot", "Polaris Slingshot"],
    logo: "/catalog/brands/slingshot.png",
    group: "AVENTURA",
  },
  {
    name: "Bennington",
    slug: "bennington",
    aliases: ["Bennington", "Bennington Marine"],
    logo: "/catalog/brands/bennington.png",
    group: "NAUTICA",
  },
];

const brandGroups: Array<{
  key: BrandGroupKey;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}> = [
    {
      key: "AUTOMOVILES",
      number: "01",
      eyebrow: "Automóviles",
      title: "Movilidad para todos los días.",
      description:
        "Conoce por separado las propuestas de movilidad y tecnología de nuestras marcas automotrices.",
    },
    {
      key: "MOTOCICLETAS",
      number: "02",
      eyebrow: "Motocicletas",
      title: "Distintas formas de vivir el camino.",
      description:
        "Selecciona una marca para consultar exclusivamente sus motocicletas publicadas.",
    },
    {
      key: "AVENTURA",
      number: "03",
      eyebrow: "Aventura",
      title: "Experiencias dentro y fuera del camino.",
      description:
        "Explora individualmente las marcas enfocadas en vehículos recreativos y aventura.",
    },
    {
      key: "NAUTICA",
      number: "04",
      eyebrow: "Náutica",
      title: "Experiencias para disfrutar el agua.",
      description:
        "Explora las marcas y embarcaciones enfocadas en navegación, recreación y convivencia.",
    },
  ];

function normalizeBrandName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export default async function CatalogPage() {
  const aliases = Array.from(
    new Set(
      brandDefinitions.flatMap((brand) => brand.aliases)
    )
  );

  const databaseBrands = await prisma.brand.findMany({
    where: {
      active: true,
      name: {
        in: aliases,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const databaseBrandsByName = new Map(
    databaseBrands.map((brand) => [
      normalizeBrandName(brand.name),
      brand,
    ])
  );

  const visibleBrands: VisibleBrand[] =
    brandDefinitions.flatMap((definition) => {
      const databaseBrand = definition.aliases
        .map((alias) =>
          databaseBrandsByName.get(
            normalizeBrandName(alias)
          )
        )
        .find(
          (
            brand
          ): brand is {
            id: number;
            name: string;
          } => Boolean(brand)
        );

      if (!databaseBrand) {
        return [];
      }

      return [
        {
          ...definition,
          id: databaseBrand.id,
        },
      ];
    });

  const visibleGroups = brandGroups
    .map((group) => ({
      ...group,
      brands: visibleBrands.filter(
        (brand) => brand.group === group.key
      ),
    }))
    .filter((group) => group.brands.length > 0);

  return (
    <>
      <Header />

      <main className="public-home">
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          {/* Imagen exclusiva del encabezado */}
          <Image
            src="/images/catalogo/catalogo-header.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Capa oscura para mantener legible el texto */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,16,0.92)_0%,rgba(8,12,16,0.75)_48%,rgba(8,12,16,0.35)_100%)]" />

          {/* Oscurecimiento adicional */}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_42%)]" />

          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] border border-white/[0.04]" />

          <div className="public-container relative grid min-h-[430px] items-center gap-14 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-white" />

                <p className="text-xs font-black uppercase tracking-[0.24em] text-white">
                  Marcas Grupo RISE
                </p>
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                Un catálogo diferente
                <span className="block text-white">
                  para cada marca.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white md:text-lg">
                Selecciona la marca que deseas consultar. Cada catálogo presenta
                únicamente los vehículos correspondientes a esa marca.
              </p>
            </div>

            <div className="hidden border-l border-white/10 pl-10 lg:block">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                Explora por categoría
              </p>

              <div className="mt-7 border-y border-white">
                {[
                  {
                    number: "01",
                    label: "Automóviles",
                  },
                  {
                    number: "02",
                    label: "Motocicletas",
                  },
                  {
                    number: "03",
                    label: "Aventura",
                  },
                  {
                    number: "04",
                    label: "Náutica",
                  },
                ].map((category) => (
                  <div
                    key={category.number}
                    className="flex items-center justify-between border-b border-white py-5 last:border-b-0"
                  >
                    <span className="text-xs font-black tracking-[0.18em] text-white">
                      {category.number}
                    </span>

                    <span className="text-base font-black text-white">
                      {category.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--home-border)] bg-[var(--home-background)]">
          <div className="public-container py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="public-eyebrow">
                  Catálogos disponibles
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                  Encuentra primero tu marca.
                </h2>
              </div>

              <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                <p className="max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                  Grupo RISE reúne diferentes formas de movilidad. Para
                  mantener la identidad y el catálogo independiente de cada
                  marca, los vehículos se consultan desde su propia sección.
                </p>
              </div>
            </div>
          </div>
        </section>

        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => (
            <section
              key={group.key}
              className="border-b border-[var(--home-border)] bg-[var(--home-surface)]"
            >
              <div className="public-container py-16 md:py-24">
                <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
                  <div>
                    <span className="text-5xl font-black tracking-[-0.05em] text-[var(--public-accent)]">
                      {group.number}
                    </span>

                    <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[var(--public-muted)]">
                      {group.eyebrow}
                    </p>

                    <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[var(--public-ink)]">
                      {group.title}
                    </h2>

                    <p className="mt-5 text-sm leading-7 text-[var(--public-muted)]">
                      {group.description}
                    </p>
                  </div>

                  <div className="grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">                    {group.brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/catalogo/${brand.slug}`}
                      aria-label={`Consultar catálogo de ${brand.name}`}
                      className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden bg-[var(--home-card)] p-6 transition duration-300 hover:bg-[var(--home-card-hover)] md:min-h-[260px]"
                    >
                      <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />

                      <div className="flex flex-1 items-center justify-center py-6">
                        <div className="relative h-[110px] w-[92%] transition-transform duration-300 group-hover:scale-[1.04] md:h-[135px]">
                          <Image
                            src={brand.logo}
                            alt={`Logo de ${brand.name}`}
                            fill
                            sizes="(max-width: 640px) 85vw, (max-width: 1280px) 42vw, 28vw"
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-5 border-t border-[var(--home-border)] pt-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                            Consultar marca
                          </p>

                          <p className="mt-1 text-lg font-black text-[var(--public-ink)]">
                            {brand.name}
                          </p>
                        </div>

                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--home-border-strong)] text-[var(--public-ink)] transition group-hover:border-[var(--public-accent)] group-hover:bg-[var(--public-accent)] group-hover:text-white">
                          <ArrowRight
                            size={18}
                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </Link>
                  ))}
                  </div>
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="bg-[var(--home-background)]">
            <div className="public-container py-20 md:py-28">
              <div className="border border-[var(--home-border)] bg-[var(--home-card)] p-8 md:p-12">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--public-accent)]">
                  Catálogos en preparación
                </p>

                <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                  Las marcas estarán disponibles próximamente.
                </h2>

                <p className="mt-5 max-w-2xl leading-7 text-[var(--public-muted)]">
                  Activa las marcas desde el administrador para mostrarlas
                  en esta sección.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}