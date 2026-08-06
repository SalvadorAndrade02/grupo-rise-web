import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    Eye,
    FileText,
    ImageIcon,
    Layers3,
    Newspaper,
    Plus,
    Sparkles,
} from "lucide-react";
import { NewsStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const statusLabels: Record<NewsStatus, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    ARCHIVED: "Archivada",
};

const statusClasses: Record<NewsStatus, string> = {
    DRAFT:
        "border-amber-200 bg-amber-50 text-amber-700",
    PUBLISHED:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    ARCHIVED:
        "border-slate-200 bg-slate-100 text-slate-600",
};

function formatDate(value?: Date | null) {
    if (!value) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
    }).format(value);
}

function revalidateNewsPaths(slug?: string) {
    revalidatePath("/admin");
    revalidatePath("/admin/noticias");
    revalidatePath("/grupo-rise");
    revalidatePath("/");

    if (slug) {
        revalidatePath(
            `/grupo-rise/noticias/${slug}`
        );
    }
}

async function changeNewsStatus(
    formData: FormData
) {
    "use server";

    await requireAdmin();

    const articleId = Number(
        formData.get("articleId")
    );

    const requestedStatus = String(
        formData.get("status") ?? ""
    ) as NewsStatus;

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {
        return;
    }

    if (
        !Object.values(NewsStatus).includes(
            requestedStatus
        )
    ) {
        return;
    }

    const currentArticle =
        await prisma.newsArticle.findUnique({
            where: {
                id: articleId,
            },
            select: {
                slug: true,
                publishedAt: true,
            },
        });

    if (!currentArticle) {
        return;
    }

    await prisma.newsArticle.update({
        where: {
            id: articleId,
        },
        data: {
            status: requestedStatus,

            publishedAt:
                requestedStatus === NewsStatus.PUBLISHED
                    ? currentArticle.publishedAt ?? new Date()
                    : currentArticle.publishedAt,

            featured:
                requestedStatus === NewsStatus.PUBLISHED
                    ? undefined
                    : false,
        },
    });

    revalidateNewsPaths(
        currentArticle.slug
    );
}

async function toggleFeatured(
    articleId: number
) {
    "use server";

    await requireAdmin();

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {
        return;
    }

    const article =
        await prisma.newsArticle.findUnique({
            where: {
                id: articleId,
            },
            select: {
                id: true,
                slug: true,
                featured: true,
            },
        });

    if (!article) {
        return;
    }

    if (article.featured) {
        await prisma.newsArticle.update({
            where: {
                id: articleId,
            },
            data: {
                featured: false,
            },
        });
    } else {
        await prisma.$transaction([
            prisma.newsArticle.updateMany({
                where: {
                    featured: true,
                },
                data: {
                    featured: false,
                },
            }),

            prisma.newsArticle.update({
                where: {
                    id: articleId,
                },
                data: {
                    featured: true,
                },
            }),
        ]);
    }

    revalidateNewsPaths(article.slug);
}

type NewsStatTone =
    | "navy"
    | "emerald"
    | "amber"
    | "violet";

const newsStatToneClasses: Record<
    NewsStatTone,
    string
> = {
    navy:
        "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
    emerald:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber:
        "border-amber-100 bg-amber-50 text-amber-700",
    violet:
        "border-violet-100 bg-violet-50 text-violet-700",
};

function NewsStatCard({
    icon: Icon,
    label,
    value,
    description,
    tone,
}: {
    icon: typeof Layers3;
    label: string;
    value: number;
    description: string;
    tone: NewsStatTone;
}) {
    return (
        <article className="rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
            <span
                className={`grid h-11 w-11 place-items-center rounded-xl border ${newsStatToneClasses[tone]}`}
            >
                <Icon size={20} />
            </span>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>

            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#192a3a]">
                {value}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                {description}
            </p>
        </article>
    );
}

function NewsStatusBadge({
    status,
}: {
    status: NewsStatus;
}) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClasses[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

export default async function AdminNewsPage() {
    await requireAdmin();

    const articles =
        await prisma.newsArticle.findMany({
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
        });

    const totalArticles = articles.length;

    const publishedCount = articles.filter(
        (article) =>
            article.status ===
            NewsStatus.PUBLISHED
    ).length;

    const draftCount = articles.filter(
        (article) =>
            article.status === NewsStatus.DRAFT
    ).length;

    const archivedCount = articles.filter(
        (article) =>
            article.status ===
            NewsStatus.ARCHIVED
    ).length;

    const featuredArticle = articles.find(
        (article) => article.featured
    );
    const regularArticles = articles.filter(
        (article) =>
            article.id !== featuredArticle?.id
    );

    return (
        <div className="pb-10">
            {/* Encabezado */}
            <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

                <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
                            <Newspaper size={15} />
                            Contenido institucional
                        </div>

                        <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
                            Noticias
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
                            Administra las publicaciones, novedades y comunicados que
                            aparecerán en la sección pública de Grupo RISE.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <AdminButton
                            href="/grupo-rise"
                            target="_blank"
                            rel="noreferrer"
                            variant="ghost"
                            className="border-white/15 !text-white hover:border-white/25 hover:bg-white/10 hover:!text-white"
                        >
                            <Eye size={16} />
                            Ver página pública
                        </AdminButton>

                        <AdminButton
                            href="/admin/noticias/nueva"
                            variant="secondary"
                            className="border-white bg-white !text-[#192a3a] hover:border-[#eef0ee] hover:bg-[#eef0ee]"
                        >
                            <Plus size={16} />
                            Nueva noticia
                        </AdminButton>
                    </div>
                </div>
            </section>

            {/* Estadísticas */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <NewsStatCard
                    icon={FileText}
                    label="Noticias registradas"
                    value={totalArticles}
                    description="Total de publicaciones creadas."
                    tone="navy"
                />

                <NewsStatCard
                    icon={CheckCircle2}
                    label="Publicadas"
                    value={publishedCount}
                    description="Noticias visibles en el sitio."
                    tone="emerald"
                />

                <NewsStatCard
                    icon={Clock3}
                    label="Borradores"
                    value={draftCount}
                    description="Contenido pendiente de publicar."
                    tone="amber"
                />

                <NewsStatCard
                    icon={Archive}
                    label="Archivadas"
                    value={archivedCount}
                    description="Publicaciones fuera de circulación."
                    tone="violet"
                />
            </section>

            {/* Destacada */}
            {featuredArticle && (
                <section className="mt-6 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
                        <div className="flex items-start justify-between gap-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="h-px w-7 bg-[#192a3a]" />

                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                                        Publicación principal
                                    </p>
                                </div>

                                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                                    Noticia destacada
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Esta publicación ocupará el espacio principal dentro de
                                    la página pública de Grupo RISE.
                                </p>
                            </div>

                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
                                <Sparkles size={20} />
                            </span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                        <div className="relative min-h-[270px] overflow-hidden bg-[#e7edf1] lg:min-h-[340px]">
                            {featuredArticle.coverImageUrl ? (
                                <img
                                    src={featuredArticle.coverImageUrl}
                                    alt={
                                        featuredArticle.coverImageAlt ||
                                        featuredArticle.title
                                    }
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 grid place-items-center text-slate-400">
                                    <div className="text-center">
                                        <ImageIcon
                                            size={40}
                                            className="mx-auto"
                                        />

                                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em]">
                                            Sin imagen de portada
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="absolute left-4 top-4 rounded-xl bg-[#192a3a] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                                Destacada
                            </div>
                        </div>

                        <div className="flex flex-col justify-between p-6 md:p-8">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <NewsStatusBadge
                                        status={featuredArticle.status}
                                    />

                                    <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <CalendarDays size={14} />

                                        {formatDate(
                                            featuredArticle.publishedAt ??
                                            featuredArticle.createdAt
                                        )}
                                    </span>
                                </div>

                                <h3 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#192a3a] md:text-4xl">
                                    {featuredArticle.title}
                                </h3>

                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                                    {featuredArticle.excerpt}
                                </p>

                                {featuredArticle.authorName && (
                                    <p className="mt-5 text-xs font-bold text-slate-400">
                                        Autor: {featuredArticle.authorName}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                                <AdminButton
                                    href={`/admin/noticias/${featuredArticle.id}/editar`}
                                    variant="primary"
                                >
                                    <Edit3 size={15} />
                                    Editar noticia
                                </AdminButton>

                                <form
                                    action={toggleFeatured.bind(
                                        null,
                                        featuredArticle.id
                                    )}
                                >
                                    <AdminButton
                                        type="submit"
                                        variant="secondary"
                                        className="w-full sm:w-auto"
                                    >
                                        <Sparkles size={15} />
                                        Quitar destacada
                                    </AdminButton>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Listado */}
            <section className="mt-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-7 bg-[#192a3a]" />

                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                                Gestión editorial
                            </p>
                        </div>

                        <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#192a3a] md:text-3xl">
                            Publicaciones
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Revisa, publica, archiva o selecciona la noticia principal.
                        </p>
                    </div>

                    <span className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-500">
                        {articles.length} publicación
                        {articles.length === 1 ? "" : "es"}
                    </span>
                </div>

                {articles.length === 0 ? (
                    <div className="mt-5 overflow-hidden rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.03)]">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7edf1] text-[#192a3a]">
                            <Newspaper size={25} />
                        </span>

                        <h3 className="mt-5 text-xl font-black text-[#192a3a]">
                            No hay noticias registradas
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Crea la primera publicación para comenzar a mostrar novedades
                            dentro de la página de Grupo RISE.
                        </p>

                        <Link
                            href="/admin/noticias/nueva"
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black text-white transition hover:bg-[#29465c]"
                        >
                            <Plus size={16} className="text-white" />
                            <span className="text-white">Crear primera noticia</span>
                        </Link>
                    </div>
                ) : regularArticles.length === 0 ? (
                    <div className="mt-5 rounded-[22px] border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500">
                        La única publicación registrada actualmente es la noticia
                        destacada.
                    </div>
                ) : (
                    <div className="mt-5 grid gap-5 2xl:grid-cols-2">
                        {regularArticles.map((article) => (
                            <article
                                key={article.id}
                                className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                            >
                                <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                                    <div className="relative min-h-[190px] overflow-hidden bg-[#e7edf1]">
                                        {article.coverImageUrl ? (
                                            <img
                                                src={article.coverImageUrl}
                                                alt={
                                                    article.coverImageAlt ||
                                                    article.title
                                                }
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 grid place-items-center text-slate-400">
                                                <ImageIcon size={30} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 p-5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <NewsStatusBadge
                                                status={article.status}
                                            />

                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <CalendarDays size={13} />

                                                {formatDate(
                                                    article.publishedAt ??
                                                    article.createdAt
                                                )}
                                            </span>
                                        </div>

                                        <h3 className="mt-4 line-clamp-2 text-xl font-black leading-tight tracking-[-0.025em] text-[#192a3a]">
                                            {article.title}
                                        </h3>

                                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                                            {article.excerpt}
                                        </p>

                                        <p className="mt-4 truncate text-[10px] font-bold text-slate-400">
                                            /grupo-rise/noticias/{article.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 bg-[#f8fafb] p-4">
                                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                                        {/* Cambio de estado */}
                                        <form
                                            action={changeNewsStatus}
                                            className="grid gap-2 sm:grid-cols-[minmax(180px,240px)_auto] sm:items-end"
                                        >
                                            <input
                                                type="hidden"
                                                name="articleId"
                                                value={article.id}
                                            />

                                            <label className="block">
                                                <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                    Estado
                                                </span>

                                                <select
                                                    name="status"
                                                    defaultValue={article.status}
                                                    aria-label={`Estado de ${article.title}`}
                                                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-[#192a3a] focus:ring-2 focus:ring-[#192a3a]/10"
                                                >
                                                    <option value={NewsStatus.DRAFT}>
                                                        Borrador
                                                    </option>

                                                    <option value={NewsStatus.PUBLISHED}>
                                                        Publicada
                                                    </option>

                                                    <option value={NewsStatus.ARCHIVED}>
                                                        Archivada
                                                    </option>
                                                </select>
                                            </label>

                                            <AdminButton
                                                type="submit"
                                                variant="secondary"
                                                className="w-full sm:w-auto"
                                            >
                                                <CheckCircle2 size={15} />
                                                Guardar estado
                                            </AdminButton>
                                        </form>

                                        {/* Acciones */}
                                        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                                            <form
                                                action={toggleFeatured.bind(
                                                    null,
                                                    article.id
                                                )}
                                            >
                                                <AdminButton
                                                    type="submit"
                                                    variant="ghost"
                                                    disabled={
                                                        article.status !==
                                                        NewsStatus.PUBLISHED
                                                    }
                                                    title={
                                                        article.status !==
                                                            NewsStatus.PUBLISHED
                                                            ? "La noticia debe estar publicada para destacarla"
                                                            : "Marcar como noticia destacada"
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    <Sparkles size={15} />
                                                    Destacar
                                                </AdminButton>
                                            </form>

                                            <AdminButton
                                                href={`/admin/noticias/${article.id}/editar`}
                                                variant="primary"
                                                className="w-full sm:w-auto"
                                            >
                                                <Edit3 size={15} />
                                                Editar
                                            </AdminButton>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}