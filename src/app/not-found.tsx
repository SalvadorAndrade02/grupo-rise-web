import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  Home,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_30%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <Container>
            <div className="relative flex min-h-[520px] flex-col items-center justify-center py-14 text-center md:min-h-[610px] md:py-20">
              <div className="relative">
                <p className="select-none text-[120px] font-black leading-none tracking-[-0.09em] text-white/[0.06] sm:text-[170px] md:text-[220px]">
                  404
                </p>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="grid h-20 w-20 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-[#dfe7ec] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm md:h-24 md:w-24">
                    <SearchX
                      size={44}
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
              </div>

              <div className="-mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm md:-mt-6">
                <Sparkles size={15} />
                Página no encontrada
              </div>

              <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                No encontramos lo que estabas buscando
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                La página pudo haber cambiado de dirección, ya no estar
                disponible o el enlace puede ser incorrecto.
              </p>

              <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
                >
                  <Home size={17} />
                  Volver al inicio
                </Link>

                <Link
                  href="/catalogo"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Ver catálogo

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-10 md:py-12">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-[#192a3a]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                    Continúa explorando
                  </p>

                  <span className="h-px w-8 bg-[#192a3a]" />
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  Encuentra otra sección
                </h2>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <NavigationCard
                  href="/"
                  icon={Home}
                  title="Inicio"
                  description="Regresa a la página principal de Grupo Rise."
                />

                <NavigationCard
                  href="/catalogo"
                  icon={Car}
                  title="Catálogo"
                  description="Explora vehículos nuevos disponibles."
                />

                <NavigationCard
                  href="/sucursales"
                  icon={Building2}
                  title="Sucursales"
                  description="Consulta nuestras agencias y medios de contacto."
                />
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 text-sm font-black text-[#192a3a]"
                >
                  <ArrowLeft
                    size={16}
                    className="transition-transform group-hover:-translate-x-0.5 group-active:-translate-x-0.5"
                  />

                  Regresar al inicio
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

type NavigationCardProps = {
  href: string;
  icon: typeof Home;
  title: string;
  description: string;
};

function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
}: NavigationCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] active:border-[#192a3a]/35 md:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a] transition group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <Icon size={21} />
        </span>

        <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-[#192a3a] transition group-hover:border-[#192a3a] group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
          />
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#192a3a] transition-all duration-500 group-hover:w-full group-active:w-full" />
    </Link>
  );
}