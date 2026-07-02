import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { LeadStatus, LeadType } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function getOptionalTextValue(formData: FormData, fieldName: string) {
  const value = getTextValue(formData, fieldName);

  return value || null;
}

function getNumberValue(formData: FormData, fieldName: string) {
  const value = Number(formData.get(fieldName));

  return Number.isFinite(value) ? value : 0;
}

function getOptionalDateValue(formData: FormData, fieldName: string) {
  const value = getTextValue(formData, fieldName);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildMessage(title: string, items: string[]) {
  return [title, ...items.filter(Boolean)].join("\n");
}

async function submitServiceRequest(formData: FormData) {
  "use server";

  const requestType = getTextValue(formData, "requestType");

  const name = getTextValue(formData, "name");
  const phone = getTextValue(formData, "phone");
  const email = getOptionalTextValue(formData, "email");
  const branchId = getNumberValue(formData, "branchId");
  const preferredDate = getOptionalDateValue(formData, "preferredDate");
  const preferredTime = getOptionalTextValue(formData, "preferredTime");

  if (!name || !phone || !branchId) {
    redirect(
      `/servicios?error=${encodeURIComponent(
        "Nombre, teléfono y sucursal son obligatorios."
      )}`
    );
  }

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      active: true,
    },
  });

  if (!branch) {
    redirect(
      `/servicios?error=${encodeURIComponent(
        "Selecciona una sucursal válida."
      )}`
    );
  }

  if (requestType === "SERVICE") {
    const vehicleBrand = getOptionalTextValue(formData, "vehicleBrand");
    const vehicleModel = getOptionalTextValue(formData, "vehicleModel");
    const vehicleYear = getOptionalTextValue(formData, "vehicleYear");
    const mileage = getOptionalTextValue(formData, "mileage");
    const serviceDetail = getTextValue(formData, "serviceDetail");

    if (!serviceDetail) {
      redirect(
        `/servicios?error=${encodeURIComponent(
          "Describe el servicio que necesitas."
        )}`
      );
    }

    const message = buildMessage("Solicitud de servicio / mantenimiento", [
      `Sucursal solicitada: ${branch.name}`,
      vehicleBrand ? `Marca: ${vehicleBrand}` : "",
      vehicleModel ? `Modelo: ${vehicleModel}` : "",
      vehicleYear ? `Año: ${vehicleYear}` : "",
      mileage ? `Kilometraje: ${mileage}` : "",
      preferredDate
        ? `Fecha preferida: ${preferredDate.toLocaleDateString("es-MX")}`
        : "",
      preferredTime ? `Hora preferida: ${preferredTime}` : "",
      "",
      "Detalle:",
      serviceDetail,
    ]);

    await prisma.lead.create({
      data: {
        type: LeadType.SERVICIO,
        status: LeadStatus.NUEVO,
        name,
        phone,
        email,
        branchId: branch.id,
        preferredDate,
        preferredTime,
        message,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath("/servicios");

    redirect("/gracias?tipo=servicio");
  }

  if (requestType === "PARTS") {
    const vehicleBrand = getOptionalTextValue(formData, "partsVehicleBrand");
    const vehicleModel = getOptionalTextValue(formData, "partsVehicleModel");
    const vehicleYear = getOptionalTextValue(formData, "partsVehicleYear");
    const partName = getTextValue(formData, "partName");
    const quantity = getOptionalTextValue(formData, "quantity");
    const partDetail = getTextValue(formData, "partDetail");

    if (!partName || !partDetail) {
      redirect(
        `/servicios?error=${encodeURIComponent(
          "Indica la refacción y describe lo que necesitas cotizar."
        )}`
      );
    }

    const message = buildMessage("Cotización de refacciones", [
      `Sucursal solicitada: ${branch.name}`,
      vehicleBrand ? `Marca: ${vehicleBrand}` : "",
      vehicleModel ? `Modelo: ${vehicleModel}` : "",
      vehicleYear ? `Año: ${vehicleYear}` : "",
      `Refacción solicitada: ${partName}`,
      quantity ? `Cantidad: ${quantity}` : "",
      preferredDate
        ? `Fecha preferida: ${preferredDate.toLocaleDateString("es-MX")}`
        : "",
      preferredTime ? `Hora preferida: ${preferredTime}` : "",
      "",
      "Detalle:",
      partDetail,
    ]);

    await prisma.lead.create({
      data: {
        type: LeadType.COTIZACION,
        status: LeadStatus.NUEVO,
        name,
        phone,
        email,
        branchId: branch.id,
        preferredDate,
        preferredTime,
        message,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath("/servicios");

    redirect("/gracias?tipo=refacciones");
  }

  redirect(
    `/servicios?error=${encodeURIComponent(
      "No se pudo identificar el tipo de solicitud."
    )}`
  );
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;

  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
  });

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="relative overflow-hidden bg-[var(--rise-navy)] px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_40%)]" />

        <Container>
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
              <Sparkles size={16} />
              Servicios Grupo Rise
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
              Agenda servicio o cotiza refacciones
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
              Por ahora puedes enviar una solicitud de servicio o una cotización
              de refacciones. Un asesor de Grupo Rise dará seguimiento desde la
              sucursal seleccionada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#servicio"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[var(--rise-navy)] transition hover:bg-blue-50"
              >
                Solicitar servicio
                <ArrowRight size={17} />
              </a>

              <a
                href="#refacciones"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"
              >
                Cotizar refacciones
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <Wrench size={24} className="text-blue-100" />
              <p className="mt-4 text-3xl font-black">Servicio</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Mantenimiento, revisión o diagnóstico.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <PackageSearch size={24} className="text-blue-100" />
              <p className="mt-4 text-3xl font-black">Refacciones</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Solicitud de piezas o accesorios.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <MessageSquare size={24} className="text-blue-100" />
              <p className="mt-4 text-3xl font-black">Seguimiento</p>
              <p className="mt-1 text-sm font-bold text-blue-100">
                Tu solicitud entra al CRM interno.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative z-10 -mt-10 px-4 pb-16 md:-mt-14 md:pb-20">
        <Container>
          {(params.success || params.error) && (
            <div
              className={`mb-6 rounded-2xl border p-4 text-sm font-black ${params.success
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-700"
                }`}
            >
              {params.success || params.error}
            </div>
          )}

          <div className="grid gap-8 xl:grid-cols-2">
            <section
              id="servicio"
              className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Settings size={28} />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                    Formulario
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Solicitar servicio
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Envía los datos de tu unidad y el tipo de servicio que
                    necesitas.
                  </p>
                </div>
              </div>

              <form action={submitServiceRequest} className="mt-8 grid gap-5">
                <input type="hidden" name="requestType" value="SERVICE" />

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    icon="user"
                    label="Nombre completo *"
                    name="name"
                    required
                    placeholder="Nombre del cliente"
                  />

                  <InputField
                    icon="phone"
                    label="Teléfono / WhatsApp *"
                    name="phone"
                    required
                    placeholder="81 1234 5678"
                  />

                  <InputField
                    icon="mail"
                    label="Correo"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                  />

                  <BranchSelect branches={branches} />

                  <InputField
                    label="Marca de la unidad"
                    name="vehicleBrand"
                    placeholder="Polaris, Can-Am, Triumph..."
                  />

                  <InputField
                    label="Modelo"
                    name="vehicleModel"
                    placeholder="RZR XP, Defender, Bonneville..."
                  />

                  <InputField
                    label="Año"
                    name="vehicleYear"
                    placeholder="2024"
                  />

                  <InputField
                    label="Kilometraje"
                    name="mileage"
                    placeholder="12,000 km"
                  />

                  <InputField
                    icon="calendar"
                    label="Fecha preferida"
                    name="preferredDate"
                    type="date"
                  />

                  <InputField
                    label="Hora preferida"
                    name="preferredTime"
                    type="time"
                  />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    ¿Qué servicio necesitas? *
                  </span>

                  <textarea
                    name="serviceDetail"
                    required
                    rows={5}
                    placeholder="Describe el servicio, falla, mantenimiento o revisión que necesitas."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  Enviar solicitud de servicio
                  <ArrowRight size={17} />
                </button>
              </form>
            </section>

            <section
              id="refacciones"
              className="rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-5 shadow-xl shadow-slate-900/10 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                  <PackageSearch size={28} />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">
                    Formulario
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Cotizar refacciones
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Solicita precio y disponibilidad de piezas, accesorios o
                    refacciones.
                  </p>
                </div>
              </div>

              <form action={submitServiceRequest} className="mt-8 grid gap-5">
                <input type="hidden" name="requestType" value="PARTS" />

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    icon="user"
                    label="Nombre completo *"
                    name="name"
                    required
                    placeholder="Nombre del cliente"
                  />

                  <InputField
                    icon="phone"
                    label="Teléfono / WhatsApp *"
                    name="phone"
                    required
                    placeholder="81 1234 5678"
                  />

                  <InputField
                    icon="mail"
                    label="Correo"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                  />

                  <BranchSelect branches={branches} />

                  <InputField
                    label="Marca de la unidad"
                    name="partsVehicleBrand"
                    placeholder="Polaris, Can-Am, Triumph..."
                  />

                  <InputField
                    label="Modelo"
                    name="partsVehicleModel"
                    placeholder="RZR XP, Defender, Bonneville..."
                  />

                  <InputField
                    label="Año"
                    name="partsVehicleYear"
                    placeholder="2024"
                  />

                  <InputField
                    label="Refacción solicitada *"
                    name="partName"
                    required
                    placeholder="Filtro, llanta, defensa, accesorio..."
                  />

                  <InputField
                    label="Cantidad"
                    name="quantity"
                    placeholder="1, 2, 4..."
                  />

                  <InputField
                    icon="calendar"
                    label="Fecha preferida"
                    name="preferredDate"
                    type="date"
                  />

                  <InputField
                    label="Hora preferida"
                    name="preferredTime"
                    type="time"
                  />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Detalle de la cotización *
                  </span>

                  <textarea
                    name="partDetail"
                    required
                    rows={5}
                    placeholder="Describe la pieza, número de parte si lo tienes, versión de la unidad o cualquier detalle importante."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-amber-500 focus:bg-white"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 text-sm font-black text-white transition hover:bg-amber-700"
                >
                  Enviar cotización de refacciones
                  <ArrowRight size={17} />
                </button>
              </form>
            </section>
          </div>

          <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
            <div className="grid gap-5 md:grid-cols-3">
              <InfoItem
                icon="check"
                title="Sin compromiso"
                description="El formulario solo registra la solicitud para que un asesor pueda dar seguimiento."
              />

              <InfoItem
                icon="shield"
                title="Sucursal asignada"
                description="La solicitud queda relacionada con la sucursal seleccionada."
              />

              <InfoItem
                icon="clipboard"
                title="Seguimiento en CRM"
                description="El equipo puede revisar y actualizar el estado desde el panel administrativo."
              />
            </div>
          </section>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function BranchSelect({
  branches,
}: {
  branches: {
    id: number;
    name: string;
    city: string;
    state: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        Sucursal *
      </span>

      <select
        name="branchId"
        required
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
      >
        <option value="">Selecciona una sucursal</option>

        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} · {branch.city}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  icon,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: "user" | "phone" | "mail" | "calendar";
}) {
  const Icon =
    icon === "user"
      ? User
      : icon === "phone"
        ? Phone
        : icon === "mail"
          ? Mail
          : icon === "calendar"
            ? CalendarDays
            : null;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white ${Icon ? "pl-11" : ""
            }`}
        />
      </div>
    </label>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: "check" | "shield" | "clipboard";
  title: string;
  description: string;
}) {
  const Icon =
    icon === "check"
      ? CheckCircle2
      : icon === "shield"
        ? ShieldCheck
        : ClipboardList;

  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
        <Icon size={22} />
      </div>

      <h3 className="mt-4 text-lg font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}