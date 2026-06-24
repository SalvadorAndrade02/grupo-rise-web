import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Save } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createBranch(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "");
  const city = String(formData.get("city") ?? "");
  const state = String(formData.get("state") ?? "");
  const address = String(formData.get("address") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const whatsapp = String(formData.get("whatsapp") ?? "");
  const email = String(formData.get("email") ?? "");
  const schedule = String(formData.get("schedule") ?? "");
  const googleMapsUrl = String(formData.get("googleMapsUrl") ?? "");
  const services = String(formData.get("services") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const active = formData.get("active") === "on";

  if (!name || !city || !state || !address) {
    throw new Error("Faltan campos obligatorios.");
  }

  await prisma.branch.create({
    data: {
      name,
      city,
      state,
      address,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      schedule: schedule || null,
      googleMapsUrl: googleMapsUrl || null,
      services: services || null,
      sortOrder,
      active,
    },
  });

  redirect("/admin/sucursales");
}

export default function NewBranchPage() {
  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="border-b border-[var(--rise-border)] bg-white">
        <Container className="py-6">
          <Link
            href="/admin/sucursales"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[var(--rise-blue)]"
          >
            <ArrowLeft size={18} />
            Volver a sucursales
          </Link>
        </Container>
      </section>

      <section className="bg-[var(--rise-navy)] py-12 text-white">
        <Container>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
            Administración
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Nueva sucursal
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Registra una nueva agencia o punto de atención de Grupo Rise.
          </p>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <form
            action={createBranch}
            className="grid gap-8 lg:grid-cols-[1fr_360px]"
          >
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <Building2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      Información principal
                    </h2>
                    <p className="text-sm text-slate-500">
                      Datos generales de la sucursal.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Nombre de agencia
                    </span>
                    <input
                      name="name"
                      required
                      placeholder="Ej. Polaris Monterrey Cumbres"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Ciudad
                    </span>
                    <input
                      name="city"
                      required
                      placeholder="Monterrey"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Estado
                    </span>
                    <input
                      name="state"
                      required
                      placeholder="Nuevo León"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Dirección
                    </span>
                    <textarea
                      name="address"
                      required
                      rows={3}
                      placeholder="Dirección completa"
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                    <MapPin size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">Contacto y servicios</h2>
                    <p className="text-sm text-slate-500">
                      Información visible para clientes.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Teléfono
                    </span>
                    <input
                      name="phone"
                      placeholder="81 1099 4545"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      WhatsApp
                    </span>
                    <input
                      name="whatsapp"
                      placeholder="81 1099 4545"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Correo
                    </span>
                    <input
                      name="email"
                      type="email"
                      placeholder="contacto@gruporise.com"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Horario
                    </span>
                    <input
                      name="schedule"
                      placeholder="Lunes a viernes 9:00 a 19:00, sábado 9:00 a 14:00"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Google Maps URL
                    </span>
                    <input
                      name="googleMapsUrl"
                      placeholder="https://maps.google.com/..."
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Servicios
                    </span>
                    <textarea
                      name="services"
                      rows={4}
                      placeholder="Autos, Motos, Todo terreno, Ventas, Servicio"
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Sepáralos por coma.
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-black">Publicación</h2>

                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Orden
                  </span>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={0}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                  />
                </label>

                <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Sucursal activa
                  </span>
                </label>

                <button
                  type="submit"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  <Save size={18} />
                  Guardar sucursal
                </button>

                <Link
                  href="/admin/sucursales"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--rise-border)] px-5 py-3 text-sm font-black text-[var(--rise-navy)] transition hover:bg-[var(--rise-blue-soft)]"
                >
                  Cancelar
                </Link>
              </div>
            </aside>
          </form>
        </Container>
      </section>

      <Footer />
    </main>
  );
}