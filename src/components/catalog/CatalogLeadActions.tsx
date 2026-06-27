"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { createLead } from "@/app/actions/lead-actions";

type CatalogLeadType = "COTIZACION" | "CITA";

type CatalogLeadActionsProps = {
  brandName: string;
  modelName: string;
};

function getModalTitle(type: CatalogLeadType) {
  if (type === "CITA") {
    return "Agendar cita";
  }

  return "Solicitar información";
}

function getModalDescription(type: CatalogLeadType, fullModelName: string) {
  if (type === "CITA") {
    return `Déjanos tus datos para agendar una cita sobre ${fullModelName}.`;
  }

  return `Déjanos tus datos para recibir información sobre ${fullModelName}.`;
}

export function CatalogLeadActions({
  brandName,
  modelName,
}: CatalogLeadActionsProps) {
  const [modalType, setModalType] = useState<CatalogLeadType | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fullModelName = `${brandName} ${modelName}`;

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const currentMessage = String(formData.get("message") ?? "").trim();

    formData.set(
      "message",
      currentMessage ||
      `Me interesa recibir información sobre el modelo ${fullModelName}.`
    );

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
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setModalType("COTIZACION");
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
      >
        <MessageCircle size={18} />
        Solicitar información
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setModalType("CITA");
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
      >
        <CalendarDays size={18} />
        Agendar cita
      </button>
    </div>

    {mounted &&
      modalType &&
      createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm md:py-10">
          <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
              <button
                type="button"
                onClick={closeModal}
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
                    {getModalTitle(modalType)}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getModalDescription(modalType, fullModelName)}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
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

                  {modalType === "CITA" && (
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
                      defaultValue={
                        modalType === "CITA"
                          ? `Me interesa agendar una cita sobre el modelo ${fullModelName}.`
                          : `Me interesa recibir información sobre el modelo ${fullModelName}.`
                      }
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
                      onClick={closeModal}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={18} />
                      {isPending ? "Enviando..." : "Enviar solicitud"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
  </>
);
}