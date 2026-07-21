"use client";

import {
    FormEvent,
    useState,
    useTransition,
} from "react";
import {
    AlertCircle,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    Mail,
    MessageSquare,
    Phone,
    Send,
    User,
} from "lucide-react";
import { createLead } from "@/app/actions/lead-actions";

type LeadFormType =
    | "COTIZACION"
    | "PRUEBA_MANEJO"
    | "CITA"
    | "SERVICIO"
    | "FINANCIAMIENTO"
    | "CONTACTO";

type LeadFormBranch = {
    id: number;
    name: string;
    city: string;
    state: string;
};

type LeadFormProps = {
    type: LeadFormType;
    title: string;
    description?: string;
    vehicleId?: number;
    vehicleName?: string;
    branches?: LeadFormBranch[];
    defaultBranchId?: number;
    variant?: "card" | "plain";
};

export function LeadForm({
    type,
    title,
    description,
    vehicleId,
    vehicleName,
    branches = [],
    defaultBranchId,
    variant = "card",
}: LeadFormProps) {
    const [isPending, startTransition] =
        useTransition();

    const [successMessage, setSuccessMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    const showHeader = Boolean(
        title || description || vehicleName
    );

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            try {
                const result =
                    await createLead(formData);

                if (!result.ok) {
                    setErrorMessage(result.message);
                    return;
                }

                form.reset();
                setSuccessMessage(result.message);
            } catch {
                setErrorMessage(
                    "No fue posible enviar la solicitud. Inténtalo nuevamente."
                );
            }
        });
    }

    const formClassName =
        variant === "card"
            ? "border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8"
            : "";

    return (
        <form
            onSubmit={handleSubmit}
            className={formClassName}
        >
            <input
                type="hidden"
                name="type"
                value={type}
            />

            {vehicleId && (
                <input
                    type="hidden"
                    name="vehicleId"
                    value={vehicleId}
                />
            )}

            {showHeader && (
                <div className="border-b border-[var(--home-border)] pb-6">
                    {title && (
                        <h2 className="text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)] md:text-3xl">
                            {title}
                        </h2>
                    )}

                    {description && (
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
                            {description}
                        </p>
                    )}

                    {vehicleName && (
                        <div className="mt-5 flex items-center gap-4 border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] px-4 py-4">
                            <span className="grid h-10 w-10 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-card)] text-[var(--public-accent)]">
                                <CheckCircle2 size={17} />
                            </span>

                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--public-muted)]">
                                    Vehículo seleccionado
                                </p>

                                <p className="mt-1 truncate text-sm font-black text-[var(--public-ink)]">
                                    {vehicleName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div
                className={`grid gap-5 md:grid-cols-2 ${showHeader ? "mt-6" : ""
                    }`}
            >
                <FormInput
                    icon={User}
                    label="Nombre completo"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Nombre del cliente"
                />

                <FormInput
                    icon={Phone}
                    label="Teléfono / WhatsApp"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Ej. 8112345678"
                />

                <FormInput
                    icon={Mail}
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="correo@ejemplo.com"
                />

                {branches.length > 0 && (
                    <label className="block">
                        <FormLabel
                            icon={Building2}
                            text="Sucursal"
                        />

                        <select
                            name="branchId"
                            defaultValue={
                                defaultBranchId ?? ""
                            }
                            className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition hover:border-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"                        >
                            <option value="">
                                Seleccionar sucursal
                            </option>

                            {branches.map((branch) => (
                                <option
                                    key={branch.id}
                                    value={branch.id}
                                >
                                    {branch.name} · {branch.city},{" "}
                                    {branch.state}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {(type === "CITA" ||
                    type === "PRUEBA_MANEJO" ||
                    type === "SERVICIO") && (
                        <>
                            <FormInput
                                icon={CalendarDays}
                                label="Fecha preferida"
                                name="preferredDate"
                                type="date"
                            />

                            <FormInput
                                icon={Clock3}
                                label="Hora preferida"
                                name="preferredTime"
                                type="time"
                            />
                        </>
                    )}

                <label className="block md:col-span-2">
                    <FormLabel
                        icon={MessageSquare}
                        text="Mensaje"
                    />

                    <textarea
                        name="message"
                        rows={5}
                        placeholder="Cuéntanos qué necesitas..."
                        className="w-full resize-none border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--public-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--public-muted)] hover:border-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
                    />
                </label>
            </div>

            {errorMessage && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="mt-5 flex items-start gap-3 border border-red-300 bg-red-50 px-4 py-4 text-sm font-bold text-red-800"
                >
                    <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0"
                    />

                    <span>{errorMessage}</span>
                </div>
            )}

            {successMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="mt-5 flex items-start gap-3 border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-800"
                >
                    <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-black">
                            Solicitud enviada
                        </p>

                        <p className="mt-1 font-semibold leading-6">
                            {successMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-7 border-t border-[var(--home-border)] pt-7">
                <button
                    type="submit"
                    disabled={isPending}
                    className="group inline-flex h-12 w-full items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:-translate-y-0.5 hover:bg-[var(--public-accent-dark)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[220px]"                >
                    {isPending ? (
                        <>
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Enviando solicitud...
                        </>
                    ) : (
                        <>
                            <Send size={17} />
                            Enviar solicitud
                        </>
                    )}
                </button>

                <p className="mt-4 max-w-xl text-xs font-medium leading-6 text-[var(--public-muted)]">
                    Al enviar tus datos, un asesor podrá
                    contactarte para atender esta solicitud.
                </p>
            </div>
        </form>
    );
}

type FormInputProps = {
    icon: typeof User;
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
    inputMode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
};

function FormInput({
    icon: Icon,
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    autoComplete,
    inputMode,
}: FormInputProps) {
    return (
        <label className="block">
            <FormLabel
                icon={Icon}
                text={label}
                required={required}
            />

            <div className="relative">
                <Icon
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--public-muted)]"
                />

                <input
                    name={name}
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] pl-11 pr-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--public-muted)] hover:border-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
                />
            </div>
        </label>
    );
}

function FormLabel({
    icon: Icon,
    text,
    required = false,
}: {
    icon: typeof User;
    text: string;
    required?: boolean;
}) {
    return (
        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-[var(--public-muted)]">
            <span className="grid h-6 w-6 shrink-0 place-items-center bg-[var(--public-header)] text-white">
                <Icon size={13} />
            </span>

            {text}

            {required && (
                <span
                    className="text-red-600"
                    aria-hidden="true"
                >
                    *
                </span>
            )}
        </span>
    );
}