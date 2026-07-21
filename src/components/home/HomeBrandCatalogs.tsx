import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type BrandCard = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
};

type HomeBrandCatalogsProps = {
  brands: BrandCard[];
};

const logoSizes: Record<string, string> = {
  "can-am": "scale-110",
  polaris: "scale-110",
  "sea-doo": "scale-110",
  "triumph-motorcycles": "scale-110",
  "royal-enfield": "scale-100",
  "indian-motorcycle": "scale-110",
  zeekrlife: "scale-110",
  "lynk-co": "scale-105",
};

export function HomeBrandCatalogs({
  brands,
}: HomeBrandCatalogsProps) {
  if (brands.length === 0) {
    return null;
  }

  return (
    <section
      id="marcas"
      className="border-y border-[var(--home-border)] bg-[var(--home-surface)] py-16 md:py-20"
    >
      <div className="public-container">
        <div className="flex flex-col justify-between gap-6 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
          <div>
            <p className="public-eyebrow">
              Nuestras marcas
            </p>

            <h2 className="public-title mt-4 text-4xl md:text-6xl">
              Marcas que forman
              <span className="block text-[var(--public-accent)]">
                Grupo RISE.
              </span>
            </h2>
          </div>

          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--public-accent)] transition hover:text-[var(--public-accent-dark)]"
          >
            Ver catálogo

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/catalogo/${brand.slug}`}
              aria-label={`Ver catálogo de ${brand.name}`}
              className="group relative flex min-h-[145px] items-center justify-center overflow-hidden rounded-none border border-[var(--home-border)] bg-[var(--home-card)] px-6 py-7 shadow-[0_8px_24px_rgba(18,24,28,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[var(--home-border-strong)] hover:bg-[var(--home-card-hover)] hover:shadow-[var(--home-shadow)] md:min-h-[175px]"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--public-accent)] transition-transform duration-300 group-hover:scale-x-100" />

              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={`Logo de ${brand.name}`}
                  width={240}
                  height={110}
                  className={`max-h-[78px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.08] md:max-h-[92px] ${logoSizes[brand.slug] ?? "scale-100"
                    }`}
                />
              ) : (
                <span className="text-xl font-black text-[var(--public-ink)]">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}