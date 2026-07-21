import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function CertificadosRisePage() {
  return (
    <main className="min-h-screen bg-[var(--public-background)] text-[var(--public-text)]">
      <Header />

      <section className="border-b border-[var(--public-border)] bg-[var(--public-header)] text-white">
        <div className="public-container py-24 md:py-32">
          <p className="public-eyebrow !text-white">
            Respaldo Grupo RISE
          </p>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
            Vehículos Certificados RISE
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-white md:text-lg">
            Próximamente podrás consultar unidades seleccionadas y
            certificadas por Grupo RISE.
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="border border-[var(--public-border)] bg-[var(--public-surface)] p-8 md:p-12">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
              Inventario en preparación
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
              Estamos preparando el catálogo certificado.
            </h2>

            <p className="mt-5 max-w-2xl leading-7 text-[var(--public-muted)]">
              Las unidades se mostrarán en esta sección una vez que
              se defina y valide su proceso de certificación.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}