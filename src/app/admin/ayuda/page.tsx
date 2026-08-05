import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Eye,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Wrench,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type QuickGuide = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  steps: string[];
};

const quickGuides: QuickGuide[] = [
  {
    title: "Marcas",
    description:
      "Las marcas son la base de la organización comercial. Se utilizan en categorías, modelos del catálogo e inventario.",
    href: "/admin/marcas",
    icon: Tags,
    steps: [
      "Registra el nombre de la marca.",
      "Selecciona su tipo comercial.",
      "Déjala activa para poder utilizarla.",
      "Después crea categorías y modelos relacionados.",
    ],
  },
  {
    title: "Categorías",
    description:
      "Organizan los modelos por marca, familia o línea comercial. También pueden existir categorías principales y subcategorías.",
    href: "/admin/catalogo/categorias",
    icon: FolderTree,
    steps: [
      "Selecciona la marca correspondiente.",
      "Crea primero la categoría principal.",
      "Agrega subcategorías cuando sea necesario.",
      "Asocia después los modelos correctos.",
    ],
  },
  {
    title: "Catálogo base",
    description:
      "Guarda modelos comerciales o plantillas con nombre, precio base, descripción, especificaciones e imágenes.",
    href: "/admin/catalogo",
    icon: Tags,
    steps: [
      "Crea un modelo comercial.",
      "Selecciona marca y categoría.",
      "Carga imágenes y descripción.",
      "Utilízalo como base al registrar una unidad.",
    ],
  },
  {
    title: "Inventario",
    description:
      "Administra unidades reales. Cada vehículo publicado en el sitio debe existir como registro de inventario.",
    href: "/admin/inventario",
    icon: Car,
    steps: [
      "Registra una unidad real.",
      "Selecciona marca, modelo y sucursal.",
      "Define si es nueva o seminueva.",
      "Configura estado y visibilidad.",
    ],
  },
  {
    title: "Salud del inventario",
    description:
      "Detecta unidades con imágenes, precios, descripciones o estados incompletos antes de mostrarlas al público.",
    href: "/admin/inventario/salud",
    icon: AlertTriangle,
    steps: [
      "Revisa unidades sin imagen.",
      "Corrige precios y descripciones.",
      "Valida marca y sucursal activas.",
      "Oculta registros vendidos o inconsistentes.",
    ],
  },
  {
    title: "Solicitudes / CRM",
    description:
      "Recibe cotizaciones, pruebas de manejo, solicitudes de servicio, financiamiento y contactos del sitio.",
    href: "/admin/leads",
    icon: MessageSquare,
    steps: [
      "Revisa primero las solicitudes nuevas.",
      "Contacta al cliente.",
      "Actualiza el estado del seguimiento.",
      "Finaliza como cerrado o perdido.",
    ],
  },
  {
    title: "Sucursales",
    description:
      "Administra ubicaciones, teléfonos, WhatsApp, horarios, servicios y disponibilidad pública de cada agencia.",
    href: "/admin/sucursales",
    icon: Building2,
    steps: [
      "Registra los datos de ubicación.",
      "Agrega medios de contacto.",
      "Configura servicios y horario.",
      "Activa la sucursal para publicarla.",
    ],
  },
];

const publishChecklist = [
  "La marca está activa.",
  "La sucursal está activa.",
  "La unidad tiene una imagen principal.",
  "La galería contiene imágenes válidas.",
  "El precio es mayor a cero.",
  "La descripción comercial está completa.",
  "Las características técnicas están capturadas.",
  "La unidad tiene estado Disponible.",
  "La unidad está marcada como visible.",
  "La página pública abre correctamente.",
];

const workflowSteps = [
  {
    number: "01",
    title: "Crear la estructura",
    description:
      "Registra primero marcas, categorías y sucursales.",
  },
  {
    number: "02",
    title: "Preparar el catálogo",
    description:
      "Carga los modelos comerciales con información e imágenes.",
  },
  {
    number: "03",
    title: "Registrar unidades",
    description:
      "Crea los vehículos reales utilizando los datos disponibles.",
  },
  {
    number: "04",
    title: "Validar publicación",
    description:
      "Revisa salud del inventario y confirma la vista pública.",
  },
  {
    number: "05",
    title: "Dar seguimiento",
    description:
      "Gestiona las solicitudes recibidas desde el sitio.",
  },
];

const faqs = [
  {
    question:
      "¿Cuál es la diferencia entre Catálogo base e Inventario?",
    answer:
      "El Catálogo base almacena modelos comerciales o plantillas. El Inventario almacena vehículos reales con precio, sucursal, estado y disponibilidad.",
  },
  {
    question:
      "¿Dónde aparece un vehículo nuevo?",
    answer:
      "Una unidad nueva activa y disponible puede mostrarse en el catálogo público y en la página correspondiente a su marca.",
  },
  {
    question:
      "¿Dónde aparece un vehículo seminuevo?",
    answer:
      "Una unidad seminueva activa y disponible se muestra en el inventario público.",
  },
  {
    question:
      "¿Por qué una unidad no aparece en público?",
    answer:
      "Puede estar oculta, vendida, apartada o inactiva. También puede tener una marca o sucursal desactivada.",
  },
  {
    question:
      "¿Puedo eliminar una marca o sucursal?",
    answer:
      "Solo cuando no tenga vehículos, modelos, categorías o solicitudes relacionadas. En caso contrario, conviene ocultarla.",
  },
  {
    question:
      "¿Qué debo hacer cuando se vende una unidad?",
    answer:
      "Cambia su estado a Vendido. Después puedes conservarla como historial u ocultarla del sitio.",
  },
];

export default async function AdminHelpPage() {
  await requireAdmin();

  return (
    <div className="pb-10">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm">
              <BookOpen size={15} />
              Centro de ayuda
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
              Guía del administrador
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              Consulta el flujo recomendado para
              administrar marcas, catálogo,
              inventario, sucursales y solicitudes.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white bg-white px-5 text-sm font-black !text-[#192a3a] transition hover:-translate-y-0.5 hover:bg-[#e7edf1] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
          >
            <LayoutDashboard size={17} />
            <span>Volver al dashboard</span>
          </Link>
        </div>
      </section>

      {/* Regla principal */}
      <section className="mt-6 overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-5 md:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7edf1] text-[#192a3a]">
                <Sparkles size={22} />
              </span>

              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-[#192a3a]" />

                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#192a3a]">
                    Regla principal
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                  Catálogo base e inventario no son
                  lo mismo
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  El <strong>Catálogo base</strong>{" "}
                  guarda modelos comerciales. El{" "}
                  <strong>Inventario</strong> guarda
                  unidades reales con precio,
                  sucursal, estado y disponibilidad.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <PublicationRule
                icon={Tags}
                title="Modelo comercial"
                description="Funciona como plantilla para acelerar el registro de vehículos."
              />

              <PublicationRule
                icon={Car}
                title="Unidad real"
                description="Es el registro que puede publicarse y recibir solicitudes."
              />
            </div>
          </div>

          <aside className="border-t border-slate-100 bg-[#f8fafb] p-5 md:p-7 lg:border-l lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Publicación pública
            </p>

            <div className="mt-4 grid gap-3">
              <PublicResult
                label="Unidad nueva"
                result="Catálogo público"
              />

              <PublicResult
                label="Unidad seminueva"
                result="Inventario público"
              />

              <PublicResult
                label="Vendida o apartada"
                result="No disponible"
              />
            </div>
          </aside>
        </div>
      </section>

      {/* Flujo recomendado */}
      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#192a3a]" />

            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
              Orden recomendado
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Flujo de trabajo
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Seguir este orden reduce registros
            incompletos y evita repetir información.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workflowSteps.map((step) => (
            <article
              key={step.number}
              className="rounded-[18px] border border-slate-100 bg-[#f8fafb] p-5"
            >
              <span className="text-3xl font-black tracking-[-0.06em] text-[#7890a2]">
                {step.number}
              </span>

              <h3 className="mt-4 text-sm font-black text-[#192a3a]">
                {step.title}
              </h3>

              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Guías */}
      <section className="mt-6">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#192a3a]" />

            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
              Guías rápidas
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Secciones del administrador
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {quickGuides.map((guide) => (
            <QuickGuideCard
              key={guide.title}
              guide={guide}
            />
          ))}
        </div>
      </section>

      {/* Checklist y consejo */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <ClipboardList size={21} />
            </span>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Checklist
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                Antes de publicar una unidad
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {publishChecklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[16px] border border-slate-100 bg-[#f8fafb] p-4"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-xs font-semibold leading-5 text-slate-600">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[22px] bg-[#192a3a] p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />

          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/15 bg-white/10 !text-[#dfe7ec] [&_*]:!text-current">
              <Lightbulb size={22} />
            </span>

            <h2 className="mt-5 text-2xl font-black tracking-[-0.035em]">
              Consejo operativo
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/65">
              Antes de registrar unidades, prepara
              marcas, categorías, modelos y
              sucursales. El formulario de inventario
              será más rápido y consistente.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/admin/catalogo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white bg-white px-4 text-xs font-black !text-[#192a3a] transition hover:bg-[#e7edf1] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
              >
                <span>Ir al catálogo</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/admin/inventario/nuevo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-4 text-xs font-black !text-white transition hover:bg-white/15 hover:!text-white active:scale-[0.98] [&_*]:!text-current"
              >
                <span>Registrar unidad</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {/* Buenas prácticas */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <PracticeCard
          icon={ShieldCheck}
          title="Protege los registros"
          description="Oculta en lugar de eliminar cuando existan vehículos, modelos o solicitudes relacionadas."
        />

        <PracticeCard
          icon={Eye}
          title="Revisa la vista pública"
          description="Después de publicar, abre el vehículo o sucursal para confirmar imágenes y contenido."
        />

        <PracticeCard
          icon={Store}
          title="Mantén datos actualizados"
          description="Revisa teléfonos, horarios, servicios y ubicación de cada sucursal."
        />
      </section>

      {/* Preguntas frecuentes */}
      <section className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <HelpCircle size={21} />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">
              Preguntas frecuentes
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              Dudas comunes
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[18px] border border-slate-100 bg-[#f8fafb] transition open:border-[#192a3a]/20 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                <span className="text-sm font-black text-[#192a3a]">
                  {faq.question}
                </span>

                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[#192a3a] transition group-open:rotate-90">
                  <ArrowRight size={14} />
                </span>
              </summary>

              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <p className="text-sm leading-6 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-[#192a3a]/10 bg-[#e7edf1] px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-black text-[#192a3a]">
          <Wrench size={17} />
          Recomendación
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Utiliza periódicamente la sección Salud
          del inventario para detectar registros
          incompletos antes de que afecten el sitio
          público.
        </p>
      </section>
    </div>
  );
}

function PublicationRule({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[18px] border border-slate-100 bg-[#f8fafb] p-4">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#192a3a]">
          <Icon size={18} />
        </span>

        <div>
          <h3 className="text-sm font-black text-[#192a3a]">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function PublicResult({
  label,
  result,
}: {
  label: string;
  result: string;
}) {
  return (
    <div className="rounded-[16px] border border-slate-100 bg-white p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 flex items-center gap-2 text-xs font-black text-[#192a3a]">
        <CheckCircle2
          size={15}
          className="text-emerald-600"
        />

        {result}
      </p>
    </div>
  );
}

function QuickGuideCard({
  guide,
}: {
  guide: QuickGuide;
}) {
  const Icon = guide.icon;

  return (
    <article className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:border-[#192a3a]/20 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#192a3a] !text-white [&_*]:!text-current">
            <Icon size={20} />
          </span>

          <div>
            <h3 className="text-xl font-black tracking-[-0.03em]">
              {guide.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {guide.description}
            </p>
          </div>
        </div>

        <Link
          href={guide.href}
          aria-label={`Abrir ${guide.title}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#192a3a]/15 bg-white !text-[#192a3a] transition hover:border-[#192a3a]/30 hover:bg-[#eef0ee] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
        >
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-3 p-5 md:p-6">
        {guide.steps.map((step, index) => (
          <div
            key={step}
            className="flex items-start gap-3"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7edf1] text-[9px] font-black text-[#192a3a]">
              {index + 1}
            </span>

            <p className="text-xs font-semibold leading-5 text-slate-600">
              {step}
            </p>
          </div>
        ))}

        <Link
          href={guide.href}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#192a3a]/15 bg-[#eef0ee] px-4 text-xs font-black !text-[#192a3a] transition hover:border-[#192a3a]/30 hover:bg-[#e1e5e3] hover:!text-[#192a3a] active:scale-[0.98] [&_*]:!text-current"
        >
          <span>Abrir sección</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function PracticeCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]">
        <Icon size={20} />
      </span>

      <h3 className="mt-4 text-sm font-black text-[#192a3a]">
        {title}
      </h3>

      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}