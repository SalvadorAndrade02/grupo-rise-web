import {
    notFound,
    redirect,
} from "next/navigation";
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

type EditExperiencePageProps = {
    params: Promise<{
        id: string;
    }>;

    searchParams: Promise<{
        error?: string;
    }>;
};

function getTextValue(
    formData: FormData,
    fieldName: string
) {
    return String(
        formData.get(fieldName) ?? ""
    ).trim();
}

function getOptionalTextValue(
    formData: FormData,
    fieldName: string
) {
    const value =
        getTextValue(
            formData,
            fieldName
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
    ).includes(
        type as ExperienceType
    )
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

function getSortOrder(
    formData: FormData
) {
    const rawValue =
        getTextValue(
            formData,
            "sortOrder"
        );

    if (!rawValue) {
        return 0;
    }

    const value =
        Number(rawValue);

    return Number.isInteger(value) &&
        value >= 0
        ? value
        : Number.NaN;
}

function parseOptionalDate(
    value: string
) {
    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}

function formatDateTimeLocal(
    value?: Date | null
) {
    if (!value) {
        return "";
    }

    const pad = (
        number: number
    ) =>
        String(number).padStart(
            2,
            "0"
        );

    return [
        value.getFullYear(),
        "-",
        pad(
            value.getMonth() + 1
        ),
        "-",
        pad(value.getDate()),
        "T",
        pad(value.getHours()),
        ":",
        pad(value.getMinutes()),
    ].join("");
}

function redirectExperienceError(
    experienceId: number,
    message: string
): never {
    redirect(
        `/admin/grupo-rise/${experienceId}/editar?error=${encodeURIComponent(
            message
        )}`
    );
}

function revalidateExperiencePaths(
    experienceId: number
) {
    revalidatePath(
        "/admin/grupo-rise"
    );

    revalidatePath(
        `/admin/grupo-rise/${experienceId}/editar`
    );

    revalidatePath(
        "/grupo-rise"
    );
}

async function safelyDeleteImage(
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

async function updateExperience(
    formData: FormData
) {
    "use server";

    await requireAdmin();

    const experienceId =
        Number(
            formData.get(
                "experienceId"
            )
        );

    if (
        !Number.isInteger(
            experienceId
        ) ||
        experienceId <= 0
    ) {
        redirect(
            "/admin/grupo-rise"
        );
    }

    const currentExperience =
        await prisma.riseExperience.findUnique({
            where: {
                id: experienceId,
            },
        });

    if (!currentExperience) {
        redirect(
            "/admin/grupo-rise"
        );
    }

    const type =
        getExperienceType(
            formData.get("type")
        );

    const title =
        getTextValue(
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
        formData.get(
            "featured"
        ) === "on";

    const sortOrder =
        getSortOrder(formData);

    if (!title) {
        redirectExperienceError(
            experienceId,
            "El título es obligatorio."
        );
    }

    if (title.length < 4) {
        redirectExperienceError(
            experienceId,
            "El título debe tener al menos 4 caracteres."
        );
    }

    if (!description) {
        redirectExperienceError(
            experienceId,
            "La descripción es obligatoria."
        );
    }

    if (
        description.length < 15
    ) {
        redirectExperienceError(
            experienceId,
            "La descripción debe tener al menos 15 caracteres."
        );
    }

    if (
        !Number.isInteger(
            sortOrder
        ) ||
        sortOrder < 0
    ) {
        redirectExperienceError(
            experienceId,
            "El orden debe ser un número entero igual o mayor a cero."
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
        redirectExperienceError(
            experienceId,
            "La fecha del evento no es válida."
        );
    }

    const finalFeatured =
        status ===
        ExperienceStatus.PUBLISHED &&
        featuredRequested;

    let uploadedImageUrl:
        | string
        | null = null;

    try {
        uploadedImageUrl =
            await saveExperienceImage(
                formData.get(
                    "imageFile"
                )
            );
    } catch (error) {
        redirectExperienceError(
            experienceId,
            error instanceof Error
                ? error.message
                : "No se pudo guardar la nueva imagen."
        );
    }

    const finalImageUrl =
        uploadedImageUrl ??
        currentExperience.imageUrl;

    try {
        const data = {
            type,
            title,
            description,
            eventDate,
            location,
            imageUrl:
                finalImageUrl,
            imageAlt,
            status,
            featured:
                finalFeatured,
            sortOrder,
        };

        if (finalFeatured) {
            await prisma.$transaction([
                prisma.riseExperience.updateMany({
                    where: {
                        featured: true,

                        NOT: {
                            id: experienceId,
                        },
                    },

                    data: {
                        featured: false,
                    },
                }),

                prisma.riseExperience.update({
                    where: {
                        id: experienceId,
                    },

                    data,
                }),
            ]);
        } else {
            await prisma.riseExperience.update({
                where: {
                    id: experienceId,
                },

                data,
            });
        }
    } catch (error) {
        if (uploadedImageUrl) {
            await safelyDeleteImage(
                uploadedImageUrl
            );
        }

        console.error(
            "Error actualizando experiencia:",
            error
        );

        redirectExperienceError(
            experienceId,
            "No se pudo actualizar la experiencia."
        );
    }

    /*
     * Si se cargó una nueva imagen y
     * la actualización fue exitosa,
     * eliminamos la anterior.
     */
    if (
        uploadedImageUrl &&
        currentExperience.imageUrl &&
        currentExperience.imageUrl !==
        uploadedImageUrl
    ) {
        await safelyDeleteImage(
            currentExperience.imageUrl
        );
    }

    revalidateExperiencePaths(
        experienceId
    );

    redirect(
        "/admin/grupo-rise"
    );
}

export default async function EditExperiencePage({
    params,
    searchParams,
}: EditExperiencePageProps) {
    await requireAdmin();

    const { id } =
        await params;

    const query =
        await searchParams;

    const experienceId =
        Number(id);

    if (
        !Number.isInteger(
            experienceId
        ) ||
        experienceId <= 0
    ) {
        notFound();
    }

    const experience =
        await prisma.riseExperience.findUnique({
            where: {
                id: experienceId,
            },
        });

    if (!experience) {
        notFound();
    }

    return (
        <div className="pb-10">
            <AdminHero
                eyebrow={`Experiencia #${experience.id}`}
                title="Editar experiencia"
                description="Modifica la información que se mostrará en Experiencias que se viven."
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
                    label="Tipo"
                    value={
                        experience.type ===
                            ExperienceType.EVENTO
                            ? "Evento"
                            : experience.type ===
                                ExperienceType.RODADA
                                ? "Rodada"
                                : "Lanzamiento"
                    }
                    description="Clasificación actual."
                />

                <AdminSummaryCard
                    icon={CalendarDays}
                    label="Fecha"
                    value={
                        experience.eventDate
                            ? new Intl.DateTimeFormat(
                                "es-MX",
                                {
                                    dateStyle:
                                        "medium",
                                }
                            ).format(
                                experience.eventDate
                            )
                            : "Por confirmar"
                    }
                    description="Fecha programada."
                    tone="blue"
                />

                <AdminSummaryCard
                    icon={MapPin}
                    label="Ubicación"
                    value={
                        experience.location ||
                        "Por confirmar"
                    }
                    description="Lugar de la experiencia."
                    tone="emerald"
                />

                <AdminSummaryCard
                    icon={Sparkles}
                    label="Visibilidad"
                    value={
                        experience.featured
                            ? "Destacada"
                            : experience.status ===
                                ExperienceStatus.PUBLISHED
                                ? "Publicada"
                                : "No publicada"
                    }
                    description="Estado actual."
                    tone="violet"
                />
            </section>

            <form
                action={updateExperience}
                className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
            >
                <input
                    type="hidden"
                    name="experienceId"
                    value={experience.id}
                />

                <div className="min-w-0 space-y-6">
                    {/* Información principal */}
                    <AdminSection
                        icon={FileText}
                        eyebrow="Información"
                        title="Datos de la experiencia"
                        description="Modifica el tipo, título y descripción."
                    >
                        <div className="grid gap-5">
                            <AdminSelect
                                label="Tipo"
                                name="type"
                                defaultValue={
                                    experience.type
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
                                defaultValue={
                                    experience.title
                                }
                            />

                            <AdminTextarea
                                label="Descripción"
                                name="description"
                                required
                                minLength={15}
                                rows={6}
                                defaultValue={
                                    experience.description
                                }
                            />
                        </div>
                    </AdminSection>

                    {/* Fecha / ubicación */}
                    <AdminSection
                        icon={CalendarDays}
                        eyebrow="Programación"
                        title="Fecha y ubicación"
                        description="Actualiza cuándo y dónde se realizará la experiencia."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <AdminInput
                                label="Fecha"
                                name="eventDate"
                                type="datetime-local"
                                defaultValue={formatDateTimeLocal(
                                    experience.eventDate
                                )}
                                description="Déjala vacía si todavía no está confirmada."
                            />

                            <AdminInput
                                label="Ubicación"
                                name="location"
                                defaultValue={
                                    experience.location ??
                                    ""
                                }
                                placeholder="Ej. Monterrey, Nuevo León"
                                description="Puede quedar por confirmar."
                            />
                        </div>
                    </AdminSection>

                    {/* Imagen */}
                    <AdminSection
                        icon={ImageIcon}
                        eyebrow="Contenido visual"
                        title="Imagen principal"
                        description="Puedes conservar la imagen actual o sustituirla por una nueva."
                    >
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                            <div>
                                <ExperienceUploadField />

                                <AdminInput
                                    label="Texto alternativo"
                                    name="imageAlt"
                                    defaultValue={
                                        experience.imageAlt ??
                                        ""
                                    }
                                    placeholder="Descripción breve de la imagen"
                                    description="Ayuda a la accesibilidad."
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                                    Imagen actual
                                </p>

                                <div className="relative min-h-[220px] overflow-hidden border border-slate-200 bg-[#eef1f3]">
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
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                            <ImageIcon
                                                size={36}
                                            />

                                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em]">
                                                Sin imagen
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                    Si no seleccionas un
                                    archivo nuevo, esta imagen
                                    se conservará.
                                </p>
                            </div>
                        </div>
                    </AdminSection>
                </div>

                {/* Columna lateral */}
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
                                            Controla estado,
                                            posición y contenido
                                            destacado.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5">
                                <AdminSelect
                                    label="Estado"
                                    name="status"
                                    defaultValue={
                                        experience.status
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
                                    defaultValue={
                                        experience.sortOrder
                                    }
                                    description="Los valores menores aparecen primero."
                                />

                                <AdminToggleOption
                                    name="featured"
                                    title="Experiencia destacada"
                                    description="Ocupará el bloque principal de Experiencias que se viven."
                                    icon={Sparkles}
                                    defaultChecked={
                                        experience.featured
                                    }
                                />

                                <AdminAlert variant="info">
                                    Si marcas esta
                                    experiencia como
                                    destacada y la publicas,
                                    cualquier otra destacada
                                    dejará de ocupar el bloque
                                    principal.
                                </AdminAlert>
                            </div>
                        </section>

                        <section className="rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                            <h2 className="text-sm font-black text-[#192a3a]">
                                Guardar cambios
                            </h2>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Revisa la información antes
                                de actualizar la experiencia.
                            </p>

                            <div className="mt-5 grid gap-3">
                                <AdminButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                >
                                    <Save size={16} />
                                    Guardar cambios
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
        <label className="group mb-5 block cursor-pointer">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Reemplazar imagen
            </span>

            <span className="flex min-h-[190px] flex-col items-center justify-center border border-dashed border-slate-300 bg-[#f8fafb] px-6 py-8 text-center transition group-hover:border-[#192a3a]/40 group-hover:bg-[#eef0ee]">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Upload size={20} />
                </span>

                <span className="mt-4 text-sm font-black text-[#192a3a]">
                    Seleccionar nueva imagen
                </span>

                <span className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                    Deja este campo vacío para
                    conservar la imagen actual.
                </span>

                <span className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    JPG, PNG, WEBP o AVIF · Máximo 6 MB
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