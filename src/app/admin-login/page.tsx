import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Car,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getAdminSession,
  hasAdminUsers,
} from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  const [session, hasAdmins] =
    await Promise.all([
      getAdminSession(),
      hasAdminUsers(),
    ]);

  if (!hasAdmins) {
    redirect("/admin-setup");
  }

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f4f6f7] text-[#0a0f14]">
      <section className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_520px]">
        {/* Presentación en escritorio */}
        <aside className="relative hidden overflow-hidden bg-[#192a3a] text-white lg:flex lg:items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.13),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(120,144,162,0.16),transparent_42%),linear-gradient(135deg,rgba(16,28,39,1),rgba(25,42,58,0.96))]" />

          <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-white/[0.05] blur-3xl" />
          <div className="absolute -bottom-36 right-0 h-96 w-96 rounded-full bg-[#7890a2]/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-5xl px-10 py-10 xl:px-14">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-[#dfe7ec] backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98]"
              >
                <ArrowLeft size={16} />
                Volver al sitio
              </Link>

              <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#dfe7ec] backdrop-blur-sm">
                <ShieldCheck size={15} />
                Área privada
              </span>
            </div>

            <div className="mt-12 max-w-3xl">
              <div className="inline-flex rounded-[20px] border border-white/70  p-4 shadow-[0_20px_55px_rgba(0,0,0,0.25)]">
                <img
                  src="/brand/logo-rise.png"
                  alt="Grupo Rise"
                  className="h-14 w-auto max-w-[220px] object-contain"
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#dfe7ec] backdrop-blur-sm">
                  <Sparkles size={14} />
                  Panel administrativo
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#dfe7ec] backdrop-blur-sm">
                  <LockKeyhole size={14} />
                  Acceso seguro
                </span>
              </div>

              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] xl:text-5xl">
                Control central para administrar Grupo
                Rise.
              </h2>

              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/60">
                Gestiona vehículos, marcas, sucursales,
                servicios y solicitudes comerciales
                desde un solo panel.
              </p>

              <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
                <FeatureCard
                  icon={<Car size={20} />}
                  title="Inventario"
                  description="Unidades nuevas y seminuevas."
                />

                <FeatureCard
                  icon={<Building2 size={20} />}
                  title="Sucursales"
                  description="Agencias, imágenes y contactos."
                />

                <FeatureCard
                  icon={<BadgeCheck size={20} />}
                  title="Prospectos"
                  description="Solicitudes y seguimiento."
                />
              </div>

              <div className="mt-6 max-w-3xl rounded-[20px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-[#dfe7ec]">
                    <LockKeyhole size={20} />
                  </span>

                  <div>
                    <h3 className="text-sm font-black text-white">
                      Sesión protegida
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-white/55">
                      El acceso está restringido a
                      usuarios administrativos
                      autorizados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Formulario */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 md:px-8">
          <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-[#e7edf1] blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />

          <div className="relative w-full max-w-[420px]">
            {/* Encabezado móvil */}
            <div className="mb-7 lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[#192a3a] shadow-sm transition active:scale-95"
                  aria-label="Volver al sitio"
                >
                  <ArrowLeft size={18} />
                </Link>

                <div className="rounded-[18px] border border-black/8 bg-white p-3 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                  <img
                    src="/brand/logo-rise.jpeg"
                    alt="Grupo Rise"
                    className="h-12 w-auto max-w-[170px] object-contain"
                  />
                </div>

                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#192a3a] text-white">
                  <ShieldCheck size={18} />
                </span>
              </div>

              <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[#192a3a]">
                Panel administrativo
              </p>
            </div>

            <AdminLoginForm
              errorMessage={params.error}
            />

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-sm font-black text-[#192a3a]"
              >
                <ArrowLeft
                  size={15}
                  className="transition-transform group-hover:-translate-x-0.5 group-active:-translate-x-0.5"
                />
                Volver al sitio público
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[18px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[#dfe7ec]">
        {icon}
      </span>

      <h3 className="mt-4 text-sm font-black text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs font-medium leading-5 text-white/50">
        {description}
      </p>
    </article>
  );
}