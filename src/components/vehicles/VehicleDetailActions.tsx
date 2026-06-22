"use client";

import { useState } from "react";
import { CalendarDays, MessageCircle } from "lucide-react";
import { RequestModal } from "@/components/ui/RequestModal";

type VehicleDetailActionsProps = {
  vehicleName: string;
  whatsapp?: string | null;
};

export function VehicleDetailActions({
  vehicleName,
  whatsapp,
}: VehicleDetailActionsProps) {
  const [activeModal, setActiveModal] = useState<
    "cotizacion" | "prueba" | null
  >(null);

  const cleanWhatsapp = whatsapp?.replace(/\D/g, "");

  return (
    <>
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => setActiveModal("cotizacion")}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          Solicitar cotización
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("prueba")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
        >
          <CalendarDays size={18} />
          Agendar prueba
        </button>

        {cleanWhatsapp && (
          <a
            href={`https://wa.me/52${cleanWhatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
          >
            <MessageCircle size={18} />
            Contactar por WhatsApp
          </a>
        )}
      </div>

      <RequestModal
        isOpen={activeModal === "cotizacion"}
        title="Solicita una cotización"
        description="Déjanos tus datos y un asesor de Grupo Rise te contactará para compartirte precio, disponibilidad y opciones de financiamiento."
        requestType="Cotización"
        vehicleName={vehicleName}
        onClose={() => setActiveModal(null)}
      />

      <RequestModal
        isOpen={activeModal === "prueba"}
        title="Agenda una prueba"
        description="Déjanos tus datos y un asesor de Grupo Rise te contactará para confirmar disponibilidad y horario."
        requestType="Prueba de manejo"
        vehicleName={vehicleName}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}