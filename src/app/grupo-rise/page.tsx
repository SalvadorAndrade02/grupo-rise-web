import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Grupo RISE",
    description:
        "Información institucional, misión, visión, valores y noticias de Grupo RISE.",
};

const institutionalBlocks = [
    {
        number: "01",
        label: "Misión",
        title: "Nuestro propósito",
        description:
            "Información institucional pendiente de confirmación por parte de Grupo RISE.",
    },
    {
        number: "02",
        label: "Visión",
        title: "Nuestra dirección",
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

function formatNewsDate(value?: Date | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(value);
}

export default async function GrupoRisePage() {

    const currentDate = new Date();

    const publishedNews =
        await prisma.newsArticle.findMany({
            where: {
                status: NewsStatus.PUBLISHED,

                OR: [
                    {
                        publishedAt: null,
                    },
                    {
                        publishedAt: {
                            lte: currentDate,
                        },
                    },
                ],
            },

            orderBy: [
                {
                    featured: "desc",
                },
                {
                    publishedAt: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],

            take: 3,
        });

    const featuredArticle =
        publishedNews.find(
            (article) => article.featured
        ) ??
        publishedNews[0] ??
        null;

    const secondaryArticles =
        publishedNews
            .filter(
                (article) =>
                    article.id !==
                    featuredArticle?.id
            )
            .slice(0, 2);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#eef0ee]">
                {/* Hero institucional */}
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
                            Una visión compartida por distintas marcas, agencias y
                            experiencias de movilidad.
                        </p>
                    </div>
                </section>

                {/* Presentación del grupo */}
                <section className="border-b border-[var(--home-border)] bg-[var(--home-card)]">
                    <div className="public-container py-16 md:py-24">
                        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                            <div>
                                <p className="public-eyebrow">
                                    Acerca del grupo
                                </p>

                                <h2 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                                    Una identidad construida alrededor de la movilidad.
                                </h2>
                            </div>

                            <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                                <p className="max-w-3xl text-lg leading-8 text-[var(--public-muted)] md:text-xl md:leading-9">
                                    Este espacio presentará la historia, desarrollo, alcance e
                                    identidad de Grupo RISE una vez que la empresa proporcione
                                    la información institucional oficial.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Misión y visión */}
                <section className="border-b border-[var(--home-border)] bg-[#eef0ee]">
                    <div className="public-container py-16 md:py-24">
                        <div className="flex flex-col justify-between gap-6 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
                            <div>
                                <p className="public-eyebrow">
                                    Identidad institucional
                                </p>

                                <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-5xl">
                                    Misión, visión y principios del grupo.
                                </h2>
                            </div>

                            <p className="max-w-md text-sm leading-6 text-[var(--public-muted)]">
                                El contenido definitivo se incorporará cuando Grupo RISE
                                proporcione la información institucional correspondiente.
                            </p>
                        </div>

                        <div className="mt-10 grid border border-[var(--home-border)] bg-[var(--home-card)] lg:grid-cols-2">
                            {institutionalBlocks.map((block, index) => (
                                <article
                                    key={block.label}
                                    className={`min-h-[320px] p-7 md:p-10 ${index === 0
                                        ? "border-b border-[var(--home-border)] lg:border-b-0 lg:border-r"
                                        : ""
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-5">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--public-accent)]">
                                            {block.label}
                                        </span>

                                        <span className="text-sm font-black tracking-[0.12em] text-[var(--public-muted-light)]">
                                            {block.number}
                                        </span>
                                    </div>

                                    <div className="mt-20 max-w-xl">
                                        <h3 className="text-3xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                                            {block.title}
                                        </h3>

                                        <p className="mt-5 text-base leading-7 text-[var(--public-muted)]">
                                            {block.description}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Valores */}
                <section className="border-b border-[var(--home-border)] bg-[var(--home-card)]">
                    <div className="public-container py-16 md:py-24">
                        <div>
                            <p className="public-eyebrow">
                                Nuestros valores
                            </p>

                            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-5xl">
                                Principios que representan a Grupo RISE.
                            </h2>

                            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
                                Los valores institucionales se mostrarán cuando sean
                                confirmados oficialmente por la empresa.
                            </p>
                        </div>

                        <div className="mt-10 grid border border-[var(--home-border)] sm:grid-cols-2 lg:grid-cols-4">
                            {values.map((value, index) => (
                                <article
                                    key={`${value}-${index}`}
                                    className="min-h-[190px] border-b border-[var(--home-border)] p-6 sm:border-r lg:border-b-0"
                                >
                                    <span className="text-xs font-black tracking-[0.16em] text-[var(--public-accent)]">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    <p className="mt-16 text-lg font-black tracking-[-0.02em] text-[var(--public-ink)]">
                                        {value}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Noticias institucionales */}
                <section
                    id="actualidad-rise"
                    className="border-t border-[var(--home-border)] bg-[#eef0ee]"
                >
                    <div className="public-container py-16 md:py-24">
                        <div className="flex flex-col justify-between gap-6 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
                            <div>
                                <p className="public-eyebrow">
                                    Actualidad RISE
                                </p>

                                <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                                    Noticias y novedades del grupo.
                                </h2>
                            </div>

                            <p className="max-w-md text-sm leading-6 text-[var(--public-muted)]">
                                Aperturas, eventos, reconocimientos,
                                lanzamientos y actividades oficiales
                                de Grupo RISE.
                            </p>
                        </div>

                        {!featuredArticle ? (
                            <div className="mt-10 border border-[var(--home-border)] bg-[var(--home-card)] px-6 py-16 text-center md:px-10">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                    Actualidad RISE
                                </p>

                                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--public-ink)]">
                                    Por el momento no hay noticias publicadas.
                                </h3>

                                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--public-muted)]">
                                    Las nuevas publicaciones aparecerán
                                    en esta sección cuando sean publicadas
                                    desde el panel administrativo.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-10 grid border border-[var(--home-border)] lg:grid-cols-[1.35fr_0.65fr]">
                                {/* Noticia principal */}
                                <Link
                                    href={`/grupo-rise/noticias/${featuredArticle.slug}`}
                                    className="group relative min-h-[540px] overflow-hidden border-b border-[var(--home-border)] bg-[#151a1f] text-white lg:border-b-0 lg:border-r"
                                >                                    {featuredArticle.coverImageUrl && (
                                    <img
                                        src={
                                            featuredArticle.coverImageUrl
                                        }
                                        alt={
                                            featuredArticle.coverImageAlt ||
                                            featuredArticle.title
                                        }
                                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                                )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

                                    <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                                    <div className="relative flex min-h-[540px] flex-col justify-between p-7 md:p-10">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/65">
                                                {featuredArticle.featured
                                                    ? "Noticia destacada"
                                                    : "Última publicación"}
                                            </span>

                                            {featuredArticle.publishedAt && (
                                                <span className="text-xs font-bold text-white/55">
                                                    {formatNewsDate(
                                                        featuredArticle.publishedAt
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="max-w-3xl">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                                Grupo RISE
                                            </p>

                                            <h3 className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                                                {featuredArticle.title}
                                            </h3>

                                            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                                                {featuredArticle.excerpt}
                                            </p>

                                            {featuredArticle.authorName && (
                                                <p className="mt-6 text-xs font-bold text-white/50">
                                                    Por{" "}
                                                    {featuredArticle.authorName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                {/* Noticias secundarias */}
                                <div className="grid bg-[var(--home-card)]">
                                    {secondaryArticles.length > 0 ? (
                                        secondaryArticles.map(
                                            (article, index) => (
                                                <Link
                                                    key={article.id}
                                                    href={`/grupo-rise/noticias/${article.slug}`}
                                                    className="group relative min-h-[270px] overflow-hidden border-b border-[var(--home-border)] last:border-b-0"
                                                >
                                                    {article.coverImageUrl && (
                                                        <img
                                                            src={
                                                                article.coverImageUrl
                                                            }
                                                            alt={
                                                                article.coverImageAlt ||
                                                                article.title
                                                            }
                                                            className="absolute inset-0 h-full w-full object-cover opacity-20 transition duration-500 group-hover:scale-105 group-hover:opacity-25"
                                                        />
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--home-card)] via-[var(--home-card)]/95 to-[var(--home-card)]/65" />

                                                    <div className="relative flex min-h-[270px] flex-col justify-between p-7">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                                                Noticia
                                                            </span>

                                                            <span className="text-xs font-black text-[var(--public-muted-light)]">
                                                                {String(
                                                                    index + 2
                                                                ).padStart(2, "0")}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            {article.publishedAt && (
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--public-muted-light)]">
                                                                    {formatNewsDate(
                                                                        article.publishedAt
                                                                    )}
                                                                </p>
                                                            )}

                                                            <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em] text-[var(--public-ink)]">
                                                                {article.title}
                                                            </h3>

                                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--public-muted)]">
                                                                {article.excerpt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        )
                                    ) : (
                                        <div className="flex min-h-[540px] items-center justify-center p-8 text-center">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                                    Próximamente
                                                </p>

                                                <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--public-muted)]">
                                                    Las siguientes publicaciones
                                                    aparecerán en este espacio.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}