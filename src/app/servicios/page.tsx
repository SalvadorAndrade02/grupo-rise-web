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
  User,
  Wrench,
} from "lucide-react";
import { LeadStatus, LeadType } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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

      <main className="public-home">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--public-header)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%)]" />

          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-white/[0.06] lg:block" />

          <div className="public-container relative grid min-h-[500px] items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-white" />

                <p className="text-xs font-black uppercase tracking-[0.24em] text-white">
                  Servicios Grupo RISE
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white md:text-6xl xl:text-7xl">
                Atención para
                <span className="block text-white">
                  tu vehículo.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white md:text-lg">
                Envía una solicitud de servicio o consulta la disponibilidad
                de piezas y refacciones seleccionando la agencia que deseas.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#servicio"
                  className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-accent)] px-6 text-sm font-black !text-white transition hover:bg-[var(--public-accent-dark)]"
                >
                  Solicitar servicio

                  <ArrowRight
                    size={17}
                    className="text-white transition-transform group-hover:translate-x-0.5"
                  />
                </a>

                <a
                  href="#refacciones"
                  className="group inline-flex h-12 items-center justify-center gap-3 border border-white/20 px-6 text-sm font-black !text-white transition hover:border-white hover:bg-white hover:!text-[var(--public-header)]"
                >
                  Cotizar refacciones

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </div>

            <div className="grid gap-px border border-white/10 bg-white/10">
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
                description="La solicitud llegará a la agencia seleccionada."
              />
            </div>
          </div>
        </section>
        <section className="bg-[var(--home-surface)]">
          <div className="public-container py-14 md:py-20">
            {(params.success || params.error) && (
              <div
                role="alert"
                className={`mb-8 border px-5 py-4 text-sm font-black ${params.success
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-red-300 bg-red-50 text-red-800"
                  }`}
              >
                {params.success || params.error}
              </div>
            )}

            {/* Accesos */}
            <div className="mb-10 grid gap-px border border-[var(--home-border)] bg-[var(--home-border)] md:grid-cols-2">
              <a
                href="#servicio"
                className="group flex min-h-[145px] items-center justify-between gap-6 bg-[var(--home-card)] p-6 transition hover:bg-[var(--home-card-hover)] md:p-8"
              >
                <div className="flex items-center gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
                    <Settings size={23} />
                  </span>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                      Mantenimiento
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                      Solicitar servicio
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
                      Mantenimiento, revisión o diagnóstico.
                    </p>
                  </div>
                </div>

                <span className="grid h-12 w-12 shrink-0 place-items-center border border-[var(--home-border-strong)] text-[var(--public-ink)] transition group-hover:border-[var(--public-accent)] group-hover:bg-[var(--public-accent)] group-hover:!text-white">
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </a>

              <a
                href="#refacciones"
                className="group flex min-h-[145px] items-center justify-between gap-6 bg-[var(--home-card)] p-6 transition hover:bg-[var(--home-card-hover)] md:p-8"
              >
                <div className="flex items-center gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
                    <PackageSearch size={23} />
                  </span>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--public-muted)]">
                      Piezas y accesorios
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-[-0.035em] text-[var(--public-ink)]">
                      Cotizar refacciones
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
                      Consulta piezas, accesorios y disponibilidad.
                    </p>
                  </div>
                </div>

                <span className="grid h-12 w-12 shrink-0 place-items-center border border-[var(--home-border-strong)] text-[var(--public-ink)] transition group-hover:border-[var(--public-accent)] group-hover:bg-[var(--public-accent)] group-hover:!text-white">
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              {/* Servicio */}
              <section
                id="servicio"
                className="scroll-mt-[125px] border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8"
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
                    className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:-translate-y-0.5 hover:bg-[var(--public-accent-dark)]"
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
                className="scroll-mt-[125px] border border-[var(--home-border)] bg-[var(--home-card)] p-6 shadow-[0_12px_30px_rgba(18,24,28,0.05)] md:p-8"
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
                    className="group inline-flex h-12 items-center justify-center gap-3 bg-[var(--public-header)] px-6 text-sm font-black !text-white transition hover:-translate-y-0.5 hover:bg-[var(--public-accent-dark)]"
                  >
                    Solicitar cotización

                    <ArrowRight
                      size={17}
                      className="text-white transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </form>
              </section>
            </div>

            {/* Información final */}
            <section className="mt-8 border border-[var(--home-border)] bg-[var(--home-card)] shadow-[0_10px_28px_rgba(18,24,28,0.04)]">
              <div className="grid gap-px bg-[var(--home-border)] md:grid-cols-3">
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

            <div className="mt-10 flex flex-col items-center border-t border-[var(--home-border)] pt-8 text-center">
              <p className="text-sm font-semibold text-slate-500">
                También puedes consultar las
                ubicaciones y medios de contacto de
                nuestras agencias.
              </p>

              <Link
                href="/sucursales"
                className="group mt-5 inline-flex h-11 items-center justify-center gap-3 border border-[var(--home-border-strong)] bg-[var(--home-card)] px-6 text-sm font-black text-[var(--public-ink)] transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:!text-white"
              >
                Ver sucursales

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
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
    <div className="flex min-h-[115px] items-center gap-5 bg-[var(--public-header)] p-6">
      <span className="grid h-12 w-12 shrink-0 place-items-center border border-white/20 bg-white/10 text-white">
        <Icon
          size={21}
          className="text-white"
        />
      </span>

      <div>
        <p className="font-black text-white">
          {title}
        </p>

        <p className="mt-2 text-xs font-medium leading-5 text-white">
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
    <div>
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
          <Icon size={22} />
        </span>

        <div className="h-px flex-1 bg-[var(--home-border)]" />
      </div>

      <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[var(--public-muted)]">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--public-ink)] md:text-4xl">
        {title}
      </h2>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
        {description}
      </p>
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--public-muted)]">
        Sucursal *
      </span>

      <select
        name="branchId"
        required
        defaultValue=""
        className="h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition focus:border-[var(--public-header)] focus:bg-white"
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--public-muted)]">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--public-muted)]"
          />
        )}

        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`h-12 w-full border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 text-sm font-semibold text-[var(--public-ink)] outline-none transition placeholder:text-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white ${Icon ? "pl-11" : ""
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--public-muted)]">
        {label}
      </span>

      <textarea
        name={name}
        required={required}
        rows={5}
        placeholder={placeholder}
        className="w-full resize-none border border-[var(--home-border-strong)] bg-[var(--home-surface-strong)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--public-ink)] outline-none transition placeholder:text-[var(--public-muted)] focus:border-[var(--public-header)] focus:bg-white"
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
    <div className="min-h-[210px] bg-[var(--home-surface-strong)] p-6">
      <span className="grid h-11 w-11 place-items-center border border-[var(--home-border-strong)] bg-[var(--home-surface-alt)] text-[var(--public-accent)]">
        <Icon size={20} />
      </span>

      <h3 className="mt-5 text-xl font-black tracking-[-0.025em] text-[var(--public-ink)]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">
        {description}
      </p>
    </div>
  );
}