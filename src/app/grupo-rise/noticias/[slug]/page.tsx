import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Newspaper,
    UserRound,
} from "lucide-react";
import { NewsStatus } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewsDetailPageProps = {
    params: Promise<{
        slug: string;
    }>;
};

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

async function getPublishedArticle(slug: string) {
    return prisma.newsArticle.findFirst({
        where: {
            slug,
            status: NewsStatus.PUBLISHED,

            OR: [
                {
                    publishedAt: null,
                },
                {
                    publishedAt: {
                        lte: new Date(),
                    },
                },
            ],
        },
    });
}

export async function generateMetadata({
    params,
}: NewsDetailPageProps): Promise<Metadata> {
    const { slug } = await params;

    const article =
        await getPublishedArticle(slug);

    if (!article) {
        return {
            title: "Noticia no encontrada",
        };
    }

    return {
        title: `${article.title} | Grupo RISE`,
        description: article.excerpt,

        openGraph: {
            title: article.title,
            description: article.excerpt,
            type: "article",

            publishedTime:
                article.publishedAt?.toISOString(),

            images: article.coverImageUrl
                ? [
                    {
                        url: article.coverImageUrl,
                        alt:
                            article.coverImageAlt ??
                            article.title,
                    },
                ]
                : undefined,
        },
    };
}

export default async function NewsDetailPage({
    params,
}: NewsDetailPageProps) {
    const { slug } = await params;

    const article =
        await getPublishedArticle(slug);

    if (!article) {
        notFound();
    }

    const relatedArticles =
        await prisma.newsArticle.findMany({
            where: {
                id: {
                    not: article.id,
                },

                status: NewsStatus.PUBLISHED,

                OR: [
                    {
                        publishedAt: null,
                    },
                    {
                        publishedAt: {
                            lte: new Date(),
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

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#eef0ee]">
                {/* Encabezado */}
                <section className="relative overflow-hidden bg-[#151a1f] text-white">
                    {article.coverImageUrl && (
                        <img
                            src={article.coverImageUrl}
                            alt={
                                article.coverImageAlt ||
                                article.title
                            }
                            className="absolute inset-0 h-full w-full object-cover opacity-45"
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#151a1f] via-[#151a1f]/85 to-[#151a1f]/45" />

                    <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                    <div className="public-container relative py-16 md:py-24 lg:py-32">
                        <Link
                            href="/grupo-rise#actualidad-rise"
                            className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Volver a noticias
                        </Link>

                        <div className="mt-14 max-w-5xl">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--public-accent)]">
                                Actualidad RISE
                            </p>

                            <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl lg:text-7xl">
                                {article.title}
                            </h1>

                            <p className="mt-6 max-w-3xl text-base leading-8 text-white/70 md:text-lg">
                                {article.excerpt}
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/15 pt-6">
                                {article.publishedAt && (
                                    <span className="inline-flex items-center gap-2 text-xs font-bold text-white/55">
                                        <CalendarDays size={15} />

                                        {formatNewsDate(
                                            article.publishedAt
                                        )}
                                    </span>
                                )}

                                {article.authorName && (
                                    <span className="inline-flex items-center gap-2 text-xs font-bold text-white/55">
                                        <UserRound size={15} />

                                        {article.authorName}
                                    </span>
                                )}

                                {article.featured && (
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                                        Noticia destacada
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contenido */}
                <section className="public-container py-16 md:py-24">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
                        <article className="min-w-0 border border-[var(--home-border)] bg-[var(--home-card)] px-6 py-10 md:px-10 md:py-14">
                            <div className="whitespace-pre-line text-base leading-8 text-[var(--public-muted)] md:text-lg md:leading-9">
                                {article.content}
                            </div>
                        </article>

                        <aside className="lg:sticky lg:top-28 lg:self-start">
                            <div className="border border-[var(--home-border)] bg-[var(--home-card)] p-6">
                                <span className="grid h-11 w-11 place-items-center bg-[var(--public-header)] text-white">
                                    <Newspaper size={19} />
                                </span>

                                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                    Grupo RISE
                                </p>

                                <h2 className="mt-3 text-xl font-black tracking-[-0.025em] text-[var(--public-ink)]">
                                    Actualidad del grupo
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                                    Conoce las noticias,
                                    eventos y novedades
                                    publicadas por Grupo RISE.
                                </p>

                                <Link
                                    href="/grupo-rise#actualidad-rise"
                                    className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[var(--public-ink)] transition hover:text-[var(--public-accent)]"
                                >
                                    Ver todas las noticias
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* Noticias relacionadas */}
                {relatedArticles.length > 0 && (
                    <section className="border-t border-[var(--home-border)] bg-[var(--home-card)]">
                        <div className="public-container py-16 md:py-24">
                            <div className="flex flex-col justify-between gap-5 border-b border-[var(--home-border)] pb-7 md:flex-row md:items-end">
                                <div>
                                    <p className="public-eyebrow">
                                        Más publicaciones
                                    </p>

                                    <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                                        Noticias relacionadas.
                                    </h2>
                                </div>

                                <Link
                                    href="/grupo-rise#actualidad-rise"
                                    className="inline-flex items-center gap-2 text-xs font-black text-[var(--public-ink)] transition hover:text-[var(--public-accent)]"
                                >
                                    Ver actualidad
                                    <ArrowRight size={15} />
                                </Link>
                            </div>

                            <div className="mt-8 grid border-l border-t border-[var(--home-border)] md:grid-cols-2 xl:grid-cols-3">
                                {relatedArticles.map(
                                    (relatedArticle) => (
                                        <Link
                                            key={relatedArticle.id}
                                            href={`/grupo-rise/noticias/${relatedArticle.slug}`}
                                            className="group border-b border-r border-[var(--home-border)] bg-[#eef0ee] transition hover:bg-white"
                                        >
                                            <div className="relative aspect-[16/9] overflow-hidden bg-[#dfe2df]">
                                                {relatedArticle.coverImageUrl ? (
                                                    <img
                                                        src={
                                                            relatedArticle.coverImageUrl
                                                        }
                                                        alt={
                                                            relatedArticle.coverImageAlt ||
                                                            relatedArticle.title
                                                        }
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center text-[var(--public-muted-light)]">
                                                        <Newspaper size={28} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-6">
                                                {relatedArticle.publishedAt && (
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--public-accent)]">
                                                        {formatNewsDate(
                                                            relatedArticle.publishedAt
                                                        )}
                                                    </p>
                                                )}

                                                <h3 className="mt-4 text-xl font-black leading-tight tracking-[-0.025em] text-[var(--public-ink)]">
                                                    {relatedArticle.title}
                                                </h3>

                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--public-muted)]">
                                                    {relatedArticle.excerpt}
                                                </p>

                                                <span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[var(--public-ink)]">
                                                    Leer noticia
                                                    <ArrowRight
                                                        size={15}
                                                        className="transition-transform group-hover:translate-x-1"
                                                    />
                                                </span>
                                            </div>
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}