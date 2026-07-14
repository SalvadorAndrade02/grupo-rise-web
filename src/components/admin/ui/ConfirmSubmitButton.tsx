"use client";

import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";
import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
    AlertTriangle,
    Loader2,
    Trash2,
    X,
} from "lucide-react";

type ServerAction = (
    formData: FormData
) => void | Promise<void>;

type ConfirmSubmitButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "formAction" | "onClick" | "children"
> & {
    children: ReactNode;
    confirmMessage: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    pendingText?: string;
    formAction?: ServerAction;
    tone?: "danger" | "warning";
};

export function ConfirmSubmitButton({
    children,
    confirmMessage,
    title = "Confirmar eliminación",
    confirmText = "Sí, eliminar",
    cancelText = "Cancelar",
    pendingText = "Eliminando...",
    formAction,
    tone = "danger",
    disabled,
    className,
    formNoValidate,
    ...buttonProps
}: ConfirmSubmitButtonProps) {
    const [open, setOpen] = useState(false);

    const { pending } = useFormStatus();

    const titleId = useId();
    const descriptionId = useId();

    const confirmButtonRef =
        useRef<HTMLButtonElement>(null);

    const wasPending = useRef(false);

    const toneClasses = {
        danger: {
            icon: "border-red-200 bg-red-50 text-red-600",
            warning:
                "border-red-200 bg-red-50 text-red-700",
            button:
                "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
        },

        warning: {
            icon:
                "border-amber-200 bg-amber-50 text-amber-700",
            warning:
                "border-amber-200 bg-amber-50 text-amber-800",
            button:
                "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-200",
        },
    };

    const styles = toneClasses[tone];

    function closeModal() {
        if (!pending) {
            setOpen(false);
        }
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const timeout = window.setTimeout(() => {
            confirmButtonRef.current?.focus();
        }, 50);

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (
                event.key === "Escape" &&
                !pending
            ) {
                setOpen(false);
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.clearTimeout(timeout);

            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, pending]);

    useEffect(() => {
        if (
            wasPending.current &&
            !pending
        ) {
            setOpen(false);
        }

        wasPending.current = pending;
    }, [pending]);

    return (
        <>
            <button
                {...buttonProps}
                type="button"
                disabled={disabled || pending}
                onClick={() => setOpen(true)}
                className={className}
            >
                {children}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-[#101c27]/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={
                            descriptionId
                        }
                        className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* Decoración superior */}
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />

                        <div className="p-6 md:p-7">
                            <div className="flex items-start justify-between gap-5">
                                <span
                                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-[16px] border ${styles.icon}`}
                                >
                                    <AlertTriangle size={23} />
                                </span>

                                <button
                                    type="button"
                                    aria-label="Cerrar confirmación"
                                    disabled={pending}
                                    onClick={closeModal}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            <h2
                                id={titleId}
                                className="mt-5 text-2xl font-black tracking-[-0.035em] text-[#192a3a]"
                            >
                                {title}
                            </h2>

                            <p
                                id={descriptionId}
                                className="mt-3 text-sm font-medium leading-6 text-slate-500"
                            >
                                {confirmMessage}
                            </p>

                            <div
                                className={`mt-5 flex items-start gap-3 rounded-[16px] border p-4 ${styles.warning}`}
                            >
                                <Trash2
                                    size={18}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="text-xs font-black">
                                        Acción irreversible
                                    </p>

                                    <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
                                        Una vez eliminada la
                                        información, no podrá
                                        recuperarse desde el panel.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    disabled={pending}
                                    onClick={closeModal}
                                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>

                                <button
                                    ref={confirmButtonRef}
                                    type="submit"
                                    formAction={formAction}
                                    formNoValidate={
                                        formNoValidate
                                    }
                                    disabled={pending}
                                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition focus:outline-none focus:ring-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
                                >
                                    {pending ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="animate-spin"
                                            />

                                            {pendingText}
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={17} />
                                            {confirmText}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}