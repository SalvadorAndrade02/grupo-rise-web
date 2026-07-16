import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Layers3,
  MapPin,
} from "lucide-react";

type InstitutionalHeroProps = {
  heroImage?: string | null;
  brandCount: number;
  branchCount: number;
};

export function InstitutionalHero({
  heroImage,
  brandCount,
  branchCount,
}: InstitutionalHeroProps) {
  const stats = [
    {
    },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--home-border)] bg-[var(--home-background)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,30,36,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(22,30,36,0.07) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="pointer-events-none absolute -left-48 top-20 h-[420px] w-[420px] rounded-none bg-[var(--public-accent)]/10 blur-[110px]" />

      <div className="public-container relative grid min-h-[680px] items-stretch gap-10 py-10 md:py-14 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="flex items-center py-10 lg:py-16">
          <div className="max-w-[790px]">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-[var(--public-accent)]" />

              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--public-accent)]">
                Grupo RISE
              </p>
            </div>

            <h1 className="mt-7 max-w-[850px] text-[clamp(3.6rem,7.2vw,7.4rem)] font-black leading-[0.88] tracking-[-0.065em] text-[var(--public-ink)]">
              Distintas formas
              <span className="block text-[var(--public-accent)]">
                de avanzar.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--public-muted)] md:text-xl md:leading-9">
              Reunimos marcas, agencias y experiencias que conectan la
              movilidad, la innovación y la aventura bajo una misma visión.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-none bg-[var(--public-accent)] px-7 text-sm font-black !text-white shadow-[0_12px_30px_rgba(24,42,56,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--public-accent-dark)] hover:!text-white hover:shadow-[0_18px_38px_rgba(24,42,56,0.24)]"
              >
                <span className="text-white">
                  Conoce nuestras marcas
                </span>

                <ArrowRight
                  size={17}
                  className="text-white transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/sucursales"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-none border border-[var(--home-border-strong)] bg-[var(--home-card)] px-7 text-sm font-black text-[var(--public-ink)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--home-card-hover)]"
              >
                Encuentra una agencia

                <MapPin
                  size={17}
                  className="text-[var(--public-accent)]"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[500px] lg:min-h-full">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-none border border-[var(--home-border-strong)]" />

          <div className="relative h-full min-h-[500px] overflow-hidden rounded-none bg-[var(--public-header)] shadow-[0_28px_70px_rgba(18,24,28,0.2)]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Experiencia de movilidad Grupo RISE"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover transition-transform duration-[1400ms] hover:scale-[1.025]"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(145deg,#3d4348_0%,#24292d_45%,#15191c_100%)]" />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,15,20,0.88)_0%,rgba(10,15,20,0.24)_52%,rgba(10,15,20,0.08)_100%)]" />

            <div className="absolute left-6 top-6 rounded-none border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md md:left-8 md:top-8">
              Movilidad · Aventura · Innovación
            </div>

            <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                Una misma visión
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                Ejemplo: Imagen referente a la empresa.
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}