"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  MapPin,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RequestModal } from "@/components/ui/RequestModal";

type ModalType = "financiamiento" | "servicio" | "sucursal" | null;

const services = ["Aceite", "Frenos", "Llantas", "Diagnóstico", "Batería"];

const modalContent = {
  financiamiento: {
    title: "Simula tu financiamiento",
    description:
      "Déjanos tus datos y un asesor te ayudará a revisar opciones de crédito para auto o moto.",
    requestType: "Financiamiento",
  },
  servicio: {
    title: "Agenda tu servicio",
    description:
      "Selecciona el tipo de servicio que necesitas y un asesor te contactará para confirmar disponibilidad.",
    requestType: "Servicio",
  },
  sucursal: {
    title: "Encuentra tu sucursal",
    description:
      "Compártenos tu ciudad o estado y te ayudaremos a ubicar la sucursal más cercana.",
    requestType: "Sucursal",
  },
};

export function InfoCards() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const currentModal = activeModal ? modalContent[activeModal] : null;

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <CreditCard size={24} />
            </div>

            <h3 className="mt-6 text-2xl font-black text-slate-950">
              Opciones de financiamiento
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Simula tu crédito en minutos y encuentra una opción para autos o
              motos nuevas y seminuevas.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Plazos</p>
                <p className="mt-1 font-black">60 meses</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Tasa desde</p>
                <p className="mt-1 font-black">8.49%</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Proceso</p>
                <p className="mt-1 font-black">En línea</p>
              </div>
            </div>

            <Button
              type="button"
              className="mt-7 w-full"
              onClick={() => setActiveModal("financiamiento")}
            >
              Simular financiamiento
              <ChevronRight size={18} />
            </Button>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Wrench size={24} />
            </div>

            <h3 className="mt-6 text-2xl font-black text-slate-950">
              Agenda el mantenimiento
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Servicio especializado para autos y motos con técnicos
              certificados.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  {service}
                </span>
              ))}
            </div>

            <Button
              type="button"
              className="mt-7 w-full"
              onClick={() => setActiveModal("servicio")}
            >
              <CalendarDays size={18} />
              Agendar servicio
            </Button>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <MapPin size={24} />
            </div>

            <h3 className="mt-6 text-2xl font-black text-slate-950">
              Encuentra tu sucursal
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ubica la agencia más cercana, revisa inventario por ciudad y
              contacta a un asesor.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5">
              <div className="grid h-40 place-items-center rounded-2xl bg-white text-center text-sm font-bold text-slate-500">
                Vista previa de mapa
              </div>
            </div>

            <Button
              type="button"
              className="mt-7 w-full"
              onClick={() => setActiveModal("sucursal")}
            >
              Ver sucursales
              <ChevronRight size={18} />
            </Button>
          </article>
        </div>
      </Container>

      {currentModal && (
        <RequestModal
          isOpen={Boolean(activeModal)}
          title={currentModal.title}
          description={currentModal.description}
          requestType={currentModal.requestType}
          onClose={() => setActiveModal(null)}
        />
      )}
    </section>
  );
}