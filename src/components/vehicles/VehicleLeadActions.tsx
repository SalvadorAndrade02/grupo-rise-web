/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { createLead } from "@/app/actions/lead-actions";
import { LeadModal, type LeadModalType } from "@/components/leads/LeadModal";
import { CalendarDays, Send } from "lucide-react";

type VehicleLeadActionsProps = {
  vehicleId: number;
  branchId: number;
  vehicleName: string;
  whatsapp?: string | null;
  mode?: "compact" | "stack";
};

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

export function VehicleLeadActions({
  vehicleId,
  branchId,
  vehicleName,
  mode = "compact",
}: VehicleLeadActionsProps) {
  const [modalType, setModalType] = useState<LeadModalType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

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
    <div
      className={
        mode === "stack" ? "grid gap-3" : "grid gap-2 sm:grid-cols-2"
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setModalType("COTIZACION");
        }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
      >
        <Send size={17} />
        Cotizar
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setModalType("PRUEBA_MANEJO");
        }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--rise-border)] bg-white px-4 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
      >
        <CalendarDays size={17} />
        Prueba
      </button>
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