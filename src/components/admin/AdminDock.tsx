"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gauge,
  Home,
  MessageSquare,
  AlertTriangle,
  Plus,
  Tags,
  FolderTree,
} from "lucide-react";

type AdminDockProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const mainLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Inventario",
    href: "/admin/inventario",
    icon: Car,
  },
  {
    label: "Salud inventario",
    href: "/admin/inventario/salud",
    icon: AlertTriangle,
  },
  {
    label: "Catálogo base",
    href: "/admin/catalogo",
    icon: Tags,
  },
  {
    label: "Categorías",
    href: "/admin/catalogo/categorias",
    icon: FolderTree,
  },
  {
    label: "Solicitudes",
    href: "/admin/leads",
    icon: MessageSquare,
  },
  {
    label: "Sucursales",
    href: "/admin/sucursales",
    icon: Building2,
  },
];

const quickLinks = [
  {
    label: "Nuevo seminuevo",
    href: "/admin/inventario/nuevo",
    icon: Plus,
  },
  {
    label: "Nuevo modelo",
    href: "/admin/catalogo/nuevo",
    icon: Plus,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminDock({ collapsed = false, onToggle }: AdminDockProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden xl:block">
        <div
          className={`sticky top-6 rounded-[2rem] border border-[var(--rise-border)] bg-white shadow-sm transition-all ${collapsed ? "p-3" : "p-4"
            }`}
        >
          <div
            className={`rounded-2xl bg-[var(--rise-navy)] text-white ${collapsed ? "p-3" : "p-4"
              }`}
          >
            <div
              className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"
                }`}
            >
              <div
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
                  }`}
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                  <Gauge size={22} />
                </div>

                {!collapsed && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                      Admin
                    </p>

                    <p className="font-black">Grupo Rise</p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  type="button"
                  onClick={onToggle}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  title="Contraer menú"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={onToggle}
                className="mt-3 grid h-9 w-full place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                title="Expandir menú"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <nav className="mt-4 grid gap-2">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-2xl text-sm font-black transition ${collapsed
                    ? "justify-center px-3 py-3"
                    : "gap-3 px-4 py-3"
                    } ${active
                      ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[var(--rise-blue)]"
                    }`}
                >
                  <Icon size={19} />

                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {!collapsed && (
              <p className="px-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Acciones
              </p>
            )}

            <div className={`grid gap-2 ${collapsed ? "mt-0" : "mt-3"}`}>
              {quickLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center rounded-2xl text-sm font-black transition ${collapsed
                      ? "justify-center px-3 py-3"
                      : "gap-3 px-4 py-3"
                      } ${active
                        ? "bg-[var(--rise-navy)] text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-[var(--rise-blue-soft)] hover:text-[var(--rise-blue)]"
                      }`}
                  >
                    <Icon size={18} />

                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}

              <Link
                href="/"
                target="_blank"
                title={collapsed ? "Ver sitio" : undefined}
                className={`flex items-center rounded-2xl text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-[var(--rise-blue)] ${collapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
                  }`}
              >
                <ExternalLink size={18} />

                {!collapsed && <span>Ver sitio</span>}
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-[70] rounded-[1.5rem] border border-[var(--rise-border)] bg-white/95 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur xl:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-black transition ${active
                  ? "bg-[var(--rise-navy)] text-white"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-[112px] flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--rise-blue-soft)] px-3 py-3 text-[11px] font-black text-[var(--rise-blue)]"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}