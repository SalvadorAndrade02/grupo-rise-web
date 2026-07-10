/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

export type LeadModalType =
  | "COTIZACION"
  | "PRUEBA_MANEJO"
  | "CITA"
  | "CONTACTO"
  | "SERVICIO"
  | "FINANCIAMIENTO";

type LeadModalProps = {
  open: boolean;
  modalType: LeadModalType | null;
  title: string;
  description: string;
  defaultMessage: string;
  errorMessage?: string;
  successMessage?: string;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
};

function needsDateTime(
  modalType: LeadModalType | null
) {
  return (
    modalType === "PRUEBA_MANEJO" ||
    modalType === "CITA"
  );
}

function getModalEyebrow(
  modalType: LeadModalType
) {
  switch (modalType) {
    case "COTIZACION":
      return "Cotización de vehículo";

    case "PRUEBA_MANEJO":
      return "Experiencia de manejo";

    case "CITA":
      return "Agenda tu visita";

    case "SERVICIO":
      return "Servicio y mantenimiento";

    case "FINANCIAMIENTO":
      return "Opciones de financiamiento";

    case "CONTACTO":
      return "Atención personalizada";

    default:
      return "Grupo Rise";
  }
}

function getSubmitLabel(
  modalType: LeadModalType,
  isPending: boolean
) {
  if (isPending) {
    return "Enviando solicitud...";
  }

  if (
    modalType === "PRUEBA_MANEJO" ||
    modalType === "CITA"
  ) {
    return "Solicitar cita";
  }

  if (modalType === "COTIZACION") {
    return "Solicitar cotización";
  }

  return "Enviar solicitud";
}

export function LeadModal({
  open,
  modalType,
  title,
  description,
  defaultMessage,
  errorMessage,
  successMessage,
  isPending = false,
  onClose,
  onSubmit,
}: LeadModalProps) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !isPending
      ) {
        onClose();
      }
    }

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, isPending, onClose]);

  if (
    !mounted ||
    !open ||
    !modalType
  ) {
    return null;
  }

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target === event.currentTarget &&
      !isPending
    ) {
      onClose();
    }
  }

  const showDateTime =
    needsDateTime(modalType);

  const eyebrow =
    getModalEyebrow(modalType);

  const submitLabel = getSubmitLabel(
    modalType,
    isPending
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      aria-describedby="lead-modal-description"
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#071019]/90 px-4 py-5 backdrop-blur-sm md:py-10"
    >
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center">
        <div
          onMouseDown={(event) =>
            event.stopPropagation()
          }
          className="relative w-full overflow-hidden rounded-[22px] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.4)]"
        >
          {/* Encabezado */}
          <header className="relative overflow-hidden bg-[#192a3a] px-5 py-6 pr-16 text-white md:px-7 md:py-7 md:pr-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_35%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.95))]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#dfe7ec] backdrop-blur-sm">
                <Sparkles size={13} />
                {eyebrow}
              </div>

              <h2
                id="lead-modal-title"
                className="mt-4 text-2xl font-black leading-tight tracking-[-0.035em] md:text-3xl"
              >
                {title}
              </h2>

              <p
                id="lead-modal-description"
                className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/60"
              >
                {description}
              </p>
            </div>
          </header>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar formulario"
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#192a3a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>

          <div className="max-h-[calc(100dvh-2.5rem)] overflow-y-auto md:max-h-[calc(100dvh-5rem)]">
            {successMessage ? (
              <SuccessContent
                message={successMessage}
                onClose={onClose}
              />
            ) : (
              <form
                onSubmit={onSubmit}
                aria-busy={isPending}
                className="p-5 md:p-7"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <ModalInput
                    icon={<User size={17} />}
                    label="Nombre completo"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Nombre del cliente"
                  />

                  <ModalInput
                    icon={<Phone size={17} />}
                    label="Teléfono / WhatsApp"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Ej. 8112345678"
                  />

                  <div className="md:col-span-2">
                    <ModalInput
                      icon={<Mail size={17} />}
                      label="Correo electrónico"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {showDateTime && (
                    <>
                      <ModalInput
                        icon={
                          <CalendarDays
                            size={17}
                          />
                        }
                        label="Fecha preferida"
                        name="preferredDate"
                        type="date"
                      />

                      <ModalInput
                        icon={<Clock3 size={17} />}
                        label="Hora preferida"
                        name="preferredTime"
                        type="time"
                      />
                    </>
                  )}

                  <label className="block md:col-span-2">
                    <FieldLabel
                      icon={
                        <MessageSquare
                          size={14}
                        />
                      }
                      text="Mensaje"
                    />

                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Cuéntanos qué necesitas..."
                      defaultValue={
                        defaultMessage
                      }
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

                    <span>
                      {errorMessage}
                    </span>
                  </div>
                )}

                <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white shadow-[0_8px_22px_rgba(25,42,58,0.18)] transition hover:-translate-y-0.5 hover:bg-[#29465c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isPending ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : showDateTime ? (
                      <CalendarDays
                        size={18}
                      />
                    ) : (
                      <Send
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                      />
                    )}

                    {submitLabel}
                  </button>
                </div>

                <p className="mt-4 text-center text-xs font-medium leading-5 text-slate-400">
                  Un asesor utilizará los datos
                  proporcionados para dar
                  seguimiento a esta solicitud.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

type ModalInputProps = {
  icon: ReactNode;
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

function ModalInput({
  icon,
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
  inputMode,
}: ModalInputProps) {
  return (
    <label className="block">
      <FieldLabel
        icon={icon}
        text={label}
        required={required}
      />

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-slate-400">
          {icon}
        </span>

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

function FieldLabel({
  icon,
  text,
  required = false,
}: {
  icon: ReactNode;
  text: string;
  required?: boolean;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-slate-500">
      <span className="text-[#192a3a]">
        {icon}
      </span>

      {text}

      {required && (
        <span
          aria-hidden="true"
          className="text-red-500"
        >
          *
        </span>
      )}
    </span>
  );
}

function SuccessContent({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="p-6 text-center md:p-9">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-emerald-50 text-emerald-600">
        <CheckCircle2
          size={42}
          strokeWidth={2}
        />
      </span>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.23em] text-emerald-600">
        Solicitud registrada
      </p>

      <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#0a0f14] md:text-3xl">
        Tus datos fueron enviados
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-7 text-slate-500">
        {message}
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-xl border border-[#192a3a]/10 bg-[#e7edf1] px-4 py-3 text-sm font-semibold leading-6 text-[#192a3a]">
        Un asesor de Grupo Rise revisará la
        información y se pondrá en contacto
        contigo.
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#192a3a] px-6 text-sm font-black text-white transition hover:bg-[#29465c] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
      >
        Cerrar
      </button>
    </div>
  );
}