"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  CalendarDays,
  MessageCircle,
  Send,
} from "lucide-react";
import { createLead } from "@/app/actions/lead-actions";
import {
  LeadModal,
  type LeadModalType,
} from "@/components/leads/LeadModal";

type VehicleDetailActionsProps = {
  vehicleId: number;
  branchId: number;
  vehicleName: string;
  whatsapp?: string | null;
};

function cleanPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function getWhatsAppUrl(
  whatsapp?: string | null,
  vehicleName?: string
) {
  const clean = cleanPhone(whatsapp);

  if (!clean) {
    return "#";
  }

  const phoneWithCountryCode = clean.startsWith("52")
    ? clean
    : `52${clean}`;

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

function getModalDescription(
  type: LeadModalType,
  vehicleName: string
) {
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
  const [modalType, setModalType] =
    useState<LeadModalType | null>(null);

  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const whatsappUrl = getWhatsAppUrl(
    whatsapp,
    vehicleName
  );

  const hasWhatsapp = Boolean(cleanPhone(whatsapp));

  function openModal(type: LeadModalType) {
    setSuccessMessage("");
    setErrorMessage("");
    setModalType(type);
  }

  function closeModal() {
    setModalType(null);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
      {/* Acciones normales */}
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => openModal("COTIZACION")}
          className="group inline-flex h-12 w-full items-center justify-center gap-3 bg-[var(--public-header)] px-5 text-sm font-black !text-white shadow-[0_8px_22px_rgba(18,24,28,0.14)] transition hover:-translate-y-0.5 hover:bg-[var(--public-accent-dark)]"
        >
          <Send
            size={18}
            className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
          />

          Solicitar cotización
        </button>

        <button
          type="button"
          onClick={() => openModal("PRUEBA_MANEJO")}
          className="inline-flex h-12 w-full items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-5 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-ink)] hover:bg-[var(--public-ink)] hover:!text-white"        >
          <CalendarDays size={18} />
          Agendar prueba de manejo
        </button>

        {hasWhatsapp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-3 border border-emerald-600 bg-emerald-600 px-5 text-sm font-black !text-white transition hover:bg-emerald-700"          >
            <MessageCircle size={18} />
            Solicitar información por WhatsApp
          </a>
        )}
      </div>

      {/* Espacio para que la barra móvil no cubra contenido */}
      <div
        aria-hidden="true"
        className="h-24 lg:hidden"
      />

      {/* Barra fija en celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
        <div
          className={`mx-auto grid max-w-xl gap-2 ${hasWhatsapp
            ? "grid-cols-2"
            : "grid-cols-1"
            }`}
        >
          <button
            type="button"
            onClick={() => openModal("COTIZACION")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-4 text-xs font-black text-white transition active:scale-[0.98] active:bg-[#29465c]"
          >
            <Send size={17} />
            Cotizar
          </button>

          {hasWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition active:scale-[0.98] active:bg-emerald-700"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <LeadModal
        open={Boolean(modalType)}
        modalType={modalType}
        title={modalType ? getModalTitle(modalType) : ""}
        description={
          modalType
            ? getModalDescription(
              modalType,
              vehicleName
            )
            : ""
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