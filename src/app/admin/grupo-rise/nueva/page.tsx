import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
    CalendarDays,
    FileText,
    ImageIcon,
    Landmark,
    MapPin,
    Save,
    Sparkles,
    Upload,
} from "lucide-react";
import {
    ExperienceStatus,
    ExperienceType,
} from "@prisma/client";

import {
    AdminAlert,
    AdminButton,
    AdminHero,
    AdminInput,
    AdminSection,
    AdminSelect,
    AdminSummaryCard,
    AdminTextarea,
    AdminToggleOption,
} from "@/components/admin/ui";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

import {
    deleteExperienceImage,
    saveExperienceImage,
} from "@/lib/experience-uploads";

export const dynamic =
    "force-dynamic";

type NewExperiencePageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

function getTextValue(
    formData: FormData,
    name: string
) {
    return String(
        formData.get(name) ?? ""
    ).trim();
}

function getOptionalTextValue(
    formData: FormData,
    name: string
) {
    const value =
        getTextValue(
            formData,
            name
        );

    return value || null;
}

function getExperienceType(
    value: FormDataEntryValue | null
) {
    const type = String(
        value ?? ExperienceType.EVENTO
    );

    return Object.values(
        ExperienceType
    ).includes(type as ExperienceType)
        ? (type as ExperienceType)
        : ExperienceType.EVENTO;
}

function getExperienceStatus(
    value: FormDataEntryValue | null
) {
    const status = String(
        value ??
        ExperienceStatus.DRAFT
    );

    return Object.values(
        ExperienceStatus
    ).includes(
        status as ExperienceStatus
    )
        ? (status as ExperienceStatus)
        : ExperienceStatus.DRAFT;
}

function parseOptionalDate(
    value: string
) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}

function redirectError(
    message: string
): never {
    redirect(
        `/admin/grupo-rise/nueva?error=${encodeURIComponent(
            message
        )}`
    );
}

async function safeDelete(
    url?: string | null
) {
    if (!url) {
        return;
    }

    try {
        await deleteExperienceImage(
            url
        );
    } catch (error) {
        console.error(
            "No se pudo eliminar la imagen:",
            error
        );
    }
}

async function createExperience(
    formData: FormData
) {
    "use server";

    await requireAdmin();

    const type = getExperienceType(
        formData.get("type")
    );

    const title = getTextValue(
        formData,
        "title"
    );

    const description =
        getTextValue(
            formData,
            "description"
        );

    const location =
        getOptionalTextValue(
            formData,
            "location"
        );

    const imageAlt =
        getOptionalTextValue(
            formData,
            "imageAlt"
        );

    const eventDateValue =
        getTextValue(
            formData,
            "eventDate"
        );

    const status =
        getExperienceStatus(
            formData.get("status")
        );

    const featuredRequested =
        formData.get("featured") ===
        "on";

    const sortOrderRaw =
        Number(
            formData.get("sortOrder") ?? 0
        );

    const sortOrder =
        Number.isFinite(sortOrderRaw)
            ? Math.max(
                0,
                Math.trunc(sortOrderRaw)
            )
            : 0;

    if (!title) {
        redirectError(
            "El título es obligatorio."
        );
    }

    if (title.length < 4) {
        redirectError(
            "El título debe tener al menos 4 caracteres."
        );
    }

    if (!description) {
        redirectError(
            "La descripción es obligatoria."
        );
    }

    if (description.length < 15) {
        redirectError(
            "La descripción debe tener al menos 15 caracteres."
        );
    }

    const eventDate =
        parseOptionalDate(
            eventDateValue
        );

    if (
        eventDateValue &&
        !eventDate
    ) {
        redirectError(
            "La fecha del evento no es válida."
        );
    }

    const featured =
        status ===
        ExperienceStatus.PUBLISHED &&
        featuredRequested;

    let uploadedImageUrl:
        | string
        | null = null;

    try {
        uploadedImageUrl =
            await saveExperienceImage(
                formData.get("imageFile")
            );
    } catch (error) {
        redirectError(
            error instanceof Error
                ? error.message
                : "No se pudo guardar la imagen."
        );
    }

    try {
        const data = {
            type,
            title,
            description,
            eventDate,
            location,
            imageUrl:
                uploadedImageUrl,
            imageAlt,
            status,
            featured,
            sortOrder,
        };

        if (featured) {
            await prisma.$transaction([
                prisma.riseExperience.updateMany({
                    where: {
                        featured: true,
                    },
                    data: {
                        featured: false,
                    },
                }),

                prisma.riseExperience.create({
                    data,
                }),
            ]);
        } else {
            await prisma.riseExperience.create({
                data,
            });
        }
    } catch (error) {
        await safeDelete(
            uploadedImageUrl
        );

        console.error(
            "Error creando experiencia:",
            error
        );

        redirectError(
            "No se pudo registrar la experiencia."
        );
    }

    revalidatePath(
        "/admin/grupo-rise"
    );

    revalidatePath(
        "/grupo-rise"
    );

    redirect(
        "/admin/grupo-rise"
    );
}

export default async function NewExperiencePage({
    searchParams,
}: NewExperiencePageProps) {
    await requireAdmin();

    const query =
        await searchParams;

    return (
        <div className="pb-10">
            <AdminHero
                eyebrow="Grupo RISE"
                title="Nueva experiencia"
                description="Registra eventos, rodadas y lanzamientos que formarán parte de Experiencias que se viven."
                icon={Landmark}
                backHref="/admin/grupo-rise"
                backLabel="Volver a experiencias"
            />

            {query.error && (
                <AdminAlert
                    variant="error"
                    className="mt-5"
                >
                    {query.error}
                </AdminAlert>
            )}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AdminSummaryCard
                    icon={FileText}
                    label="Contenido"
                    value="Título y descripción"
                    description="Información principal."
                />

                <AdminSummaryCard
                    icon={CalendarDays}
                    label="Evento"
                    value="Fecha"
                    description="Puede quedar por confirmar."
                    tone="blue"
                />

                <AdminSummaryCard
                    icon={MapPin}
                    label="Ubicación"
                    value="Lugar"
                    description="Campo opcional."
                    tone="emerald"
                />

                <AdminSummaryCard
                    icon={ImageIcon}
                    label="Imagen"
                    value="Recurso visual"
                    description="Imagen principal de la experiencia."
                    tone="violet"
                />
            </section>

            <form
                action={createExperience}
                className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
            >
                <div className="min-w-0 space-y-6">
                    <AdminSection
                        icon={FileText}
                        eyebrow="Información"
                        title="Datos de la experiencia"
                        description="Define el tipo y contenido que aparecerá en la página pública."
                    >
                        <div className="grid gap-5">
                            <AdminSelect
                                label="Tipo"
                                name="type"
                                defaultValue={
                                    ExperienceType.EVENTO
                                }
                                required
                            >
                                <option
                                    value={
                                        ExperienceType.EVENTO
                                    }
                                >
                                    Evento
                                </option>

                                <option
                                    value={
                                        ExperienceType.RODADA
                                    }
                                >
                                    Rodada
                                </option>

                                <option
                                    value={
                                        ExperienceType.LANZAMIENTO
                                    }
                                >
                                    Lanzamiento
                                </option>
                            </AdminSelect>

                            <AdminInput
                                label="Título"
                                name="title"
                                required
                                minLength={4}
                                maxLength={180}
                                placeholder="Ej. Rodada Indian Motorcycle Monterrey"
                            />

                            <AdminTextarea
                                label="Descripción"
                                name="description"
                                required
                                minLength={15}
                                rows={6}
                                placeholder="Describe brevemente la experiencia..."
                            />
                        </div>
                    </AdminSection>

                    <AdminSection
                        icon={CalendarDays}
                        eyebrow="Programación"
                        title="Fecha y ubicación"
                        description="Estos datos pueden dejarse vacíos cuando todavía no han sido confirmados."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <AdminInput
                                label="Fecha"
                                name="eventDate"
                                type="datetime-local"
                                description="Opcional."
                            />

                            <AdminInput
                                label="Ubicación"
                                name="location"
                                placeholder="Ej. Monterrey, Nuevo León"
                                description="Opcional."
                            />
                        </div>
                    </AdminSection>

                    <AdminSection
                        icon={ImageIcon}
                        eyebrow="Contenido visual"
                        title="Imagen principal"
                        description="Se utilizará para presentar visualmente la experiencia."
                    >
                        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
                            <ExperienceUploadField />

                            <AdminInput
                                label="Texto alternativo"
                                name="imageAlt"
                                placeholder="Descripción breve de la imagen"
                                description="Ayuda a la accesibilidad."
                            />
                        </div>
                    </AdminSection>
                </div>

                <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                    <div className="space-y-5">
                        <section className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                            <div className="border-b border-slate-100 bg-[#f8fafb] p-5">
                                <div className="flex items-start gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
                                        <Sparkles
                                            size={18}
                                        />
                                    </span>

                                    <div>
                                        <h2 className="text-xl font-black text-[#192a3a]">
                                            Publicación
                                        </h2>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Configura cómo se
                                            mostrará en la página
                                            pública.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5">
                                <AdminSelect
                                    label="Estado"
                                    name="status"
                                    defaultValue={
                                        ExperienceStatus.DRAFT
                                    }
                                    description="Solo las experiencias publicadas serán visibles."
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
                                </AdminSelect>

                                <AdminInput
                                    label="Orden"
                                    name="sortOrder"
                                    type="number"
                                    min={0}
                                    defaultValue={0}
                                    description="Los valores menores aparecen primero."
                                />

                                <AdminToggleOption
                                    name="featured"
                                    title="Experiencia destacada"
                                    description="Ocupará el bloque principal de Experiencias que se viven."
                                    icon={Sparkles}
                                />

                                <AdminAlert variant="info">
                                    Solo puede existir una
                                    experiencia destacada.
                                    Al seleccionar otra, la
                                    anterior dejará de serlo.
                                </AdminAlert>
                            </div>
                        </section>

                        <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                            <h2 className="text-sm font-black text-[#192a3a]">
                                Antes de guardar
                            </h2>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Verifica tipo, título,
                                descripción y estado.
                            </p>

                            <div className="mt-5 grid gap-3">
                                <AdminButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                >
                                    <Save size={16} />
                                    Guardar experiencia
                                </AdminButton>

                                <AdminButton
                                    href="/admin/grupo-rise"
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Cancelar
                                </AdminButton>
                            </div>
                        </section>
                    </div>
                </aside>
            </form>
        </div>
    );
}

function ExperienceUploadField() {
    return (
        <label className="group block cursor-pointer">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Archivo de imagen
            </span>

            <span className="flex min-h-[190px] flex-col items-center justify-center border border-dashed border-slate-300 bg-[#f8fafb] px-6 py-8 text-center transition group-hover:border-[#192a3a]/40 group-hover:bg-[#eef0ee]">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Upload size={20} />
                </span>

                <span className="mt-4 text-sm font-black text-[#192a3a]">
                    Seleccionar imagen
                </span>

                <span className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                    JPG, PNG, WEBP o AVIF.
                    Se recomienda una imagen
                    horizontal.
                </span>

                <span className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Máximo 6 MB
                </span>

                <input
                    type="file"
                    name="imageFile"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                />
            </span>
        </label>
    );
}