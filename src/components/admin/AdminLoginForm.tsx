"use client";

import {
    FormEvent,
    useState,
} from "react";
import {
    AlertCircle,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    LogIn,
    Mail,
    ShieldCheck,
} from "lucide-react";

type AdminLoginFormProps = {
    errorMessage?: string;
};

export function AdminLoginForm({
    errorMessage,
}: AdminLoginFormProps) {
    const [showPassword, setShowPassword] =
        useState(false);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        const form = event.currentTarget;

        if (!form.checkValidity()) {
            return;
        }

        setIsSubmitting(true);
    }

    return (
        <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.14)]">
            <div className="border-b border-slate-100 bg-gradient-to-br from-white to-[#f4f6f7] p-6 md:p-7">
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#e7edf1] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#192a3a]">
                            <ShieldCheck size={14} />
                            Acceso administrativo
                        </div>

                        <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#0a0f14]">
                            Iniciar sesión
                        </h1>

                        <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
                            Ingresa tus credenciales para acceder al
                            panel de administración de Grupo Rise.
                        </p>
                    </div>

                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#192a3a] text-white shadow-[0_10px_30px_rgba(25,42,58,0.2)]">
                        <LockKeyhole size={25} />
                    </div>
                </div>

                {errorMessage && (
                    <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700"
                    >
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{errorMessage}</span>
                    </div>
                )}
            </div>

            <form
                action="/api/admin/login"
                method="post"
                onSubmit={handleSubmit}
                className="p-6 md:p-7"
            >
                <div className="space-y-5">
                    <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-slate-500">
                            <Mail
                                size={14}
                                className="text-[#192a3a]"
                            />
                            Correo electrónico
                        </span>

                        <div className="relative">
                            <Mail
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                autoFocus
                                placeholder="Ingresa tu correo"
                                className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-[#192a3a] outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-slate-500">
                            <LockKeyhole
                                size={14}
                                className="text-[#192a3a]"
                            />
                            Contraseña
                        </span>

                        <div className="relative">
                            <LockKeyhole
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                placeholder="Ingresa tu contraseña"
                                className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-semibold text-[#192a3a] outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (current) => !current
                                    )
                                }
                                disabled={isSubmitting}
                                aria-label={
                                    showPassword
                                        ? "Ocultar contraseña"
                                        : "Mostrar contraseña"
                                }
                                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_28px_rgba(25,42,58,0.2)] transition hover:-translate-y-0.5 hover:bg-[#29465c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
                >
                    {isSubmitting ? (
                        <>
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Iniciando sesión...
                        </>
                    ) : (
                        <>
                            <LogIn size={18} />
                            Entrar al panel
                        </>
                    )}
                </button>

                <div className="mt-5 rounded-xl border border-slate-100 bg-[#f8fafb] px-4 py-4">
                    <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                        Acceso exclusivo para personal autorizado
                        de Grupo Rise.
                    </p>
                </div>
            </form>
        </div>
    );
}