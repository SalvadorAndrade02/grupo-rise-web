/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { createLead } from "@/app/actions/lead-actions";
import { LeadModal, type LeadModalType } from "@/components/leads/LeadModal";

type CatalogLeadActionsProps = {
  brandName: string;
  modelName: string;
};

function getModalTitle(type: LeadModalType) {
  if (type === "CITA") {
    return "Agendar cita";
  }

  return "Solicitar información";
}

function getModalDescription(type: LeadModalType, fullModelName: string) {
  if (type === "CITA") {
    return `Déjanos tus datos para agendar una cita sobre ${fullModelName}.`;
  }

  return `Déjanos tus datos para recibir información sobre ${fullModelName}.`;
}

export function CatalogLeadActions({
  brandName,
  modelName,
}: CatalogLeadActionsProps) {
  const [modalType, setModalType] = useState<LeadModalType | null>(null);
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

      <LeadModal
        open={Boolean(modalType)}
        modalType={modalType}
        title={modalType ? getModalTitle(modalType) : ""}
        description={
          modalType ? getModalDescription(modalType, fullModelName) : ""
        }
        defaultMessage={
          modalType === "CITA"
            ? `Me interesa agendar una cita sobre el modelo ${fullModelName}.`
            : `Me interesa recibir información sobre el modelo ${fullModelName}.`
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