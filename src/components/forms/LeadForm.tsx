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
            ? "rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-7"
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
                <div className="border-b border-slate-100 pb-6">
                    {title && (
                        <h2 className="text-2xl font-black tracking-[-0.035em] text-[#0a0f14] md:text-3xl">
                            {title}
                        </h2>
                    )}

                    {description && (
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                            {description}
                        </p>
                    )}

                    {vehicleName && (
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#192a3a]/10 bg-[#e7edf1] px-4 py-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#192a3a]">
                                <CheckCircle2 size={17} />
                            </span>

                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                                    Vehículo seleccionado
                                </p>

                                <p className="mt-0.5 truncate text-sm font-black text-[#192a3a]">
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
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                        >
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                    />
                </label>
            </div>

            {errorMessage && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700"
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
                    className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-bold text-emerald-700"
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

            <div className="mt-6 border-t border-slate-100 pt-6">
                <button
                    type="submit"
                    disabled={isPending}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#29465c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[220px]"
                >
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

                <p className="mt-3 text-xs font-medium leading-5 text-slate-400">
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
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    name={name}
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
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
        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-slate-500">
            <Icon
                size={14}
                className="text-[#192a3a]"
            />

            {text}

            {required && (
                <span
                    className="text-red-500"
                    aria-hidden="true"
                >
                    *
                </span>
            )}
        </span>
    );
}