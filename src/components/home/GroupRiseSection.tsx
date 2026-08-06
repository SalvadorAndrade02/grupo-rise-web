const institutionalBlocks = [
    {
        number: "01",
        label: "Misión",
        title: "Propósito institucional",
        description:
            "Información institucional pendiente de confirmación por parte de Grupo RISE.",
    },
    {
        number: "02",
        label: "Visión",
        title: "Dirección del grupo",
        description:
            "Información institucional pendiente de confirmación por parte de Grupo RISE.",
    },
];

const values = [
    "Valor por definir",
    "Valor por definir",
    "Valor por definir",
    "Valor por definir",
];

export function GroupRiseSection() {
    return (
        <section
            id="grupo-rise"
            className="scroll-mt-24 border-b border-[var(--home-border)] bg-[#eef0ee]"
        >
            {/* Presentación del grupo */}
            <div className="relative overflow-hidden border-b border-[var(--home-border)]">
                <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(135deg,transparent,rgba(38,58,75,0.07))]" />

                <div className="public-container public-section relative">
                    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                        <div>
                            <p className="public-eyebrow">Acerca del grupo</p>

                            <h2 className="public-title mt-5 max-w-xl text-4xl md:text-6xl">
                                Una visión compartida por distintas marcas.
                            </h2>
                        </div>

                        <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                            <p className="max-w-3xl text-lg leading-8 text-[var(--public-muted)] md:text-xl md:leading-9">
                                Este espacio presentará la historia, identidad y enfoque
                                institucional de Grupo RISE una vez que la información sea
                                confirmada por la empresa.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Noticias */}
            <div className="bg-[var(--home-surface-alt)]">
                <div className="public-container public-section">
                    <div className="flex flex-col justify-between gap-6 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
                        <div>
                            <p className="public-eyebrow">Actualidad RISE</p>

                            <h3 className="public-title mt-5 text-4xl md:text-6xl">
                                Noticias y novedades del grupo.
                            </h3>
                        </div>

                        <p className="max-w-md text-sm leading-6 text-[var(--public-muted)]">
                            Espacio destinado a aperturas, lanzamientos, eventos,
                            reconocimientos y actividades oficiales.
                        </p>
                    </div>

                    <div className="mt-10 grid border border-[var(--home-border)] lg:grid-cols-[1.35fr_0.65fr]">
                        {/* Noticia principal */}
                        <article className="relative min-h-[520px] overflow-hidden border-b border-[var(--home-border)] bg-[var(--public-header)] text-white lg:border-b-0 lg:border-r">
                            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                            <div className="relative flex min-h-[520px] flex-col justify-between p-7 md:p-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
                                        Noticia destacada
                                    </span>

                                    <span className="text-xs font-black text-white/35">01</span>
                                </div>

                                <div>
                                    <div className="mb-8 flex h-40 items-center justify-center border border-dashed border-white/20 bg-white/[0.025]">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
                                            Imagen principal
                                        </span>
                                    </div>

                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                        Próximamente
                                    </p>

                                    <h4 className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                                        Contenido oficial pendiente de publicación.
                                    </h4>

                                    <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">
                                        La noticia principal se mostrará cuando Grupo RISE
                                        proporcione la información y los recursos oficiales.
                                    </p>
                                </div>
                            </div>
                        </article>

                        {/* Noticias secundarias */}
                        <div className="grid">
                            {[2, 3].map((item) => (
                                <article
                                    key={item}
                                    className="min-h-[260px] border-b border-[var(--home-border)] bg-[var(--home-card)] p-7 last:border-b-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                            Próximamente
                                        </span>

                                        <span className="text-xs font-black text-[var(--public-muted-light)]">
                                            0{item}
                                        </span>
                                    </div>

                                    <div className="mt-10 flex h-20 items-center justify-center border border-dashed border-[var(--home-border-strong)] bg-[#eef0ee]">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--public-muted-light)]">
                                            Imagen de noticia
                                        </span>
                                    </div>

                                    <h4 className="mt-6 text-xl font-black text-[var(--public-ink)]">
                                        Contenido por definir
                                    </h4>

                                    <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                                        Espacio reservado para información oficial de la empresa.
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}