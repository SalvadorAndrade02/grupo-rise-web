"use server";

import { revalidatePath } from "next/cache";
import { LeadType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateLeadResult = {
  ok: boolean;
  message: string;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getStringValue(formData, key);

  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return undefined;
  }

  return numberValue;
}

function getLeadType(value: string): LeadType {
  if (
    value === "COTIZACION" ||
    value === "PRUEBA_MANEJO" ||
    value === "CITA" ||
    value === "SERVICIO" ||
    value === "FINANCIAMIENTO" ||
    value === "CONTACTO"
  ) {
    return value;
  }

  return "CONTACTO";
}

function getPreferredDate(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export async function createLead(
  formData: FormData
): Promise<CreateLeadResult> {
  const type = getLeadType(getStringValue(formData, "type"));
  const name = getStringValue(formData, "name");
  const phone = getStringValue(formData, "phone");
  const email = getStringValue(formData, "email");
  const message = getStringValue(formData, "message");
  const preferredDate = getPreferredDate(
    getStringValue(formData, "preferredDate")
  );
  const preferredTime = getStringValue(formData, "preferredTime");

  const vehicleId = getOptionalNumber(formData, "vehicleId");
  const branchId = getOptionalNumber(formData, "branchId");

  if (!name) {
    return {
      ok: false,
      message: "El nombre es obligatorio.",
    };
  }

  if (!phone) {
    return {
      ok: false,
      message: "El teléfono es obligatorio.",
    };
  }

  await prisma.lead.create({
    data: {
      type,
      name,
      phone,
      email: email || null,
      message: message || null,
      preferredDate,
      preferredTime: preferredTime || null,
      vehicleId,
      branchId,
    },
  });

  revalidatePath("/admin/leads");

  return {
    ok: true,
    message: "Solicitud enviada correctamente.",
  };
}