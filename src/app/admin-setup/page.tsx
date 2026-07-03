import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
import {hasAdminUsers } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type AdminSetupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function isStrongPassword(password: string) {
  return password.length >= 10 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/* async function createFirstAdmin(formData: FormData) {
  "use server";

  const alreadyHasAdmins = await hasAdminUsers();

  if (alreadyHasAdmins) {
    redirect("/admin-login");
  }

  const name = getTextValue(formData, "name");
  const email = getTextValue(formData, "email").toLowerCase();
  const password = getTextValue(formData, "password");
  const confirmPassword = getTextValue(formData, "confirmPassword");

  if (!name || !email || !password || !confirmPassword) {
    redirect(
      `/admin-setup?error=${encodeURIComponent(
        "Todos los campos son obligatorios."
      )}`
    );
  }

  if (!email.includes("@")) {
    redirect(
      `/admin-setup?error=${encodeURIComponent(
        "Ingresa un correo válido."
      )}`
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/admin-setup?error=${encodeURIComponent(
        "Las contraseñas no coinciden."
      )}`
    );
  }

  if (!isStrongPassword(password)) {
    redirect(
      `/admin-setup?error=${encodeURIComponent(
        "La contraseña debe tener mínimo 10 caracteres, letras y números."
      )}`
    );
  }

  const admin = await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      active: true,
    },
  });

  await createAdminSession(admin.id);

  redirect("/admin");
} */

export default async function AdminSetupPage({
  searchParams,
}: AdminSetupPageProps) {
  const params = await searchParams;
  const alreadyHasAdmins = await hasAdminUsers();

  if (alreadyHasAdmins) {
    redirect("/admin-login");
  }

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <section className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_520px]">
        <div className="relative hidden overflow-hidden bg-[var(--rise-navy)] text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.9),transparent_45%)]" />

          <div className="relative flex h-full flex-col justify-between p-12">
            <div>
              <img
                src="/brand/logo-rise.jpeg"
                alt="Grupo Rise"
                className="h-16 w-16 rounded-2xl object-cover"
              />

              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
                <ShieldCheck size={16} />
                Configuración segura
              </p>

              <h1 className="mt-6 max-w-2xl text-5xl font-black tracking-tight">
                Crea el primer administrador de Grupo Rise.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-blue-100">
                Este paso solo está disponible mientras no exista ningún usuario
                administrador activo.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-bold leading-7 text-blue-100">
                Usa una contraseña fuerte. Este usuario tendrá acceso al panel
                administrativo, inventario, sucursales y prospectos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex rounded-[2rem] border border-white/15 bg-white p-4 shadow-2xl shadow-black/20">
                <img
                  src="/brand/logo-rise.jpeg"
                  alt="Grupo Rise"
                  className="h-20 w-auto max-w-[220px] object-contain"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-6 shadow-xl shadow-slate-900/10 md:p-8">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                <UserPlus size={28} />
              </div>

              <h2 className="mt-6 text-3xl font-black">
                Crear administrador
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Configura el primer acceso al panel administrativo.
              </p>

              {params.error && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {params.error}
                </div>
              )}

              <form action="/api/admin/setup" method="post" className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Nombre
                  </span>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    placeholder="Administrador"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Correo
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    placeholder="admin@gruporise.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Contraseña
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    placeholder="Mínimo 10 caracteres"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Confirmar contraseña
                  </span>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
                    placeholder="Repite la contraseña"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--rise-navy)] px-5 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
                >
                  <LockKeyhole size={18} />
                  Crear y entrar
                </button>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                Después de crear el primer administrador, esta pantalla quedará
                bloqueada automáticamente.
              </p>

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-sm font-black text-[var(--rise-blue)]"
                >
                  Volver al sitio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}