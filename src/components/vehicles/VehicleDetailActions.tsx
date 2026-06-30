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
import { LeadModal, type LeadModalType } from "@/components/leads/LeadModal";

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
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <Send size={18} />
          Solicitar cotización
        </button>

        <button
          type="button"
          onClick={() => setModalType("PRUEBA_MANEJO")}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
        >
          <CalendarDays size={18} />
          Agendar prueba de manejo
        </button>

        {cleanPhone(whatsapp) && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
      </div>

      <LeadModal
        open={Boolean(modalType)}
        modalType={modalType}
        title={modalType ? getModalTitle(modalType) : ""}
        description={
          modalType ? getModalDescription(modalType, vehicleName) : ""
        }
        defaultMessage={
          modalType === "COTIZACION"
            ? `Me interesa recibir una cotización de ${vehicleName}.`
            : `Me interesa agendar una prueba de manejo de ${vehicleName}.`
        }
        errorMessage={errorMessage}
        successMessage={successMessage}
        isPending={isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}