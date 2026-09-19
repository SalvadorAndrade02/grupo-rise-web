import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
    ExperienceStatus,
    ExperienceType,
    NewsStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import {
    Target,
    Eye,
    Handshake,
    Scale,
    TrendingUp,
    Award,
    Trophy,
    ShieldCheck,
    BriefcaseBusiness,
    Headphones,
    HeartHandshake,
} from "lucide-react";

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
        icon: Target,
        description:
            "Satisfacer a nuestros clientes con productos de alta gama Off Road y On Road, que lleven sus emociones y experiencias al límite en cada rodada.",
    },
    {
        number: "02",
        label: "Visión",
        title: "Nuestra dirección",
        icon: Eye,
        description:
            "Ser el mejor concesionario de vehículos todo terreno, roadsters y acuáticos en el país, fortalecidos por equipos de trabajo ampliamente capacitados en la gama de productos y con una cultura de satisfacción al cliente, generando así valor en todos los niveles de la organización.",
    },
];

const values = [
    {
        name: "COMPROMISO",
        icon: Handshake,
    },
    {
        name: "ÉTICA Y HONESTIDAD",
        icon: Scale,
    },
    {
        name: "MEJORA CONTINUA",
        icon: TrendingUp,
    },
    {
        name: "EXCELENCIA",
        icon: Award,
    },
    {
        name: "COMPETITIVIDAD",
        icon: Trophy,
    },
    {
        name: "RESPONSABILIDAD",
        icon: ShieldCheck,
    },
    {
        name: "PROFESIONALISMO",
        icon: BriefcaseBusiness,
    },
    {
        name: "ATENCIÓN AL CLIENTE",
        icon: Headphones,
    },
    {
        name: "RESPETO",
        icon: HeartHandshake,
    },
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

const experienceTypeLabels: Record<
    ExperienceType,
    string
> = {
    EVENTO: "Evento",
    RODADA: "Rodada",
    LANZAMIENTO: "Lanzamiento",
};

function formatExperienceDate(
    value?: Date | null
) {
    if (!value) {
        return "Fecha por confirmar";
    }

    return new Intl.DateTimeFormat(
        "es-MX",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    ).format(value);
}

export default async function GrupoRisePage() {

    const currentDate = new Date();

    const [
        publishedNews,
        publishedExperiences,
    ] = await Promise.all([
        prisma.newsArticle.findMany({
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
        }),

        prisma.riseExperience.findMany({
            where: {
                status:
                    ExperienceStatus.PUBLISHED,
            },

            orderBy: [
                {
                    featured: "desc",
                },
                {
                    sortOrder: "asc",
                },
                {
                    eventDate: "asc",
                },
                {
                    createdAt: "desc",
                },
            ],

            take: 3,
        }),
    ]);

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

    const featuredExperience =
        publishedExperiences.find(
            (experience) =>
                experience.featured
        ) ??
        publishedExperiences[0] ??
        null;

    const secondaryExperiences =
        publishedExperiences
            .filter(
                (experience) =>
                    experience.id !==
                    featuredExperience?.id
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

                            <div className="flex items-center justify-center lg:justify-end">
                                <div className="relative w-full max-w-[560px]">
                                    <Image
                                        src="/images/institutional/grupo-rise-15-anos.png"
                                        alt="Grupo RISE - Más de 18,000 clientes y 15 años nos respaldan"
                                        width={1080}
                                        height={1080}
                                        priority
                                        className="h-auto w-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Misión y visión */}
                <section className="border-b border-[var(--home-border)] bg-[#eef0ee]">
                    <div className="public-container py-16 md:py-24">
                        <div className="grid gap-8 border-b border-[var(--home-border)] pb-9 lg:grid-cols-[1fr_0.55fr] lg:items-end">
                            <div>
                                <p className="public-eyebrow">
                                    Identidad institucional
                                </p>

                                <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[var(--public-ink)] md:text-5xl lg:text-6xl">
                                    Misión y visión que definen nuestro camino.
                                </h2>
                            </div>

                            <p className="max-w-md text-sm leading-7 text-[var(--public-muted)] lg:justify-self-end">
                                Nuestra forma de trabajar parte de una visión clara,
                                una atención cercana al cliente y principios que orientan
                                cada experiencia.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-5 lg:grid-cols-2">
                            {institutionalBlocks.map((block) => {
                                const Icon = block.icon;

                                return (
                                    <article
                                        key={block.label}
                                        className="group relative min-h-[370px] overflow-hidden border border-[var(--home-border)] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[var(--home-border-strong)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-10"
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                                        <span className="pointer-events-none absolute right-7 top-5 text-[82px] font-black leading-none tracking-[-0.08em] text-[#192a3a]/[0.05] md:right-9 md:text-[110px]">
                                            {block.number}
                                        </span>

                                        <div className="relative flex h-full flex-col">
                                            <div className="flex items-center justify-between gap-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-10 items-center justify-center border border-[#192a3a]/10 bg-[#192a3a]/[0.035] text-[#192a3a]/80 transition-all duration-300 group-hover:border-[#192a3a]/20 group-hover:bg-[#192a3a]/[0.06] group-hover:text-[#192a3a] group-hover:scale-[1.03]">
                                                        <Icon
                                                            size={18}
                                                            strokeWidth={1.7}
                                                        />
                                                    </span>

                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--public-accent)]">
                                                        {block.label}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-auto max-w-xl pt-24">
                                                <h3 className="text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-4xl">
                                                    {block.title}
                                                </h3>

                                                <p className="mt-6 text-base leading-8 text-[var(--public-muted)]">
                                                    {block.description}
                                                </p>

                                                <div className="mt-8 border-t border-[var(--home-border)] pt-5">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--public-muted-light)]">
                                                        Grupo RISE
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Valores */}
                <section className="relative overflow-hidden bg-[#151a1f] text-white">
                    {/* Decoración de fondo */}
                    <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[380px] w-[380px] rounded-full bg-white/[0.025] blur-3xl" />

                    <div className="public-container relative py-16 md:py-24">
                        <div className="grid gap-8 border-b border-white/10 pb-9 lg:grid-cols-[1fr_0.55fr] lg:items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                                    Nuestros valores
                                </p>

                                <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] text-white md:text-5xl lg:text-6xl">
                                    Principios que representan a Grupo RISE.
                                </h2>
                            </div>

                            <p className="max-w-md text-sm leading-7 text-white/50 lg:justify-self-end">
                                Principios que guían nuestra forma de trabajar,
                                atender a nuestros clientes y generar valor en todos
                                los niveles de la organización.
                            </p>
                        </div>

                        <div className="mt-10 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
                            {values.map((value, index) => {
                                const Icon = value.icon;

                                return (
                                    <article
                                        key={value.name}
                                        className="group relative min-h-[190px] overflow-hidden border-b border-r border-white/10 p-6 transition duration-300 hover:bg-white/[0.025] md:min-h-[210px] md:p-8"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-[11px] font-black tracking-[0.18em] text-white/35">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>

                                            <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.02] text-white/40 transition-all duration-300 group-hover:border-white/15 group-hover:bg-white/[0.035] group-hover:text-white/70 group-hover:scale-[1.03]">
                                                <Icon
                                                    size={17}
                                                    strokeWidth={1.6}
                                                />
                                            </span>
                                        </div>

                                        <div className="mt-14 md:mt-16">
                                            <p className="max-w-[280px] text-xl font-black uppercase leading-tight tracking-[-0.025em] text-white md:text-2xl">
                                                {value.name}
                                            </p>

                                            <div className="mt-5 h-px w-8 bg-white/15 transition-all duration-300 group-hover:w-12 group-hover:bg-white/30" />
                                        </div>
                                    </article>
                                );
                            })}
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

                {/* Eventos y experiencias */}
                <section
                    id="eventos"
                    className="border-b border-[var(--home-border)] bg-[var(--home-surface-alt)]"
                >
                    <div className="public-container py-16 md:py-24">
                        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
                            {/* Encabezado */}
                            <div>
                                <p className="public-eyebrow">
                                    Eventos y experiencias
                                </p>

                                <h2 className="public-title mt-5 text-4xl md:text-6xl">
                                    Experiencias que se viven.
                                </h2>

                                <p className="mt-6 max-w-md text-base leading-7 text-[var(--public-muted)]">
                                    Rodadas, exhibiciones,
                                    lanzamientos y actividades
                                    especiales que forman parte
                                    de la experiencia Grupo RISE.
                                </p>
                            </div>

                            <div>
                                {!featuredExperience ? (
                                    <div className="border border-[var(--home-border)] bg-[var(--home-card)] px-6 py-16 text-center shadow-[0_10px_28px_rgba(18,24,28,0.04)] md:px-10 md:py-20">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                            Eventos y experiencias
                                        </p>

                                        <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--public-ink)] md:text-3xl">
                                            Por el momento no hay experiencias disponibles.
                                        </h3>

                                        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--public-muted)]">
                                            Próximamente encontrarás aquí rodadas,
                                            lanzamientos, exhibiciones y actividades
                                            especiales de Grupo RISE.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Experiencia principal */}
                                        <article className="group relative min-h-[430px] overflow-hidden bg-[var(--public-header)] text-white shadow-[0_22px_55px_rgba(18,24,28,0.18)] md:col-span-2">
                                            {featuredExperience.imageUrl && (
                                                <img
                                                    src={featuredExperience.imageUrl}
                                                    alt={
                                                        featuredExperience.imageAlt ||
                                                        featuredExperience.title
                                                    }
                                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                                />
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/20" />

                                            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--public-accent)]" />

                                            <div className="relative flex min-h-[430px] flex-col justify-between p-8 md:p-10">
                                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
                                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/65">
                                                        {featuredExperience.featured
                                                            ? "Experiencia destacada"
                                                            : experienceTypeLabels[
                                                            featuredExperience.type
                                                            ]}
                                                    </span>

                                                    <span className="border border-white/20 bg-black/20 px-4 py-2 text-xs font-bold text-white/75 backdrop-blur-sm">
                                                        {
                                                            experienceTypeLabels[
                                                            featuredExperience.type
                                                            ]
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-20 max-w-2xl">
                                                    <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                                                        {featuredExperience.title}
                                                    </h3>

                                                    <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
                                                        {featuredExperience.description}
                                                    </p>
                                                </div>

                                                <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs font-bold uppercase tracking-[0.12em] text-white/60 sm:flex-row sm:items-center sm:justify-between">
                                                    <span>
                                                        {formatExperienceDate(
                                                            featuredExperience.eventDate
                                                        )}
                                                    </span>

                                                    <span>
                                                        {featuredExperience.location ||
                                                            "Ubicación por confirmar"}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>

                                        {/* Experiencias secundarias */}
                                        {secondaryExperiences.map((experience) => (
                                            <article
                                                key={experience.id}
                                                className="group relative min-h-[260px] overflow-hidden border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_10px_28px_rgba(18,24,28,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--home-shadow)]"
                                            >
                                                {experience.imageUrl && (
                                                    <img
                                                        src={experience.imageUrl}
                                                        alt={
                                                            experience.imageAlt ||
                                                            experience.title
                                                        }
                                                        className="absolute inset-0 h-full w-full object-cover opacity-[0.14] transition duration-500 group-hover:scale-[1.025] group-hover:opacity-[0.2]"
                                                    />
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--home-card)] via-[var(--home-card)]/95 to-[var(--home-card)]/70" />

                                                <div className="relative flex min-h-[260px] flex-col justify-between p-7">
                                                    <div>
                                                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
                                                            {
                                                                experienceTypeLabels[
                                                                experience.type
                                                                ]
                                                            }
                                                        </span>

                                                        <h3 className="mt-8 text-2xl font-bold tracking-[-0.03em] text-[var(--public-ink)]">
                                                            {experience.title}
                                                        </h3>

                                                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--public-muted)]">
                                                            {experience.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-8 flex flex-col gap-2 border-t border-[var(--home-border)] pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--public-muted-light)]">
                                                        <span>
                                                            {formatExperienceDate(
                                                                experience.eventDate
                                                            )}
                                                        </span>

                                                        <span>
                                                            {experience.location ||
                                                                "Ubicación por confirmar"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}