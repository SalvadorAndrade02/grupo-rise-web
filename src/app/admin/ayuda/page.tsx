import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Car,
  CheckCircle2,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Tags,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

const quickGuides = [
  {
    title: "Catálogo base",
    description:
      "Aquí se registran modelos comerciales o plantillas. Sirve para cargar datos generales como nombre, precio base, descripción, especificaciones e imágenes del modelo.",
    href: "/admin/catalogo",
    icon: Tags,
    steps: [
      "Entra a Catálogo base.",
      "Crea un modelo comercial.",
      "Carga imágenes, precio base y descripción.",
      "Después úsalo como plantilla al registrar una unidad real.",
    ],
  },
  {
    title: "Categorías",
    description:
      "Sirven para organizar los modelos por marca, familia o tipo. Por ejemplo: RZR, Ranger, Sportsman, Side-by-Side o Cuatrimotos.",
    href: "/admin/catalogo/categorias",
    icon: FolderTree,
    steps: [
      "Crea primero la categoría principal.",
      "Después crea subcategorías si aplica.",
      "Asocia los modelos del catálogo base a la categoría correcta.",
      "No elimines categorías si ya tienen modelos relacionados.",
    ],
  },
  {
    title: "Inventario",
    description:
      "Aquí se administran las unidades reales. Cada vehículo publicado en el sitio debe existir en inventario.",
    href: "/admin/inventario",
    icon: Car,
    steps: [
      "Crea una unidad desde Inventario.",
      "Selecciona marca, modelo base y sucursal.",
      "Define si es Nuevo o Seminuevo.",
      "Marca la unidad como Disponible y Visible para publicarla.",
    ],
  },
  {
    title: "Prospectos / CRM",
    description:
      "Aquí llegan las solicitudes que mandan los clientes desde los botones de cotizar, prueba de manejo, contacto o financiamiento.",
    href: "/admin/leads",
    icon: MessageSquare,
    steps: [
      "Revisa las solicitudes nuevas.",
      "Contacta por WhatsApp, llamada o correo.",
      "Cambia el estado a Contactado o En seguimiento.",
      "Marca como Cerrado o Perdido al terminar el proceso.",
    ],
  },
  {
    title: "Salud inventario",
    description:
      "Esta sección ayuda a detectar vehículos con información incompleta o inconsistencias antes de publicarlos.",
    href: "/admin/inventario/salud",
    icon: AlertTriangle,
    steps: [
      "Revisa unidades sin imagen.",
      "Corrige vehículos sin descripción o precio válido.",
      "Valida que las unidades visibles estén disponibles.",
      "Oculta o corrige unidades vendidas/apartadas.",
    ],
  },
];

const publishChecklist = [
  "La unidad tiene imagen principal.",
  "Tiene precio válido.",
  "Tiene descripción clara.",
  "Tiene especificaciones o características.",
  "La marca está activa.",
  "La sucursal está activa.",
  "La unidad está como Disponible.",
  "La unidad está visible.",
  "Nuevo aparece en /catalogo.",
  "Seminuevo aparece en /inventario.",
];

const faqs = [
  {
    question: "¿Cuál es la diferencia entre Catálogo base e Inventario?",
    answer:
      "Catálogo base guarda modelos comerciales o plantillas. Inventario guarda unidades reales que sí se publican en el sitio.",
  },
  {
    question: "¿Dónde aparece un vehículo Nuevo?",
    answer:
      "Si está activo, disponible, con marca activa y sucursal activa, aparece en /catalogo y en la página de su marca.",
  },
  {
    question: "¿Dónde aparece un vehículo Seminuevo?",
    answer:
      "Si está activo, disponible, con marca activa y sucursal activa, aparece en /inventario.",
  },
  {
    question: "¿Por qué no aparece una unidad en público?",
    answer:
      "Puede estar oculta, vendida, apartada, con marca inactiva, sucursal inactiva o no estar como disponible.",
  },
  {
    question: "¿Qué pasa si elimino una imagen principal?",
    answer:
      "El sistema intenta usar otra imagen disponible. Si no hay otra imagen, la unidad puede quedar sin imagen principal.",
  },
];

export default function AdminHelpPage() {
  return (
    <section className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
            <BookOpen size={17} />
            Centro de ayuda
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Guía rápida del administrador
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Manual interno para administrar catálogo, inventario, prospectos,
            sucursales y publicación de vehículos en Grupo Rise.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
        >
          <LayoutDashboard size={18} />
          Volver al dashboard
        </Link>
      </div>

      <div className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
            <Sparkles size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-black">
              Regla principal del sistema
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
              El <strong>Catálogo base</strong> sirve para guardar modelos
              comerciales. El <strong>Inventario</strong> sirve para guardar
              unidades reales. Solo las unidades reales del inventario se
              publican en el sitio.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-[var(--rise-navy)]">
                  Nuevo + Disponible + Visible
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Aparece en <strong>/catalogo</strong> y en la página de su
                  marca.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-[var(--rise-navy)]">
                  Seminuevo + Disponible + Visible
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Aparece en <strong>/inventario</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {quickGuides.map((guide) => {
          const Icon = guide.icon;

          return (
            <article
              key={guide.title}
              className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Icon size={24} />
                </div>

                <Link
                  href={guide.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Abrir
                  <ArrowRight size={14} />
                </Link>
              </div>

              <h2 className="mt-5 text-2xl font-black">{guide.title}</h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {guide.description}
              </p>

              <div className="mt-5 grid gap-3">
                {guide.steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--rise-navy)] text-xs font-black text-white">
                      {index + 1}
                    </span>

                    <p className="text-sm font-bold leading-6 text-slate-600">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardList size={23} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                Checklist
              </p>

              <h2 className="text-2xl font-black">
                Antes de publicar una unidad
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {publishChecklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl bg-slate-50 p-4"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm font-bold leading-6 text-slate-600">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-[var(--rise-border)] bg-[var(--rise-navy)] p-5 text-white shadow-sm md:p-7">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-blue-100">
            <Lightbulb size={24} />
          </div>

          <h2 className="mt-5 text-2xl font-black">Consejo operativo</h2>

          <p className="mt-3 text-sm leading-7 text-blue-100">
            Antes de cargar unidades reales, conviene crear primero las marcas,
            categorías y modelos base. Así el alta de inventario será más rápida
            y consistente.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/admin/catalogo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-blue-50"
            >
              Ir a catálogo base
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/admin/inventario/nuevo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
            >
              Registrar unidad
              <ArrowRight size={17} />
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-8 rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Wrench size={23} />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
              Preguntas frecuentes
            </p>

            <h2 className="text-2xl font-black">Dudas comunes</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-[var(--rise-navy)]">
                {faq.question}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}