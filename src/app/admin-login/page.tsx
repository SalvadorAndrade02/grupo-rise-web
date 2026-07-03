import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Car,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  //authenticateAdmin,
  //createAdminSession,
  getAdminSession,
  hasAdminUsers,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

/* async function loginAdmin(formData: FormData) {
  "use server";

  const email = getTextValue(formData, "email");
  const password = getTextValue(formData, "password");

  if (!email || !password) {
    redirect(
      `/admin-login?error=${encodeURIComponent(
        "Ingresa correo y contraseña."
      )}`
    );
  }

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    redirect(
      `/admin-login?error=${encodeURIComponent(
        "Correo o contraseña incorrectos."
      )}`
    );
  }

  await createAdminSession(admin.id);

  redirect("/admin");
} */

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const session = await getAdminSession();
  const hasAdmins = await hasAdminUsers();

  if (!hasAdmins) {
    redirect("/admin-setup");
  }

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <section className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
        <aside className="relative hidden overflow-hidden bg-[var(--rise-navy)] text-white lg:flex lg:items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_42%)]" />
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-4xl px-10 py-8 xl:px-14">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-black text-blue-100 backdrop-blur transition hover:bg-white/15"
              >
                <ArrowLeft size={17} />
                Volver al sitio
              </Link>

              <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur">
                <ShieldCheck size={15} />
                Admin
              </span>
            </div>

            <div className="mt-12 max-w-3xl">
              <div className="inline-flex rounded-[1.6rem] border border-white/15 bg-white p-4 shadow-2xl shadow-black/25">
                <img
                  src="/brand/logo-rise.jpeg"
                  alt="Grupo Rise"
                  className="h-14 w-auto max-w-[210px] object-contain"
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur">
                  <Sparkles size={15} />
                  Panel administrativo
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur">
                  <LockKeyhole size={15} />
                  Acceso seguro
                </span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
                Control central para administrar Grupo Rise.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-blue-100">
                Gestiona inventario, catálogo, sucursales, servicios y
                prospectos desde un panel protegido y diseñado para operación
                diaria.
              </p>

              <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
                <FeatureCard
                  icon={<Car size={20} />}
                  title="Inventario"
                  description="Nuevos y seminuevos"
                />

                <FeatureCard
                  icon={<Building2 size={20} />}
                  title="Sucursales"
                  description="Agencias y contactos"
                />

                <FeatureCard
                  icon={<BadgeCheck size={20} />}
                  title="Prospectos"
                  description="CRM comercial"
                />
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-100">
                    <LockKeyhole size={21} />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-white">
                      Seguridad de sesión
                    </h2>

                    <p className="mt-1 text-sm font-semibold leading-6 text-blue-100">
                      Cookie httpOnly, expiración automática y contraseña
                      protegida con hash.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
          <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-slate-200 blur-3xl" />

          <div className="relative w-full max-w-[420px]">
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="rounded-[1.5rem] border border-[var(--rise-border)] bg-white p-4 shadow-lg shadow-slate-900/10">
                <img
                  src="/brand/logo-rise.jpeg"
                  alt="Grupo Rise"
                  className="h-14 w-auto max-w-[190px] object-contain"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-[2.25rem] border border-[var(--rise-border)] bg-white shadow-2xl shadow-slate-900/10">
              <div className="bg-gradient-to-br from-white to-slate-50 p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-[var(--rise-blue-soft)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--rise-blue)]">
                      <ShieldCheck size={14} />
                      Acceso seguro
                    </p>

                    <h2 className="mt-5 text-3xl font-black tracking-tight">
                      Iniciar sesión
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Ingresa tus credenciales para acceder al panel
                      administrativo.
                    </p>
                  </div>

                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--rise-navy)] text-white shadow-lg shadow-slate-900/20">
                    <LockKeyhole size={26} />
                  </div>
                </div>

                {params.error && (
                  <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {params.error}
                  </div>
                )}
              </div>

              <form
                action="/api/admin/login"
                method="post"
                className="space-y-5 border-t border-slate-100 p-7"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Correo electrónico
                  </span>

                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[var(--rise-navy)] outline-none transition placeholder:text-slate-400 focus:border-[var(--rise-blue)] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="admin@gruporise.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Contraseña
                  </span>

                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[var(--rise-navy)] outline-none transition placeholder:text-slate-400 focus:border-[var(--rise-blue)] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Tu contraseña"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[var(--rise-blue)] hover:shadow-xl"
                >
                  <LogIn size={18} />
                  Entrar al panel
                </button>

                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-center text-xs font-bold leading-5 text-slate-500">
                    Acceso exclusivo para personal autorizado de Grupo Rise.
                  </p>
                </div>

                <div className="text-center">
                  <Link
                    href="/"
                    className="text-sm font-black text-[var(--rise-blue)] transition hover:text-[var(--rise-navy)]"
                  >
                    Volver al sitio público
                  </Link>
                </div>
              </form>
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
    <div className="rounded-[1.35rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-blue-100">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-black text-white">{title}</h3>

      <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">
        {description}
      </p>
    </div>
  );
}