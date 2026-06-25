"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { createLead } from "@/app/actions/lead-actions";

type LeadModalType = "COTIZACION" | "PRUEBA_MANEJO";

type VehicleDetailActionsProps = {
  vehicleId: number;
  branchId: number;
  vehicleName: string;
  whatsapp?: string | null;
};

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppUrl(whatsapp?: string | null, vehicleName?: string) {
  const clean = cleanPhone(whatsapp);

  if (!clean) {
    return "#";
  }

  const phoneWithCountryCode = clean.startsWith("52") ? clean : `52${clean}`;

  const message = encodeURIComponent(
    `Hola, me interesa recibir información sobre ${vehicleName}.`
  );

  return `https://wa.me/${phoneWithCountryCode}?text=${message}`;
}

function getModalTitle(type: LeadModalType) {
  if (type === "PRUEBA_MANEJO") {
    return "Agendar prueba de manejo";
  }

  return "Solicitar cotización";
}

function getModalDescription(type: LeadModalType, vehicleName: string) {
  if (type === "PRUEBA_MANEJO") {
    return `Déjanos tus datos para agendar una prueba de manejo de ${vehicleName}.`;
  }

  return `Déjanos tus datos para enviarte una cotización de ${vehicleName}.`;
}

export function VehicleDetailActions({
  vehicleId,
  branchId,
  vehicleName,
  whatsapp,
}: VehicleDetailActionsProps) {
  const [modalType, setModalType] = useState<LeadModalType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const whatsappUrl = getWhatsAppUrl(whatsapp, vehicleName);

  function closeModal() {
    setModalType(null);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalType) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.set("type", modalType);
    formData.set("vehicleId", String(vehicleId));
    formData.set("branchId", String(branchId));

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
    <>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setModalType("COTIZACION")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <Send size={18} />
          Solicitar cotización
        </button>

        <button
          type="button"
          onClick={() => setModalType("PRUEBA_MANEJO")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-4 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
        >
          <CalendarDays size={18} />
          Agendar prueba de manejo
        </button>

        {cleanPhone(whatsapp) && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/30 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Grupo Rise
                </p>

                <h2 className="mt-2 text-3xl font-black text-[var(--rise-navy)]">
                  {getModalTitle(modalType)}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {getModalDescription(modalType, vehicleName)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
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

              <label className="block md:col-span-2">
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

              {modalType === "PRUEBA_MANEJO" && (
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
                  defaultValue={
                    modalType === "COTIZACION"
                      ? `Me interesa recibir una cotización de ${vehicleName}.`
                      : `Me interesa agendar una prueba de manejo de ${vehicleName}.`
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
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

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={18} />
                  {isPending ? "Enviando..." : "Enviar solicitud"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}