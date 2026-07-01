import Link from "next/link";
import { ArrowRight, ImageIcon, Sparkles } from "lucide-react";

type HomeBrandCard = {
  id: number;
  name: string;
  slug: string;
  cover: string;
  count: number;
  minPrice: number;
};

type HomeBrandCatalogsProps = {
  brands: HomeBrandCard[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function HomeBrandCatalogs({ brands }: HomeBrandCatalogsProps) {
  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="bg-[var(--rise-bg)] px-4 py-14 md:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              <Sparkles size={17} />
              Catálogos por marca
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--rise-navy)] md:text-5xl">
              Explora nuestras marcas
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Accede directamente al catálogo de cada marca y consulta unidades
              nuevas disponibles en Grupo Rise.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
          >
            Ver catálogo completo
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/catalogo/${brand.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100">
                {brand.cover ? (
                  <img
                    src={brand.cover}
                    alt={brand.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon size={44} className="text-slate-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                    Catálogo
                  </p>

                  <h3 className="mt-1 text-3xl font-black text-white">
                    {brand.name}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Unidades
                    </p>

                    <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
                      {brand.count > 0 ? brand.count : "Próx."}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Desde
                    </p>

                    <p className="mt-1 text-lg font-black text-[var(--rise-navy)]">
                      {brand.minPrice ? formatMoney(brand.minPrice) : "Consultar"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--rise-blue)]">
                  Ver {brand.name}
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}