/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CheckCircle2, Send, X } from "lucide-react";

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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function needsDateTime(modalType: LeadModalType | null) {
  return modalType === "PRUEBA_MANEJO" || modalType === "CITA";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open || !modalType) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm md:py-10">
      <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="border-b border-slate-100 p-5 pr-16 md:p-6 md:pr-16">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Grupo Rise
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--rise-navy)]">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="grid gap-4 p-5 md:grid-cols-2 md:p-6"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nombre completo
                </span>

                <input
                  name="name"
                  required
                  placeholder="Nombre del cliente"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
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
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Correo
                </span>

                <input
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              {needsDateTime(modalType) && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                      Fecha preferida
                    </span>

                    <input
                      name="preferredDate"
                      type="date"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                      Hora preferida
                    </span>

                    <input
                      name="preferredTime"
                      type="time"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
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
                  rows={3}
                  placeholder="Cuéntanos qué necesitas..."
                  defaultValue={defaultMessage}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                />
              </label>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 md:col-span-2">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 md:col-span-2">
                  <CheckCircle2 size={18} />
                  {successMessage}
                </div>
              )}

              <div className="grid gap-3 pt-1 md:col-span-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modalType === "CITA" || modalType === "PRUEBA_MANEJO" ? (
                    <CalendarDays size={18} />
                  ) : (
                    <Send size={18} />
                  )}

                  {isPending ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}