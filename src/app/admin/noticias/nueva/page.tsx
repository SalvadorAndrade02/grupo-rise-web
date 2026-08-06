import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
    AlignLeft,
    CalendarDays,
    FileText,
    ImageIcon,
    Newspaper,
    Save,
    Sparkles,
    Upload,
    UserRound,
} from "lucide-react";
import {
    NewsStatus,
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
    deleteNewsCoverFile,
    saveNewsCoverFile,
} from "@/lib/news-uploads";

export const dynamic =
    "force-dynamic";

type NewNewsPageProps = {
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
    const value = getTextValue(
        formData,
        fieldName
    );

    return value || null;
}

function getNewsStatus(
    value: FormDataEntryValue | null
) {
    const status = String(
        value ?? NewsStatus.DRAFT
    );

    return Object.values(
        NewsStatus
    ).includes(status as NewsStatus)
        ? (status as NewsStatus)
        : NewsStatus.DRAFT;
}

function createSlug(value: string) {
    return value
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(
    requestedValue: string
) {
    const baseSlug =
        createSlug(requestedValue) ||
        `noticia-${Date.now()}`;

    let currentSlug = baseSlug;
    let suffix = 2;

    while (
        await prisma.newsArticle.findUnique({
            where: {
                slug: currentSlug,
            },
            select: {
                id: true,
            },
        })
    ) {
        currentSlug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }

    return currentSlug;
}

function parseOptionalDate(
    value: string
) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (
        Number.isNaN(date.getTime())
    ) {
        return null;
    }

    return date;
}

function redirectNewsError(
    message: string
): never {
    redirect(
        `/admin/noticias/nueva?error=${encodeURIComponent(
            message
        )}`
    );
}

function revalidateNewsPaths(
    slug: string
) {
    revalidatePath("/admin");
    revalidatePath(
        "/admin/noticias"
    );
    revalidatePath(
        "/admin/noticias/nueva"
    );
    revalidatePath("/grupo-rise");
    revalidatePath("/");
    revalidatePath(
        `/grupo-rise/noticias/${slug}`
    );
}

async function safelyDeleteCover(
    fileUrl?: string | null
) {
    if (!fileUrl) {
        return;
    }

    try {
        await deleteNewsCoverFile(
            fileUrl
        );
    } catch (error) {
        console.error(
            "No se pudo eliminar la portada:",
            error
        );
    }
}

async function createNewsArticle(
    formData: FormData
) {
    "use server";

    await requireAdmin();

    const title = getTextValue(
        formData,
        "title"
    );

    const requestedSlug =
        getTextValue(
            formData,
            "slug"
        );

    const excerpt = getTextValue(
        formData,
        "excerpt"
    );

    const content = getTextValue(
        formData,
        "content"
    );

    const coverImageAlt =
        getOptionalTextValue(
            formData,
            "coverImageAlt"
        );

    const authorName =
        getOptionalTextValue(
            formData,
            "authorName"
        );

    const status = getNewsStatus(
        formData.get("status")
    );

    const featuredRequested =
        formData.get("featured") ===
        "on";

    const publishedAtValue =
        getTextValue(
            formData,
            "publishedAt"
        );

    if (
        !title ||
        !excerpt ||
        !content
    ) {
        redirectNewsError(
            "El título, el resumen y el contenido son obligatorios."
        );
    }

    if (title.length < 5) {
        redirectNewsError(
            "El título debe tener al menos 5 caracteres."
        );
    }

    if (excerpt.length < 20) {
        redirectNewsError(
            "El resumen debe tener al menos 20 caracteres."
        );
    }

    if (content.length < 30) {
        redirectNewsError(
            "El contenido debe tener al menos 30 caracteres."
        );
    }

    const parsedPublishedAt =
        parseOptionalDate(
            publishedAtValue
        );

    if (
        publishedAtValue &&
        !parsedPublishedAt
    ) {
        redirectNewsError(
            "La fecha de publicación no es válida."
        );
    }

    const finalPublishedAt =
        status ===
            NewsStatus.PUBLISHED
            ? parsedPublishedAt ??
            new Date()
            : parsedPublishedAt;

    const finalFeatured =
        status ===
        NewsStatus.PUBLISHED &&
        featuredRequested;

    const slug =
        await createUniqueSlug(
            requestedSlug || title
        );

    let uploadedCoverUrl:
        | string
        | null = null;

    try {
        uploadedCoverUrl =
            await saveNewsCoverFile(
                formData.get(
                    "coverImageFile"
                )
            );
    } catch (error) {
        redirectNewsError(
            error instanceof Error
                ? error.message
                : "No se pudo guardar la imagen de portada."
        );
    }

    try {
        const articleData = {
            title,
            slug,
            excerpt,
            content,
            coverImageUrl:
                uploadedCoverUrl,
            coverImageAlt,
            authorName,
            status,
            featured:
                finalFeatured,
            publishedAt:
                finalPublishedAt,
        };

        if (finalFeatured) {
            await prisma.$transaction([
                prisma.newsArticle.updateMany({
                    where: {
                        featured: true,
                    },
                    data: {
                        featured: false,
                    },
                }),

                prisma.newsArticle.create({
                    data: articleData,
                }),
            ]);
        } else {
            await prisma.newsArticle.create({
                data: articleData,
            });
        }
    } catch (error) {
        await safelyDeleteCover(
            uploadedCoverUrl
        );

        console.error(
            "Error creando noticia:",
            error
        );

        redirectNewsError(
            "No se pudo registrar la noticia."
        );
    }

    revalidateNewsPaths(slug);

    redirect(
        `/admin/noticias?success=${encodeURIComponent(
            "Noticia registrada correctamente."
        )}`
    );
}

export default async function NewNewsPage({
    searchParams,
}: NewNewsPageProps) {
    await requireAdmin();

    const query =
        await searchParams;

    return (
        <div className="pb-10">
            <AdminHero
                eyebrow="Nueva publicación"
                title="Crear noticia"
                description="Registra una noticia, comunicado, apertura, evento o novedad institucional de Grupo RISE."
                icon={Newspaper}
                backHref="/admin/noticias"
                backLabel="Volver a noticias"
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
                    value="Título y resumen"
                    description="Información principal de la publicación."
                />

                <AdminSummaryCard
                    icon={AlignLeft}
                    label="Desarrollo"
                    value="Contenido completo"
                    description="Texto que leerán los visitantes."
                    tone="blue"
                />

                <AdminSummaryCard
                    icon={ImageIcon}
                    label="Portada"
                    value="Imagen editorial"
                    description="Recurso visual de la noticia."
                    tone="violet"
                />

                <AdminSummaryCard
                    icon={CalendarDays}
                    label="Publicación"
                    value="Estado y fecha"
                    description="Control de visibilidad pública."
                    tone="emerald"
                />
            </section>

            <form
                action={createNewsArticle}
                className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]"
            >
                <div className="space-y-6">
                    <AdminSection
                        icon={FileText}
                        eyebrow="Información principal"
                        title="Datos de la noticia"
                        description="Captura el título, resumen y dirección pública de la publicación."
                    >
                        <div className="grid gap-5">
                            <AdminInput
                                label="Título"
                                name="title"
                                required
                                minLength={5}
                                maxLength={180}
                                placeholder="Ej. Grupo RISE inaugura una nueva agencia"
                            />

                            <AdminInput
                                label="Slug"
                                name="slug"
                                placeholder="grupo-rise-inaugura-nueva-agencia"
                                description="Puedes dejarlo vacío. Se generará automáticamente usando el título."
                            />

                            <AdminTextarea
                                label="Resumen"
                                name="excerpt"
                                required
                                minLength={20}
                                maxLength={500}
                                rows={4}
                                placeholder="Escribe una descripción breve que se mostrará en las tarjetas de noticias."
                                description="Se recomienda una extensión de dos o tres líneas."
                            />

                            <AdminInput
                                label="Autor"
                                name="authorName"
                                placeholder="Grupo RISE"
                                description="Campo opcional."
                            />
                        </div>
                    </AdminSection>

                    <AdminSection
                        icon={AlignLeft}
                        eyebrow="Contenido editorial"
                        title="Desarrollo de la noticia"
                        description="Escribe el contenido completo que aparecerá en el detalle público."
                    >
                        <AdminTextarea
                            label="Contenido"
                            name="content"
                            required
                            minLength={30}
                            rows={18}
                            placeholder="Escribe aquí el contenido completo de la publicación..."
                            description="Por ahora se guardará como texto. Después podemos integrar un editor enriquecido."
                        />
                    </AdminSection>

                    <AdminSection
                        icon={ImageIcon}
                        eyebrow="Identidad visual"
                        title="Imagen de portada"
                        description="Carga la imagen principal que se utilizará en tarjetas y encabezados."
                    >
                        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
                            <NewsUploadField />

                            <AdminInput
                                label="Texto alternativo"
                                name="coverImageAlt"
                                placeholder="Descripción breve de la imagen"
                                description="Ayuda a la accesibilidad y al posicionamiento del contenido."
                            />
                        </div>
                    </AdminSection>
                </div>

                <aside className="xl:sticky xl:top-6 xl:self-start">
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
                                            Configura el estado y
                                            la visibilidad de la
                                            noticia.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5">
                                <AdminSelect
                                    label="Estado"
                                    name="status"
                                    defaultValue={
                                        NewsStatus.DRAFT
                                    }
                                    description="Solo las noticias publicadas serán visibles en el sitio."
                                >
                                    <option
                                        value={
                                            NewsStatus.DRAFT
                                        }
                                    >
                                        Borrador
                                    </option>

                                    <option
                                        value={
                                            NewsStatus.PUBLISHED
                                        }
                                    >
                                        Publicada
                                    </option>

                                    <option
                                        value={
                                            NewsStatus.ARCHIVED
                                        }
                                    >
                                        Archivada
                                    </option>
                                </AdminSelect>

                                <AdminInput
                                    label="Fecha de publicación"
                                    name="publishedAt"
                                    type="datetime-local"
                                    description="Si publicas sin fecha, se utilizará la fecha actual."
                                />

                                <AdminToggleOption
                                    name="featured"
                                    title="Noticia destacada"
                                    description="Aparecerá como publicación principal. Solo se aplicará cuando el estado sea Publicada."
                                    icon={Sparkles}
                                />

                                <AdminAlert variant="info">
                                    Al marcar esta noticia como
                                    destacada, la publicación
                                    destacada anterior dejará de
                                    ocupar el espacio principal.
                                </AdminAlert>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                            <div className="flex items-start gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
                                    <UserRound
                                        size={18}
                                    />
                                </span>

                                <div>
                                    <h2 className="text-sm font-black text-[#192a3a]">
                                        Antes de guardar
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Verifica el título,
                                        resumen, contenido y
                                        estado de publicación.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <AdminButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                >
                                    <Save size={16} />
                                    Guardar noticia
                                </AdminButton>

                                <AdminButton
                                    href="/admin/noticias"
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

function NewsUploadField() {
    return (
        <label className="group block cursor-pointer">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Archivo de portada
            </span>

            <span className="flex min-h-[190px] flex-col items-center justify-center border border-dashed border-slate-300 bg-[#f8fafb] px-6 py-8 text-center transition group-hover:border-[#192a3a]/40 group-hover:bg-[#eef0ee]">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Upload size={20} />
                </span>

                <span className="mt-4 text-sm font-black text-[#192a3a]">
                    Seleccionar imagen
                </span>

                <span className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                    Utiliza una imagen horizontal en
                    formato JPG, PNG, WEBP o AVIF.
                </span>

                <span className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Máximo 6 MB
                </span>

                <input
                    type="file"
                    name="coverImageFile"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                />
            </span>
        </label>
    );
}