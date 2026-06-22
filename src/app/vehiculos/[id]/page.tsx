import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Gauge,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { VehicleDetailActions } from "@/components/vehicles/VehicleDetailActions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const categoryLabels: Record<string, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  TODOTERRENO: "Todo terreno",
};

const conditionLabels: Record<string, string> = {
  NUEVO: "Nuevo",
  SEMINUEVO: "Seminuevo",
};

const statusLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  APARTADO: "Apartado",
  VENDIDO: "Vendido",
  EN_TRANSITO: "En tránsito",
  PROXIMAMENTE: "Próximamente",
  INACTIVO: "Inactivo",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function splitList(value: string | null | undefined) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: Number(id),
      active: true,
    },
    include: {
      brand: true,
      branch: true,
      images: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  const specs = splitList(vehicle.specs);
  const features = splitList(vehicle.features);

  const gallery = [
    vehicle.mainImage,
    ...vehicle.images.map((image) => image.url),
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container className="py-6">
          <Link
            href="/inventario"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver al inventario
          </Link>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm">
                {gallery.length > 0 ? (
                  <img
                    src={gallery[0]}
                    alt={vehicle.name}
                    className="h-[320px] w-full object-cover md:h-[520px]"
                  />
                ) : (
                  <div className="grid h-[320px] w-full place-items-center bg-[var(--rise-blue-soft)] text-sm font-black text-[var(--rise-blue)] md:h-[520px]">
                    Sin imagen
                  </div>
                )}

                {gallery.length > 1 && (
                  <div className="grid grid-cols-3 gap-3 p-4">
                    {gallery.slice(0, 3).map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`${vehicle.name} imagen ${index + 1}`}
                        className="h-28 w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Descripción
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Conoce esta unidad
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                  {vehicle.description ||
                    "Unidad disponible en Grupo Rise. Solicita información para conocer disponibilidad, precio y opciones de financiamiento."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
                  Equipamiento
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Características principales
                </h2>

                {features.length > 0 ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
                      >
                        <CheckCircle2
                          size={20}
                          className="shrink-0 text-[var(--rise-blue)]"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Aún no se han registrado características para esta unidad.
                  </p>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--rise-blue-soft)] px-3 py-1 text-xs font-black text-[var(--rise-blue)]">
                    {categoryLabels[vehicle.category]}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {conditionLabels[vehicle.condition]}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {statusLabels[vehicle.status]}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight">
                  {vehicle.name}
                </h1>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {vehicle.brand.name} · {vehicle.model} · {vehicle.year}
                </p>

                {vehicle.version && (
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Versión {vehicle.version}
                  </p>
                )}

                <p className="mt-6 text-4xl font-black">
                  {formatCurrency(vehicle.price)}
                </p>

                <div className="mt-6 grid gap-3">
                  {specs.map((spec) => (
                    <div
                      key={spec}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <Gauge
                        size={18}
                        className="shrink-0 text-[var(--rise-blue)]"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {spec}
                      </span>
                    </div>
                  ))}

                  {vehicle.color && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <Sparkles
                        size={18}
                        className="shrink-0 text-[var(--rise-blue)]"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        Color {vehicle.color}
                      </span>
                    </div>
                  )}

                  {vehicle.mileage !== null && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <Gauge
                        size={18}
                        className="shrink-0 text-[var(--rise-blue)]"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {vehicle.mileage.toLocaleString("es-MX")} km
                      </span>
                    </div>
                  )}
                </div>

                <VehicleDetailActions
                  vehicleName={vehicle.name}
                  whatsapp={vehicle.branch.whatsapp}
                />

                <div className="mt-6 rounded-2xl bg-[var(--rise-blue-soft)] p-4">
                  <div className="flex gap-3">
                    <MapPin
                      size={20}
                      className="shrink-0 text-[var(--rise-blue)]"
                    />

                    <div>
                      <p className="text-sm font-black text-[var(--rise-navy)]">
                        {vehicle.branch.name}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {vehicle.branch.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck
                      size={20}
                      className="shrink-0 text-[var(--rise-blue)]"
                    />

                    <p className="text-xs leading-5 text-slate-600">
                      La disponibilidad, precio y condiciones pueden variar.
                      Confirma la información con un asesor de Grupo Rise.
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