import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mail,
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

function getTextValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getOptionalTextValue(
  formData: FormData,
  fieldName: string
) {
  const value = getTextValue(
    formData,
    fieldName
  );

  return value || null;
}

function getNumberValue(
  formData: FormData,
  fieldName: string
) {
  const value = Number(
    formData.get(fieldName)
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function getOptionalDateValue(
  formData: FormData,
  fieldName: string
) {
  const value = getTextValue(
    formData,
    fieldName
  );

  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function buildMessage(
  title: string,
  items: string[]
) {
  return [
    title,
    ...items.filter(Boolean),
  ].join("\n");
}

async function submitServiceRequest(
  formData: FormData
) {
  "use server";

  const requestType = getTextValue(
    formData,
    "requestType"
  );

  const name = getTextValue(
    formData,
    "name"
  );

  const phone = getTextValue(
    formData,
    "phone"
  );

  const email = getOptionalTextValue(
    formData,
    "email"
  );

  const branchId = getNumberValue(
    formData,
    "branchId"
  );

  const preferredDate =
    getOptionalDateValue(
      formData,
      "preferredDate"
    );

  const preferredTime =
    getOptionalTextValue(
      formData,
      "preferredTime"
    );

  if (!name || !phone || !branchId) {
    redirect(
      `/servicios?error=${encodeURIComponent(
        "Nombre, teléfono y sucursal son obligatorios."
      )}`
    );
  }

  const branch =
    await prisma.branch.findFirst({
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
    const vehicleBrand =
      getOptionalTextValue(
        formData,
        "vehicleBrand"
      );

    const vehicleModel =
      getOptionalTextValue(
        formData,
        "vehicleModel"
      );

    const vehicleYear =
      getOptionalTextValue(
        formData,
        "vehicleYear"
      );

    const mileage =
      getOptionalTextValue(
        formData,
        "mileage"
      );

    const serviceDetail =
      getTextValue(
        formData,
        "serviceDetail"
      );

    if (!serviceDetail) {
      redirect(
        `/servicios?error=${encodeURIComponent(
          "Describe el servicio que necesitas."
        )}`
      );
    }

    const message = buildMessage(
      "Solicitud de servicio / mantenimiento",
      [
        `Sucursal solicitada: ${branch.name}`,
        vehicleBrand
          ? `Marca: ${vehicleBrand}`
          : "",
        vehicleModel
          ? `Modelo: ${vehicleModel}`
          : "",
        vehicleYear
          ? `Año: ${vehicleYear}`
          : "",
        mileage
          ? `Kilometraje: ${mileage}`
          : "",
        preferredDate
          ? `Fecha preferida: ${preferredDate.toLocaleDateString(
            "es-MX"
          )}`
          : "",
        preferredTime
          ? `Hora preferida: ${preferredTime}`
          : "",
        "",
        "Detalle:",
        serviceDetail,
      ]
    );

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

    redirect(
      "/gracias?tipo=servicio"
    );
  }

  if (requestType === "PARTS") {
    const vehicleBrand =
      getOptionalTextValue(
        formData,
        "partsVehicleBrand"
      );

    const vehicleModel =
      getOptionalTextValue(
        formData,
        "partsVehicleModel"
      );

    const vehicleYear =
      getOptionalTextValue(
        formData,
        "partsVehicleYear"
      );

    const partName = getTextValue(
      formData,
      "partName"
    );

    const quantity =
      getOptionalTextValue(
        formData,
        "quantity"
      );

    const partDetail =
      getTextValue(
        formData,
        "partDetail"
      );

    if (!partName || !partDetail) {
      redirect(
        `/servicios?error=${encodeURIComponent(
          "Indica la refacción y describe lo que necesitas cotizar."
        )}`
      );
    }

    const message = buildMessage(
      "Cotización de refacciones",
      [
        `Sucursal solicitada: ${branch.name}`,
        vehicleBrand
          ? `Marca: ${vehicleBrand}`
          : "",
        vehicleModel
          ? `Modelo: ${vehicleModel}`
          : "",
        vehicleYear
          ? `Año: ${vehicleYear}`
          : "",
        `Refacción solicitada: ${partName}`,
        quantity
          ? `Cantidad: ${quantity}`
          : "",
        preferredDate
          ? `Fecha preferida: ${preferredDate.toLocaleDateString(
            "es-MX"
          )}`
          : "",
        preferredTime
          ? `Hora preferida: ${preferredTime}`
          : "",
        "",
        "Detalle:",
        partDetail,
      ]
    );

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

    redirect(
      "/gracias?tipo=refacciones"
    );
  }

  redirect(
    `/servicios?error=${encodeURIComponent(
      "No se pudo identificar el tipo de solicitud."
    )}`
  );
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const params = await searchParams;

  const branches =
    await prisma.branch.findMany({
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
    <>
      <Header />

      <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
        {/* Encabezado */}
        <section className="relative overflow-hidden bg-[#192a3a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_30%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

          <Container>
            <div className="relative py-12 lg:py-16">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec] backdrop-blur-sm">
                  <Sparkles size={15} />
                  Servicios Grupo Rise
                </div>

                <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] md:text-5xl lg:text-6xl">
                  Servicio y refacciones para tu vehículo
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/65 md:text-base">
                  Solicita mantenimiento, diagnóstico
                  o una cotización de refacciones.
                  Selecciona la sucursal y nuestro
                  equipo dará seguimiento a tu
                  solicitud.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#servicio"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] active:scale-[0.98]"
                  >
                    Solicitar servicio

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </a>

                  <a
                    href="#refacciones"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98]"
                  >
                    Cotizar refacciones

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </a>
                </div>
              </div>

              {/* Resumen compacto */}
              <div className="mt-9 grid gap-3 md:grid-cols-3">
                <ServiceSummary
                  icon={Wrench}
                  title="Servicio"
                  description="Mantenimiento, revisión y diagnóstico."
                />

                <ServiceSummary
                  icon={PackageSearch}
                  title="Refacciones"
                  description="Piezas, accesorios y disponibilidad."
                />

                <ServiceSummary
                  icon={MessageSquare}
                  title="Seguimiento"
                  description="La solicitud llega al equipo de la sucursal."
                />
              </div>
            </div>
          </Container>
        </section>

        <section className="py-10 md:py-12 lg:py-14">
          <Container>
            {(params.success ||
              params.error) && (
                <div
                  className={`mb-7 rounded-xl border px-5 py-4 text-sm font-black ${params.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                  {params.success ||
                    params.error}
                </div>
              )}

            {/* Accesos */}
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <a
                href="#servicio"
                className="group flex items-center justify-between rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:border-[#192a3a]/40 active:border-[#192a3a]/40"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                    <Settings size={22} />
                  </span>

                  <div>
                    <p className="text-lg font-black">
                      Solicitar servicio
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Mantenimiento o diagnóstico.
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={19}
                  className="shrink-0 text-[#192a3a] transition-transform group-hover:translate-x-1 group-active:translate-x-1"
                />
              </a>

              <a
                href="#refacciones"
                className="group flex items-center justify-between rounded-[20px] border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:border-[#192a3a]/40 active:border-[#192a3a]/40"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
                    <PackageSearch size={22} />
                  </span>

                  <div>
                    <p className="text-lg font-black">
                      Cotizar refacciones
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Piezas, accesorios y disponibilidad.
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={19}
                  className="shrink-0 text-[#192a3a] transition-transform group-hover:translate-x-1 group-active:translate-x-1"
                />
              </a>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              {/* Servicio */}
              <section
                id="servicio"
                className="scroll-mt-[125px] rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-7"
              >
                <FormHeader
                  icon={Settings}
                  eyebrow="Mantenimiento"
                  title="Solicitar servicio"
                  description="Comparte la información de tu unidad y describe el servicio, revisión o diagnóstico que necesitas."
                />

                <form
                  action={
                    submitServiceRequest
                  }
                  className="mt-7 grid gap-5"
                >
                  <input
                    type="hidden"
                    name="requestType"
                    value="SERVICE"
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <InputField
                      icon="user"
                      label="Nombre completo *"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Nombre del cliente"
                    />

                    <InputField
                      icon="phone"
                      label="Teléfono / WhatsApp *"
                      name="phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      placeholder="81 1234 5678"
                    />

                    <InputField
                      icon="mail"
                      label="Correo"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                    />

                    <BranchSelect
                      branches={branches}
                    />

                    <InputField
                      label="Marca de la unidad"
                      name="vehicleBrand"
                      placeholder="Polaris, Can-Am..."
                    />

                    <InputField
                      label="Modelo"
                      name="vehicleModel"
                      placeholder="RZR XP, Defender..."
                    />

                    <InputField
                      label="Año"
                      name="vehicleYear"
                      inputMode="numeric"
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

                  <TextAreaField
                    label="¿Qué servicio necesitas? *"
                    name="serviceDetail"
                    required
                    placeholder="Describe el servicio, falla, mantenimiento o revisión que necesitas."
                  />

                  <button
                    type="submit"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#29465c] active:scale-[0.98]"
                  >
                    Enviar solicitud

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </button>
                </form>
              </section>

              {/* Refacciones */}
              <section
                id="refacciones"
                className="scroll-mt-[125px] rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-7"
              >
                <FormHeader
                  icon={PackageSearch}
                  eyebrow="Piezas y accesorios"
                  title="Cotizar refacciones"
                  description="Solicita precio y disponibilidad de piezas, accesorios o refacciones para tu unidad."
                />

                <form
                  action={
                    submitServiceRequest
                  }
                  className="mt-7 grid gap-5"
                >
                  <input
                    type="hidden"
                    name="requestType"
                    value="PARTS"
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <InputField
                      icon="user"
                      label="Nombre completo *"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Nombre del cliente"
                    />

                    <InputField
                      icon="phone"
                      label="Teléfono / WhatsApp *"
                      name="phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      placeholder="81 1234 5678"
                    />

                    <InputField
                      icon="mail"
                      label="Correo"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                    />

                    <BranchSelect
                      branches={branches}
                    />

                    <InputField
                      label="Marca de la unidad"
                      name="partsVehicleBrand"
                      placeholder="Polaris, Can-Am..."
                    />

                    <InputField
                      label="Modelo"
                      name="partsVehicleModel"
                      placeholder="RZR XP, Defender..."
                    />

                    <InputField
                      label="Año"
                      name="partsVehicleYear"
                      inputMode="numeric"
                      placeholder="2024"
                    />

                    <InputField
                      label="Refacción solicitada *"
                      name="partName"
                      required
                      placeholder="Filtro, llanta, defensa..."
                    />

                    <InputField
                      label="Cantidad"
                      name="quantity"
                      inputMode="numeric"
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

                  <TextAreaField
                    label="Detalle de la cotización *"
                    name="partDetail"
                    required
                    placeholder="Describe la pieza, número de parte, versión de la unidad o cualquier detalle importante."
                  />

                  <button
                    type="submit"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#192a3a] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#29465c] active:scale-[0.98]"
                  >
                    Solicitar cotización

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                    />
                  </button>
                </form>
              </section>
            </div>

            {/* Información final */}
            <section className="mt-8 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] md:p-7">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoItem
                  icon={CheckCircle2}
                  title="Sin compromiso"
                  description="El envío del formulario solo registra la solicitud para que un asesor pueda contactarte."
                />

                <InfoItem
                  icon={ShieldCheck}
                  title="Sucursal asignada"
                  description="La solicitud queda relacionada con la agencia que hayas seleccionado."
                />

                <InfoItem
                  icon={ClipboardList}
                  title="Seguimiento interno"
                  description="El equipo puede revisar y actualizar el estado desde el panel administrativo."
                />
              </div>
            </section>

            <div className="mt-8 text-center">
              <p className="text-sm font-semibold text-slate-500">
                También puedes consultar las
                ubicaciones y medios de contacto de
                nuestras agencias.
              </p>

              <Link
                href="/sucursales"
                className="group mt-4 inline-flex items-center gap-2 text-sm font-black text-[#192a3a]"
              >
                Ver sucursales

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1 group-active:translate-x-1"
                />
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ServiceSummary({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Wrench;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[18px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#dfe7ec]">
        <Icon size={19} />
      </span>

      <div>
        <p className="font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-xs font-medium leading-5 text-white/55">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Settings;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
        <Icon size={22} />
      </span>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] md:text-3xl">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        Sucursal *
      </span>

      <select
        name="branchId"
        required
        defaultValue=""
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white"
      >
        <option value="" disabled>
          Selecciona una sucursal
        </option>

        {branches.map((branch) => (
          <option
            key={branch.id}
            value={branch.id}
          >
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
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?:
  | "user"
  | "phone"
  | "mail"
  | "calendar";
  autoComplete?: string;
  inputMode?:
  | "none"
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url";
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white ${Icon ? "pl-11" : ""
            }`}
        />
      </div>
    </label>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <textarea
        name={name}
        required={required}
        rows={5}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white"
      />
    </label>
  );
}

function InfoItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fafb] p-5">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a]">
        <Icon size={19} />
      </span>

      <h3 className="mt-4 text-lg font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}