"use client";

import { FormEvent, useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";
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
};

export function LeadForm({
    type,
    title,
    description,
    vehicleId,
    vehicleName,
    branches = [],
    defaultBranchId,
}: LeadFormProps) {
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            const result = await createLead(formData);

            if (!result.ok) {
                setErrorMessage(result.message);
                return;
            }

            form.reset();
            setSuccessMessage(result.message);
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/10 md:p-8"
        >
            <input type="hidden" name="type" value={type} />

            {vehicleId && <input type="hidden" name="vehicleId" value={vehicleId} />}

            <div>
                <h2 className="text-2xl font-black text-[var(--rise-navy)]">
                    {title}
                </h2>

                {description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {description}
                    </p>
                )}

                {vehicleName && (
                    <p className="mt-3 rounded-2xl bg-[var(--rise-blue-soft)] px-4 py-3 text-sm font-black text-[var(--rise-blue)]">
                        Vehículo: {vehicleName}
                    </p>
                )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                        Nombre completo
                    </span>
                    <input
                        name="name"
                        required
                        placeholder="Nombre del cliente"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                        Teléfono
                    </span>
                    <input
                        name="phone"
                        required
                        placeholder="Ej. 8112345678"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                        Correo
                    </span>
                    <input
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                </label>

                {branches.length > 0 && (
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                            Sucursal
                        </span>
                        <select
                            name="branchId"
                            defaultValue={defaultBranchId ?? ""}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                        >
                            <option value="">Seleccionar sucursal</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name} - {branch.city}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {(type === "CITA" ||
                    type === "PRUEBA_MANEJO" ||
                    type === "SERVICIO") && (
                        <>
                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Fecha preferida
                                </span>
                                <input
                                    name="preferredDate"
                                    type="date"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Hora preferida
                                </span>
                                <input
                                    name="preferredTime"
                                    type="time"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                                />
                            </label>
                        </>
                    )}

                <label className="block md:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                        Mensaje
                    </span>
                    <textarea
                        name="message"
                        rows={4}
                        placeholder="Cuéntanos qué necesitas..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                </label>
            </div>

            {errorMessage && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 size={18} />
                    {successMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Send size={18} />
                {isPending ? "Enviando..." : "Enviar solicitud"}
            </button>
        </form>
    );
}