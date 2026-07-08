"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

type BrandItem = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
};

type HomeBrandCatalogsProps = {
  brands: BrandItem[];
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
      className="border-y border-black/5 bg-white py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#bd8540]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9b682a]">
                Grupo multimarca
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0a0f14] md:text-4xl">
              Nuestras marcas
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
              Explora los vehículos disponibles de las marcas que forman parte
              de Grupo Rise.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[#0a0f14]"
          >
            Ver catálogo

            <span className="grid h-9 w-9 place-items-center rounded-full border border-black/15 transition group-hover:border-[#c9954d] group-hover:bg-[#c9954d]">
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {brands.map((brand) => (
            <BrandLogoCard key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandLogoCard({
  brand,
}: {
  brand: BrandItem;
}) {
  const [imageError, setImageError] = useState(false);
  const showLogo = Boolean(brand.logo) && !imageError;

  return (
    <Link
      href={`/catalogo/${brand.slug}`}
      aria-label={`Ver vehículos de ${brand.name}`}
      className="group relative flex min-h-[150px] items-center justify-center overflow-hidden border-b border-r border-slate-200 bg-white px-5 py-7 transition duration-300 hover:z-10 hover:bg-[#f7f4ee] hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]"
    >
      <div className="relative flex h-[76px] w-full items-center justify-center">
        {showLogo ? (
          <Image
            src={brand.logo!}
            alt={`Logo ${brand.name}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 12vw"
            className="object-contain grayscale transition duration-300 group-hover:scale-105 group-hover:grayscale-0 group-active:scale-105 group-active:grayscale-0" onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-center text-lg font-black tracking-[-0.025em] text-slate-700 transition group-hover:text-[#9b682a]">
            {brand.name}
          </span>
        )}
      </div>

      <span className="absolute bottom-0 left-1/2 h-[3px] w-0 -translate-x-1/2 bg-[#c9954d] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}