import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { LucideIcon } from "lucide-react";
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    Eye,
    ImageIcon,
    Landmark,
    Layers3,
    MapPin,
    Plus,
    Sparkles,
} from "lucide-react";
import {
    ExperienceStatus,
    ExperienceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const statusLabels: Record<
    ExperienceStatus,
    string
> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    ARCHIVED: "Archivada",
};

const statusClasses: Record<
    ExperienceStatus,
    string
> = {
    DRAFT:
        "border-amber-200 bg-amber-50 text-amber-700",
    PUBLISHED:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    ARCHIVED:
        "border-slate-200 bg-slate-100 text-slate-600",
};

const typeLabels: Record<
    ExperienceType,
    string
> = {
    EVENTO: "Evento",
    RODADA: "Rodada",
    LANZAMIENTO: "Lanzamiento",
};

function formatDate(
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

function revalidateExperiencePaths() {
    revalidatePath("/admin/grupo-rise");
    revalidatePath("/grupo-rise");
}

async function changeExperienceStatus(
    formData: FormData
) {
    "use server";

    await requireAdmin();

    const experienceId = Number(
        formData.get("experienceId")
    );

    const requestedStatus = String(
        formData.get("status") ?? ""
    ) as ExperienceStatus;

    if (
        !Number.isInteger(experienceId) ||
        experienceId <= 0
    ) {
        return;
    }

    if (
        !Object.values(
            ExperienceStatus
        ).includes(requestedStatus)
    ) {
        return;
    }

    await prisma.riseExperience.update({
        where: {
            id: experienceId,
        },

        data: {
            status: requestedStatus,

            ...(requestedStatus !==
                ExperienceStatus.PUBLISHED
                ? {
                    featured: false,
                }
                : {}),
        },
    });

    revalidateExperiencePaths();
}

async function toggleFeatured(
    experienceId: number
) {
    "use server";

    await requireAdmin();

    if (
        !Number.isInteger(experienceId) ||
        experienceId <= 0
    ) {
        return;
    }

    const experience =
        await prisma.riseExperience.findUnique({
            where: {
                id: experienceId,
            },

            select: {
                id: true,
                featured: true,
                status: true,
            },
        });

    if (!experience) {
        return;
    }

    if (
        experience.status !==
        ExperienceStatus.PUBLISHED
    ) {
        return;
    }

    if (experience.featured) {
        await prisma.riseExperience.update({
            where: {
                id: experience.id,
            },

            data: {
                featured: false,
            },
        });
    } else {
        await prisma.$transaction([
            prisma.riseExperience.updateMany({
                where: {
                    featured: true,
                },

                data: {
                    featured: false,
                },
            }),

            prisma.riseExperience.update({
                where: {
                    id: experience.id,
                },

                data: {
                    featured: true,
                },
            }),
        ]);
    }

    revalidateExperiencePaths();
}

type StatTone =
    | "navy"
    | "emerald"
    | "amber"
    | "violet";

const statToneClasses: Record<
    StatTone,
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

function ExperienceStatCard({
    icon: Icon,
    label,
    value,
    description,
    tone,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    description: string;
    tone: StatTone;
}) {
    return (
        <article className="rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
            <span
                className={`grid h-11 w-11 place-items-center rounded-xl border ${statToneClasses[tone]}`}
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

function ExperienceStatusBadge({
    status,
}: {
    status: ExperienceStatus;
}) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClasses[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

export default async function AdminGrupoRisePage() {
    await requireAdmin();

    const experiences =
        await prisma.riseExperience.findMany({
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
        });

    const totalExperiences =
        experiences.length;

    const publishedCount =
        experiences.filter(
            (experience) =>
                experience.status ===
                ExperienceStatus.PUBLISHED
        ).length;

    const draftCount =
        experiences.filter(
            (experience) =>
                experience.status ===
                ExperienceStatus.DRAFT
        ).length;

    const archivedCount =
        experiences.filter(
            (experience) =>
                experience.status ===
                ExperienceStatus.ARCHIVED
        ).length;

    const featuredExperience =
        experiences.find(
            (experience) =>
                experience.featured
        );

    const regularExperiences =
        experiences.filter(
            (experience) =>
                experience.id !==
                featuredExperience?.id
        );

    return (
        <div className="pb-10">
            {/* Encabezado */}
            <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

                <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
                            <Landmark size={15} />

                            Grupo RISE
                        </div>

                        <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
                            Experiencias que se viven
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
                            Administra eventos,
                            rodadas y lanzamientos que
                            aparecerán dentro de la
                            sección institucional de
                            Grupo RISE.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <AdminButton
                            href="/grupo-rise#eventos"
                            target="_blank"
                            rel="noreferrer"
                            variant="ghost"
                            className="border-white/15 !text-white hover:border-white/25 hover:bg-white/10 hover:!text-white"
                        >
                            <Eye size={16} />
                            Ver página pública
                        </AdminButton>

                        <AdminButton
                            href="/admin/grupo-rise/nueva"
                            variant="secondary"
                            className="border-white bg-white !text-[#192a3a] hover:border-[#eef0ee] hover:bg-[#eef0ee]"
                        >
                            <Plus size={16} />
                            Nueva experiencia
                        </AdminButton>
                    </div>
                </div>
            </section>

            {/* Estadísticas */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ExperienceStatCard
                    icon={Layers3}
                    label="Registradas"
                    value={totalExperiences}
                    description="Total de experiencias creadas."
                    tone="navy"
                />

                <ExperienceStatCard
                    icon={CheckCircle2}
                    label="Publicadas"
                    value={publishedCount}
                    description="Visibles en el sitio público."
                    tone="emerald"
                />

                <ExperienceStatCard
                    icon={Clock3}
                    label="Borradores"
                    value={draftCount}
                    description="Pendientes de publicación."
                    tone="amber"
                />

                <ExperienceStatCard
                    icon={Archive}
                    label="Archivadas"
                    value={archivedCount}
                    description="Experiencias fuera de circulación."
                    tone="violet"
                />
            </section>

            {/* Experiencia destacada */}
            {featuredExperience && (
                <section className="mt-6 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
                        <div className="flex items-start justify-between gap-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="h-px w-7 bg-[#192a3a]" />

                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                                        Experiencia principal
                                    </p>
                                </div>

                                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                                    Evento destacado
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Este contenido ocupará el
                                    bloque principal de
                                    “Experiencias que se viven”.
                                </p>
                            </div>

                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
                                <Sparkles size={20} />
                            </span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                        {/* Imagen */}
                        <div className="relative min-h-[280px] overflow-hidden bg-[#e7edf1] lg:min-h-[360px]">
                            {featuredExperience.imageUrl ? (
                                <img
                                    src={
                                        featuredExperience.imageUrl
                                    }
                                    alt={
                                        featuredExperience.imageAlt ||
                                        featuredExperience.title
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
                                            Sin imagen
                                        </p>
                                    </div>
                                </div>
                            )}

                            <span className="absolute left-4 top-4 rounded-xl bg-[#192a3a] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                                Destacada
                            </span>
                        </div>

                        {/* Información */}
                        <div className="flex flex-col justify-between p-6 md:p-8">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <ExperienceStatusBadge
                                        status={
                                            featuredExperience.status
                                        }
                                    />

                                    <span className="rounded-full border border-[#192a3a]/10 bg-[#e7edf1] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#192a3a]">
                                        {
                                            typeLabels[
                                            featuredExperience
                                                .type
                                            ]
                                        }
                                    </span>
                                </div>

                                <h3 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#192a3a] md:text-4xl">
                                    {
                                        featuredExperience.title
                                    }
                                </h3>

                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                                    {
                                        featuredExperience.description
                                    }
                                </p>

                                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays
                                            size={15}
                                        />

                                        {formatDate(
                                            featuredExperience.eventDate
                                        )}
                                    </span>

                                    <span className="inline-flex items-center gap-2">
                                        <MapPin size={15} />

                                        {featuredExperience.location ||
                                            "Ubicación por confirmar"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                                <AdminButton
                                    href={`/admin/grupo-rise/${featuredExperience.id}/editar`}
                                    variant="primary"
                                >
                                    <Edit3 size={15} />
                                    Editar experiencia
                                </AdminButton>

                                <form
                                    action={toggleFeatured.bind(
                                        null,
                                        featuredExperience.id
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
                                Gestión de contenido
                            </p>
                        </div>

                        <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#192a3a] md:text-3xl">
                            Experiencias
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Publica, archiva, edita o
                            selecciona la experiencia
                            principal.
                        </p>
                    </div>

                    <span className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-500">
                        {totalExperiences} experiencia
                        {totalExperiences === 1
                            ? ""
                            : "s"}
                    </span>
                </div>

                {/* Sin registros */}
                {experiences.length === 0 ? (
                    <div className="mt-5 overflow-hidden rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.03)]">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7edf1] text-[#192a3a]">
                            <Landmark size={25} />
                        </span>

                        <h3 className="mt-5 text-xl font-black text-[#192a3a]">
                            No hay experiencias registradas
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Crea el primer evento,
                            rodada o lanzamiento para
                            comenzar a alimentar esta
                            sección de Grupo RISE.
                        </p>

                        <Link
                            href="/admin/grupo-rise/nueva"
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-xs font-black !text-white transition hover:bg-[#29465c]"
                        >
                            <Plus size={16} />

                            Crear primera experiencia
                        </Link>
                    </div>
                ) : regularExperiences.length ===
                    0 ? (
                    <div className="mt-5 rounded-[22px] border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500">
                        La única experiencia registrada
                        actualmente es la destacada.
                    </div>
                ) : (
                    <div className="mt-5 grid gap-5 2xl:grid-cols-2">
                        {regularExperiences.map(
                            (experience) => (
                                <article
                                    key={experience.id}
                                    className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                                >
                                    <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                                        {/* Imagen */}
                                        <div className="relative min-h-[190px] overflow-hidden bg-[#e7edf1]">
                                            {experience.imageUrl ? (
                                                <img
                                                    src={
                                                        experience.imageUrl
                                                    }
                                                    alt={
                                                        experience.imageAlt ||
                                                        experience.title
                                                    }
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 grid place-items-center text-slate-400">
                                                    <ImageIcon
                                                        size={30}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Datos */}
                                        <div className="min-w-0 p-5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <ExperienceStatusBadge
                                                    status={
                                                        experience.status
                                                    }
                                                />

                                                <span className="rounded-full bg-[#e7edf1] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#192a3a]">
                                                    {
                                                        typeLabels[
                                                        experience
                                                            .type
                                                        ]
                                                    }
                                                </span>
                                            </div>

                                            <h3 className="mt-4 line-clamp-2 text-xl font-black leading-tight tracking-[-0.025em] text-[#192a3a]">
                                                {experience.title}
                                            </h3>

                                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                                                {
                                                    experience.description
                                                }
                                            </p>

                                            <div className="mt-4 grid gap-2 text-[10px] font-bold text-slate-400">
                                                <span className="inline-flex items-center gap-2">
                                                    <CalendarDays
                                                        size={13}
                                                    />

                                                    {formatDate(
                                                        experience.eventDate
                                                    )}
                                                </span>

                                                <span className="inline-flex items-center gap-2">
                                                    <MapPin
                                                        size={13}
                                                    />

                                                    {experience.location ||
                                                        "Ubicación por confirmar"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="border-t border-slate-100 bg-[#f8fafb] p-4">
                                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                                            <form
                                                action={
                                                    changeExperienceStatus
                                                }
                                                className="grid gap-2 sm:grid-cols-[minmax(180px,240px)_auto] sm:items-end"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="experienceId"
                                                    value={
                                                        experience.id
                                                    }
                                                />

                                                <label className="block">
                                                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                        Estado
                                                    </span>

                                                    <select
                                                        name="status"
                                                        defaultValue={
                                                            experience.status
                                                        }
                                                        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-[#192a3a] focus:ring-2 focus:ring-[#192a3a]/10"
                                                    >
                                                        <option
                                                            value={
                                                                ExperienceStatus.DRAFT
                                                            }
                                                        >
                                                            Borrador
                                                        </option>

                                                        <option
                                                            value={
                                                                ExperienceStatus.PUBLISHED
                                                            }
                                                        >
                                                            Publicada
                                                        </option>

                                                        <option
                                                            value={
                                                                ExperienceStatus.ARCHIVED
                                                            }
                                                        >
                                                            Archivada
                                                        </option>
                                                    </select>
                                                </label>

                                                <AdminButton
                                                    type="submit"
                                                    variant="secondary"
                                                    className="w-full sm:w-auto"
                                                >
                                                    <CheckCircle2
                                                        size={15}
                                                    />
                                                    Guardar estado
                                                </AdminButton>
                                            </form>

                                            <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                                                <form
                                                    action={toggleFeatured.bind(
                                                        null,
                                                        experience.id
                                                    )}
                                                >
                                                    <AdminButton
                                                        type="submit"
                                                        variant="ghost"
                                                        disabled={
                                                            experience.status !==
                                                            ExperienceStatus.PUBLISHED
                                                        }
                                                        title={
                                                            experience.status !==
                                                                ExperienceStatus.PUBLISHED
                                                                ? "La experiencia debe estar publicada para destacarla"
                                                                : "Marcar como experiencia destacada"
                                                        }
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <Sparkles
                                                            size={15}
                                                        />
                                                        Destacar
                                                    </AdminButton>
                                                </form>

                                                <AdminButton
                                                    href={`/admin/grupo-rise/${experience.id}/editar`}
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
                            )
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}