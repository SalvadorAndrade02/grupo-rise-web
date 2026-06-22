"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type RequestModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  requestType: string;
  vehicleName?: string;
  onClose: () => void;
};

export function RequestModal({
  isOpen,
  title,
  description,
  requestType,
  vehicleName,
  onClose,
}: RequestModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  function handleClose() {
    setIsSubmitted(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/30 md:p-8">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              {requestType}
            </p>

            <h3 className="mt-3 pr-10 text-3xl font-black tracking-tight text-slate-950">
              {title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>

            {vehicleName && (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Vehículo de interés
                </p>
                <p className="mt-1 font-black text-slate-950">
                  {vehicleName}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Nombre
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="Tu nombre"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Teléfono
                  </span>
                  <input
                    required
                    type="tel"
                    placeholder="33 1234 5678"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Correo
                </span>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Mensaje
                </span>
                <textarea
                  rows={4}
                  placeholder="Cuéntanos qué necesitas..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button type="submit" className="flex-1">
                  Enviar solicitud
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-3xl">
              ✓
            </div>

            <h3 className="mt-5 text-3xl font-black text-slate-950">
              Solicitud enviada
            </h3>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Un asesor de Grupo Rise se pondrá en contacto contigo para dar
              seguimiento a tu solicitud.
            </p>

            <Button onClick={handleClose} className="mt-7">
              Entendido
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}