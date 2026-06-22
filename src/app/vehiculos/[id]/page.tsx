import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Fuel,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getVehicleById, vehicles } from "@/data/vehicles";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateStaticParams() {
  return vehicles.map((vehicle) => ({
    id: vehicle.id.toString(),
  }));
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const vehicle = getVehicleById(Number(id));

  if (!vehicle) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <Container className="py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="h-[320px] w-full rounded-[1.5rem] object-cover md:h-[520px]"
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {vehicle.gallery.slice(0, 3).map((image) => (
                  <div
                    key={image}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                  >
                    <img
                      src={image}
                      alt={vehicle.name}
                      className="h-24 w-full rounded-xl object-cover md:h-36"
                    />
                  </div>
                ))}
              </div>

              <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Descripción
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Sobre este vehículo
                </h2>

                <p className="mt-4 text-base leading-8 text-slate-600">
                  {vehicle.description}
                </p>
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Equipamiento
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Características principales
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {vehicle.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <CheckCircle2 className="text-blue-700" size={20} />
                      <span className="text-sm font-bold text-slate-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                    {vehicle.type}
                  </span>

                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                    {vehicle.status}
                  </span>

                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                    {vehicle.condition}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {vehicle.name}
                </h1>

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {vehicle.brand} · {vehicle.model} · {vehicle.year}
                </p>

                <p className="mt-6 text-4xl font-black tracking-tight text-slate-950">
                  {formatCurrency(vehicle.price)}
                </p>

                <div className="mt-6 grid gap-3">
                  {vehicle.specs.map((spec) => (
                    <div
                      key={spec}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <Fuel size={19} className="text-blue-700" />
                      <span className="text-sm font-bold text-slate-700">
                        {spec}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                  <div className="flex gap-3">
                    <MapPin size={20} className="shrink-0 text-blue-700" />
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Disponible en {vehicle.location}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {vehicle.branchAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-3">
                  <Button className="w-full">
                    Solicitar cotización
                    <ChevronRight size={18} />
                  </Button>

                  <Button variant="secondary" className="w-full">
                    <CalendarDays size={18} />
                    Agendar prueba
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <MessageCircle size={18} />
                    Contactar por WhatsApp
                  </Button>
                </div>

                <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                  <div className="flex gap-3">
                    <ShieldCheck className="text-blue-700" size={22} />
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Compra con confianza
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Información de prueba para demo. En producción se
                        conectará con el inventario real de Grupo Rise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
                  Grupo Rise
                </p>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  ¿Te interesa este vehículo?
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Solicita una cotización o agenda una prueba de manejo con un
                  asesor.
                </p>
              </div>

              <Button className="bg-white text-slate-950 hover:bg-slate-100">
                Contactar asesor
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}