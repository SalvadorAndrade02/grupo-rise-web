import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ImageIcon,
  MessageCircle,
  Tag,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type CatalogModelPageProps = {
  params: Promise<{
    marca: string;
    modelo: string;
  }>;
};

const brandSlugMap: Record<string, string> = {
  "can-am": "Can-Am",
  polaris: "Polaris",
  "royal-enfield": "Royal Enfield",
  "sea-doo": "Sea-Doo",
  "triumph-motorcycles": "Triumph",
  "indian-motorcycle": "Indian",
  zeekrlife: "Zeekr",
  "lynk-co": "Lynk & Co",
};

function splitList(value?: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function CatalogModelPage({
  params,
}: CatalogModelPageProps) {
  const { marca, modelo } = await params;

  const brandName = brandSlugMap[marca];

  if (!brandName) {
    notFound();
  }

  const catalogModel = await prisma.catalogModel.findFirst({
    where: {
      slug: modelo,
      active: true,
      brand: {
        name: brandName,
      },
    },
    include: {
      brand: true,
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!catalogModel) {
    notFound();
  }

  const image = catalogModel.images[0]?.url || catalogModel.mainImage || "";
  const specs = splitList(catalogModel.specs);
  const features = splitList(catalogModel.features);

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container>
          <div className="py-6">
            <Link
              href={`/catalogo/${marca}`}
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[var(--rise-blue)]"
            >
              <ArrowLeft size={17} />
              Volver a {catalogModel.brand.name}
            </Link>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  {catalogModel.brand.name}
                </p>

                <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">
                  {catalogModel.name}
                </h1>

                <p className="mt-3 text-base font-bold text-slate-500">
                  {catalogModel.category?.parent?.name
                    ? `${catalogModel.category.parent.name} · ${catalogModel.category.name}`
                    : catalogModel.category?.name ?? "Catálogo"}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-[var(--rise-navy)] px-6 py-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                  Precio desde
                </p>

                <p className="mt-1 text-3xl font-black">
                  {catalogModel.priceFrom
                    ? formatCurrency(catalogModel.priceFrom)
                    : "Consultar"}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-[2.5rem] border border-[var(--rise-border)] bg-white p-3 shadow-sm">
                <div className="h-[320px] overflow-hidden rounded-[2rem] bg-slate-100 md:h-[520px]">
                  {image ? (
                    <img
                      src={image}
                      alt={`${catalogModel.brand.name} ${catalogModel.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <div className="text-center">
                        <ImageIcon className="mx-auto" size={56} />
                        <p className="mt-3 text-sm font-black uppercase tracking-wider">
                          Sin imagen principal
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <section className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Descripción
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Conoce este modelo
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                  {catalogModel.description ||
                    "El administrador podrá agregar la descripción comercial de este modelo desde el panel de catálogo."}
                </p>
              </section>

              {(features.length > 0 || specs.length > 0) && (
                <section className="grid gap-6 lg:grid-cols-2">
                  {features.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        Características
                      </p>

                      <div className="mt-6 grid gap-3">
                        {features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-emerald-600"
                            />

                            <span className="text-sm font-bold text-slate-600">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {specs.length > 0 && (
                    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                        Especificaciones
                      </p>

                      <div className="mt-6 grid gap-3">
                        {specs.map((spec) => (
                          <div
                            key={spec}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-[var(--rise-blue)]"
                            />

                            <span className="text-sm font-bold text-slate-600">
                              {spec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-xl shadow-slate-900/10">
                <div className="bg-[var(--rise-navy)] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                    Solicita información
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    {catalogModel.priceFrom
                      ? formatCurrency(catalogModel.priceFrom)
                      : "Consultar precio"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Un asesor puede ayudarte con disponibilidad, versiones,
                    precio y opciones de compra.
                  </p>
                </div>

                <div className="grid gap-3 p-6">
                  <Link
                    href={`/contacto?modelo=${catalogModel.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 py-4 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                  >
                    <MessageCircle size={18} />
                    Solicitar información
                  </Link>

                  <Link
                    href="/agendar-cita"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--rise-border)] bg-white px-5 py-4 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                  >
                    <CalendarDays size={18} />
                    Agendar cita
                  </Link>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                      <Tag size={15} />
                      Año modelo
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {catalogModel.year ?? "Por definir"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}