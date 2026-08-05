import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
    redirect,
    RedirectType,
} from "next/navigation";
import { LeadType } from "@prisma/client";
import {
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    FileText,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    ShowerHead,
    User,
    Users,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import {
    deleteJobApplicationCv,
    saveJobApplicationCv,
} from "@/lib/job-application-uploads";

export const dynamic = "force-dynamic";

type JobsPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

function getStringValue(
    formData: FormData,
    key: string
) {
    const value = formData.get(key);

    return typeof value === "string"
        ? value.trim()
        : "";
}

async function submitJobApplication(
    formData: FormData
) {
    "use server";

    const honeypot = getStringValue(
        formData,
        "website"
    );

    // Evita registros automáticos simples.
    if (honeypot) {
        redirect(
            "/bolsa-de-trabajo?error=campos#postulacion",
            RedirectType.replace
        );
    }

    const name = getStringValue(
        formData,
        "name"
    );

    const phone = getStringValue(
        formData,
        "phone"
    );

    const email = getStringValue(
        formData,
        "email"
    );

    const city = getStringValue(
        formData,
        "city"
    );

    const interestArea = getStringValue(
        formData,
        "interestArea"
    );

    const applicantMessage = getStringValue(
        formData,
        "message"
    );

    const branchIdValue = Number(
        getStringValue(formData, "branchId")
    );
    const cvValue = formData.get("cv");

    if (
        !(cvValue instanceof File) ||
        cvValue.size === 0
    ) {
        redirect(
            "/bolsa-de-trabajo?error=cv#postulacion",
            RedirectType.replace
        );
    }

    if (
        !name ||
        !phone ||
        !email ||
        !interestArea
    ) {
        redirect(
            "/bolsa-de-trabajo?error=campos#postulacion"
        );
    }

    let selectedBranch:
        | {
            id: number;
            name: string;
        }
        | null = null;

    if (
        Number.isInteger(branchIdValue) &&
        branchIdValue > 0
    ) {
        selectedBranch =
            await prisma.branch.findFirst({
                where: {
                    id: branchIdValue,
                    active: true,
                },

                select: {
                    id: true,
                    name: true,
                },
            });
    }

    const message = [
        "Bolsa de trabajo",
        `Área de interés: ${interestArea}`,
        `Ciudad de residencia: ${city || "No especificada"
        }`,
        `Sucursal de interés: ${selectedBranch?.name ??
        "Sin preferencia"
        }`,
        "",
        applicantMessage ||
        "Sin información adicional.",
    ].join("\n");

    let savedCv;

    try {
        savedCv =
            await saveJobApplicationCv(cvValue);
    } catch {
        redirect(
            "/bolsa-de-trabajo?error=cv#postulacion",
            RedirectType.replace
        );
    }

    try {
        await prisma.lead.create({
            data: {
                type: LeadType.CONTACTO,
                name,
                phone,
                email,
                message,
                branchId:
                    selectedBranch?.id ?? null,

                cvStoredName:
                    savedCv.storedName,

                cvOriginalName:
                    savedCv.originalName,

                cvMimeType:
                    savedCv.mimeType,

                cvSize:
                    savedCv.size,
            },
        });
    } catch (error) {
        await deleteJobApplicationCv(
            savedCv.storedName
        );

        throw error;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/leads");

    redirect(
        "/gracias?tipo=empleo",
        RedirectType.replace
    );
}

export default async function JobsPage({
    searchParams,
}: JobsPageProps) {
    const params = await searchParams;
    const errorMessage =
        params.error === "cv"
            ? "Selecciona un currículum válido en formato PDF con un tamaño máximo de 5 MB."
            : params.error === "campos"
                ? "Completa nombre, teléfono, correo y área de interés."
                : "";

    const branches =
        await prisma.branch.findMany({
            where: {
                active: true,
            },

            orderBy: [
                {
                    sortOrder: "asc",
                },
                {
                    name: "asc",
                },
            ],

            select: {
                id: true,
                name: true,
                city: true,
                state: true,
            },
        });

    return (
        <>
            <Header />

            <main className="public-home">
                {/* Hero */}
                <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%)]" />

                    <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

                    <div className="public-container relative grid min-h-[500px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-24">
                        <div className="max-w-4xl">
                            <div className="flex items-center gap-4">
                                <span className="h-px w-10 bg-[var(--public-accent)]" />

                                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">
                                    Bolsa de trabajo
                                </p>
                            </div>

                            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                                Forma parte
                                <span className="block text-white/55">
                                    de Grupo RISE.
                                </span>
                            </h1>

                            <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
                                Comparte tu perfil y las áreas
                                en las que te interesa desarrollarte
                                profesionalmente.
                            </p>

                            <a
                                href="#postulacion"
                                className="group mt-9 inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                            >
                                Enviar postulación

                                <ArrowRight
                                    size={17}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </a>
                        </div>

                        <div className="grid gap-px border border-white/10 bg-white/10">
                            <JobSummary
                                icon={Users}
                                title="Talento"
                                description="Perfiles interesados en integrarse a Grupo RISE."
                            />

                            <JobSummary
                                icon={Building2}
                                title="Agencias"
                                description="Oportunidades relacionadas con nuestras distintas ubicaciones."
                            />

                            <JobSummary
                                icon={BriefcaseBusiness}
                                title="Áreas"
                                description="Ventas, servicio, administración y operación."
                            />
                        </div>
                    </div>
                </section>

                {/* Vacantes */}
                <section className="border-b border-[var(--home-border)] bg-[#eef0ee]">
                    <div className="public-container py-16 md:py-24">
                        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
                            <div>
                                <p className="public-eyebrow">
                                    Oportunidades
                                </p>

                                <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[var(--public-ink)] md:text-6xl">
                                    Vacantes disponibles.
                                </h2>
                            </div>

                            <div className="border-l-2 border-[var(--public-accent)] pl-6 md:pl-10">
                                <p className="max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                                    Las posiciones autorizadas por
                                    Grupo RISE se publicarán en esta
                                    sección con su ubicación y detalles.
                                </p>
                            </div>
                        </div>

                        {/* Estado vacío hasta recibir vacantes */}
                        <div className="mt-12 border border-[var(--home-border)] bg-[var(--home-card)] p-8 md:p-12">
                            <div className="grid items-center gap-8 md:grid-cols-[80px_minmax(0,1fr)_auto]">
                                <span className="grid h-20 w-20 place-items-center bg-[var(--public-header)] text-white">
                                    <BriefcaseBusiness size={31} />
                                </span>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--public-muted)]">
                                        Próximamente
                                    </p>

                                    <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)] md:text-3xl">
                                        Aún no hay vacantes publicadas
                                    </h3>

                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
                                        Puedes registrar una postulación
                                        general para que tu información
                                        quede disponible para futuras
                                        oportunidades.
                                    </p>
                                </div>

                                <a
                                    href="#postulacion"
                                    className="inline-flex h-12 items-center justify-center gap-3 border border-[var(--home-border-strong)] px-5 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
                                >
                                    Postulación general
                                    <ArrowRight size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Formulario */}
                <section className="bg-[var(--home-card)]">
                    <div className="public-container py-16 md:py-24">
                        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
                            <aside className="border border-white/10 bg-[var(--public-header)] p-7 text-white xl:sticky xl:top-[120px]">
                                <span className="grid h-[52px] w-[52px] place-items-center border border-white/20 bg-white/10 text-white">
                                    <FileText size={23} />
                                </span>

                                <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-white/40">
                                    Postulación general
                                </p>

                                <h2 className="mt-3 text-3xl font-black leading-[1] tracking-[-0.04em] text-white">
                                    Comparte tu información profesional
                                </h2>

                                <p className="mt-5 text-sm leading-7 text-white/55">
                                    Indica tu área de interés,
                                    ubicación y datos de contacto.
                                    El equipo correspondiente podrá
                                    revisar la información proporcionada.
                                </p>

                                <div className="mt-7 grid gap-px border border-white/10 bg-white/10">
                                    <ApplicationFeature
                                        icon={CheckCircle2}
                                        title="Registro de perfil"
                                        description="Tu postulación quedará registrada en el sistema."
                                    />

                                    <ApplicationFeature
                                        icon={MapPin}
                                        title="Ubicación de interés"
                                        description="Puedes elegir una agencia o indicar que no tienes preferencia."
                                    />

                                    <ApplicationFeature
                                        icon={MessageSquare}
                                        title="Información adicional"
                                        description="Comparte tu experiencia, intereses o disponibilidad."
                                    />
                                </div>
                            </aside>

                            <section
                                id="postulacion"
                                className="scroll-mt-[125px] border border-[var(--home-border)] bg-white p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8 lg:p-10"
                            >
                                <div className="border-b border-[var(--home-border)] pb-8">
                                    <p className="public-eyebrow">
                                        Datos del candidato
                                    </p>

                                    <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-5xl">
                                        Registra tu postulación
                                    </h2>

                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                                        Completa los datos obligatorios.
                                        La documentación adicional podrá
                                        solicitarse durante el proceso.
                                    </p>
                                </div>

                                {errorMessage && (
                                    <div className="mt-6 border border-red-300 bg-red-50 px-4 py-4 text-sm font-bold text-red-800">
                                        {errorMessage}
                                    </div>
                                )}

                                <form
                                    action={submitJobApplication}
                                    className="mt-8"
                                >
                                    {/* Honeypot */}
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        aria-hidden="true"
                                        className="hidden"
                                    />

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <FormField
                                            icon={User}
                                            label="Nombre completo"
                                            name="name"
                                            placeholder="Nombre del candidato"
                                            autoComplete="name"
                                            required
                                        />

                                        <FormField
                                            icon={Phone}
                                            label="Teléfono / WhatsApp"
                                            name="phone"
                                            type="tel"
                                            placeholder="Ej. 8112345678"
                                            autoComplete="tel"
                                            required
                                        />

                                        <FormField
                                            icon={Mail}
                                            label="Correo electrónico"
                                            name="email"
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                            autoComplete="email"
                                            required
                                        />

                                        <FormField
                                            icon={MapPin}
                                            label="Ciudad de residencia"
                                            name="city"
                                            placeholder="Ciudad y estado"
                                            autoComplete="address-level2"
                                        />

                                        <label className="block">
                                            <FormLabel
                                                icon={BriefcaseBusiness}
                                                text="Área de interés"
                                            />

                                            <select
                                                name="interestArea"
                                                required
                                                defaultValue=""
                                                className="h-12 w-full border border-[var(--home-border-strong)] bg-[#f3f4f2] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-header)] focus:bg-white"
                                            >
                                                <option
                                                    value=""
                                                    disabled
                                                >
                                                    Seleccionar área
                                                </option>

                                                <option value="Ventas">
                                                    Ventas
                                                </option>

                                                <option value="Administración">
                                                    Administración
                                                </option>

                                                <option value="Servicio y taller">
                                                    Servicio y taller
                                                </option>

                                                <option value="Refacciones">
                                                    Refacciones
                                                </option>

                                                <option value="Mercadotecnia">
                                                    Mercadotecnia
                                                </option>

                                                <option value="Operaciones">
                                                    Operaciones
                                                </option>

                                                <option value="Otra">
                                                    Otra
                                                </option>
                                            </select>
                                        </label>

                                        <label className="block">
                                            <FormLabel
                                                icon={Building2}
                                                text="Sucursal de interés"
                                            />

                                            <select
                                                name="branchId"
                                                defaultValue=""
                                                className="h-12 w-full border border-[var(--home-border-strong)] bg-[#f3f4f2] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-header)] focus:bg-white"
                                            >
                                                <option value="">
                                                    Sin preferencia
                                                </option>

                                                {branches.map((branch) => (
                                                    <option
                                                        key={branch.id}
                                                        value={branch.id}
                                                    >
                                                        {branch.name} ·{" "}
                                                        {branch.city},{" "}
                                                        {branch.state}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block md:col-span-2">
                                            <FormLabel
                                                icon={FileText}
                                                text="Currículum"
                                            />

                                            <div className="border border-dashed border-[var(--home-border-strong)] bg-[#f3f4f2] p-5">
                                                <input
                                                    type="file"
                                                    name="cv"
                                                    accept=".pdf,application/pdf"
                                                    required
                                                    className="block w-full text-sm font-semibold text-[var(--public-ink)] file:mr-4 file:border-0 file:bg-[var(--public-header)] file:px-5 file:py-3 file:text-xs file:font-black file:uppercase file:tracking-[0.08em] file:text-white hover:file:bg-[var(--public-accent-dark)]"
                                                />

                                                <p className="mt-3 text-xs font-medium leading-5 text-[var(--public-muted)]">
                                                    Archivo PDF con un tamaño máximo de
                                                    5 MB.
                                                </p>
                                            </div>
                                        </label>

                                        <label className="block md:col-span-2">
                                            <FormLabel
                                                icon={MessageSquare}
                                                text="Perfil y experiencia"
                                            />

                                            <textarea
                                                name="message"
                                                rows={6}
                                                placeholder="Cuéntanos sobre tu experiencia, habilidades, disponibilidad o el tipo de oportunidad que buscas."
                                                className="w-full resize-none border border-[var(--home-border-strong)] bg-[#f3f4f2] px-4 py-3 text-sm font-semibold leading-6 text-[var(--public-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-7 border-t border-[var(--home-border)] pt-7">
                                        <button
                                            type="submit"
                                            className="group inline-flex h-12 w-full items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)] sm:w-auto sm:min-w-[230px]"
                                        >
                                            Enviar postulación

                                            <ArrowRight
                                                size={17}
                                                className="transition-transform group-hover:translate-x-0.5"
                                            />
                                        </button>

                                        <p className="mt-4 max-w-xl text-xs font-medium leading-6 text-[var(--public-muted)]">
                                            Al enviar tus datos, autorizas
                                            su uso para revisar esta
                                            postulación y establecer
                                            contacto relacionado con
                                            oportunidades laborales.
                                        </p>
                                    </div>
                                </form>
                            </section>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

function JobSummary({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Users;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-[112px] items-center gap-5 bg-[var(--public-header)] p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center border border-white/20 bg-white/10 text-white">
                <Icon size={21} />
            </span>

            <div>
                <p className="font-black text-white">
                    {title}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/45">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ApplicationFeature({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof CheckCircle2;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-[105px] items-start gap-4 bg-[var(--public-header)] p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/20 bg-white/10 text-white">
                <Icon size={18} />
            </span>

            <div>
                <p className="text-sm font-black text-white">
                    {title}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/45">
                    {description}
                </p>
            </div>
        </div>
    );
}

function FormLabel({
    icon: Icon,
    text,
}: {
    icon: typeof User;
    text: string;
}) {
    return (
        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--public-muted)]">
            <Icon size={15} />
            {text}
        </span>
    );
}

function FormField({
    icon,
    label,
    name,
    type = "text",
    placeholder,
    autoComplete,
    required = false,
}: {
    icon: typeof User;
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <FormLabel
                icon={icon}
                text={label}
            />

            <input
                name={name}
                type={type}
                required={required}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="h-12 w-full border border-[var(--home-border-strong)] bg-[#f3f4f2] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
            />
        </label>
    );
}