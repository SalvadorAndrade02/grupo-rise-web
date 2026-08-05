import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Grupo RISE",
    description:
        "Información institucional y noticias de Grupo RISE.",
};

export default function GrupoRisePage() {
    return (
        <main className="min-h-screen bg-[var(--public-background)]">
            <section className="relative overflow-hidden bg-[#303336] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_34%)]" />

                <div className="public-container relative py-20 md:py-28">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">
                        Información institucional
                    </p>

                    <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.055em] md:text-7xl">
                        Grupo RISE
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
                        Este espacio reunirá la información
                        institucional y las noticias de Grupo
                        RISE.
                    </p>
                </div>
            </section>

            <section className="public-container py-16 md:py-24">
                <div className="border border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-14 text-center md:px-10">
                    <p className="public-eyebrow">
                        Contenido en preparación
                    </p>

                    <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-4xl">
                        Información de Grupo RISE
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
                        La información de la empresa, misión,
                        visión, valores y noticias se agregará
                        cuando el contenido institucional sea
                        proporcionado.
                    </p>
                </div>
            </section>
        </main>
    );
}