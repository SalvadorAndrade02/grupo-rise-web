"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderTree,
  Gauge,
  Home,
  LogOut,
  LucideIcon,
  Menu,
  MessageSquare,
  Plus,
  Tags,
  X,
} from "lucide-react";

type AdminDockProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

type AdminLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const mainLinks: AdminLink[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Salud inventario",
    href: "/admin/inventario/salud",
    icon: AlertTriangle,
  },
  {
    label: "Inventario",
    href: "/admin/inventario",
    icon: Car,
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
    label: "Marcas",
    href: "/admin/marcas",
    icon: Tags,
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
  {
    label: "Ayuda",
    href: "/admin/ayuda",
    icon: BookOpen,
  },
];

const quickLinks: AdminLink[] = [
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

const mobileMainLinks = [
  mainLinks[0],
  mainLinks[2],
  mainLinks[6],
];

function isActive(
  pathname: string,
  href: string
) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  if (href === "/admin/inventario") {
    return (
      pathname === href ||
      (pathname.startsWith(
        "/admin/inventario/"
      ) &&
        !pathname.startsWith(
          "/admin/inventario/salud"
        ) &&
        !pathname.startsWith(
          "/admin/inventario/nuevo"
        ))
    );
  }

  if (href === "/admin/catalogo") {
    return (
      pathname === href ||
      (pathname.startsWith(
        "/admin/catalogo/"
      ) &&
        !pathname.startsWith(
          "/admin/catalogo/categorias"
        ) &&
        !pathname.startsWith(
          "/admin/catalogo/nuevo"
        ))
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function AdminDock({
  collapsed = false,
  onToggle,
}: AdminDockProps) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Menú de escritorio */}
      <aside className="hidden xl:block">
        <div
          className={`sticky top-6 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-all duration-300 ${collapsed
              ? "w-[88px] p-3"
              : "w-[270px] p-4"
            }`}
        >
          <div
            className={`relative overflow-hidden rounded-[18px] bg-[#192a3a] text-white ${collapsed ? "p-3" : "p-4"
              }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_40%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.95))]" />

            <div
              className={`relative flex items-center ${collapsed
                  ? "flex-col justify-center gap-3"
                  : "justify-between gap-3"
                }`}
            >
              <div
                className={`flex items-center ${collapsed
                    ? "justify-center"
                    : "gap-3"
                  }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#dfe7ec]">
                  <Gauge size={21} />
                </span>

                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                      Administración
                    </p>

                    <p className="mt-1 truncate text-sm font-black">
                      Grupo Rise
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onToggle}
                title={
                  collapsed
                    ? "Expandir menú"
                    : "Contraer menú"
                }
                aria-label={
                  collapsed
                    ? "Expandir menú"
                    : "Contraer menú"
                }
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
              >
                {collapsed ? (
                  <ChevronRight size={17} />
                ) : (
                  <ChevronLeft size={17} />
                )}
              </button>
            </div>
          </div>

          <nav
            aria-label="Navegación administrativa"
            className="mt-4 grid gap-1.5"
          >
            {mainLinks.map((item) => (
              <DesktopNavigationLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {!collapsed && (
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                Acciones rápidas
              </p>
            )}

            <div
              className={`grid gap-1.5 ${collapsed ? "" : "mt-3"
                }`}
            >
              {quickLinks.map((item) => (
                <DesktopNavigationLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  quick
                />
              ))}

              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                title={
                  collapsed
                    ? "Ver sitio público"
                    : undefined
                }
                className={`flex min-h-11 items-center rounded-xl text-xs font-black text-slate-600 transition hover:bg-[#f1f5f7] hover:text-[#192a3a] active:bg-[#e7edf1] ${collapsed
                    ? "justify-center px-3"
                    : "gap-3 px-4"
                  }`}
              >
                <ExternalLink size={17} />

                {!collapsed && (
                  <span>Ver sitio público</span>
                )}
              </Link>

              <form
                action="/admin/logout"
                method="post"
              >
                <button
                  type="submit"
                  title={
                    collapsed
                      ? "Cerrar sesión"
                      : undefined
                  }
                  className={`flex min-h-11 w-full items-center rounded-xl text-xs font-black text-red-600 transition hover:bg-red-50 active:bg-red-100 ${collapsed
                      ? "justify-center px-3"
                      : "gap-3 px-4"
                    }`}
                >
                  <LogOut size={17} />

                  {!collapsed && (
                    <span>Cerrar sesión</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Navegación inferior móvil */}
      <nav
        aria-label="Navegación administrativa móvil"
        className="fixed inset-x-3 bottom-3 z-[70] rounded-[20px] border border-black/8 bg-white/95 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md xl:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {mobileMainLinks.map((item) => {
            const Icon = item.icon;

            const active = isActive(
              pathname,
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] px-1 text-[9px] font-black transition ${active
                    ? "bg-[#192a3a] text-white"
                    : "text-slate-500 active:bg-[#e7edf1] active:text-[#192a3a]"
                  }`}
              >
                <Icon size={18} />

                <span className="max-w-full truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(true)
            }
            className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] px-1 text-[9px] font-black transition ${mobileMenuOpen
                ? "bg-[#192a3a] text-white"
                : "text-slate-500 active:bg-[#e7edf1] active:text-[#192a3a]"
              }`}
          >
            <Menu size={18} />
            Más
          </button>
        </div>
      </nav>

      {/* Menú móvil completo */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú administrativo"
          className="fixed inset-0 z-[9998] bg-[#071019]/75 backdrop-blur-sm xl:hidden"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[26px] bg-white pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-25px_80px_rgba(0,0,0,0.3)]">
            <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#192a3a] text-white">
                    <Gauge size={20} />
                  </span>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Panel administrativo
                    </p>

                    <p className="mt-1 text-sm font-black text-[#192a3a]">
                      Grupo Rise
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  aria-label="Cerrar menú"
                  className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 active:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                Navegación
              </p>

              <nav className="mt-3 grid grid-cols-2 gap-2">
                {mainLinks.map((item) => {
                  const Icon = item.icon;

                  const active = isActive(
                    pathname,
                    item.href
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-[82px] flex-col justify-between rounded-[16px] border p-4 transition active:scale-[0.98] ${active
                          ? "border-[#192a3a] bg-[#192a3a] text-white"
                          : "border-slate-200 bg-[#f8fafb] text-[#192a3a] active:border-[#192a3a]"
                        }`}
                    >
                      <Icon size={19} />

                      <span className="mt-4 text-xs font-black">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Acciones rápidas
                </p>

                <div className="mt-3 grid gap-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex min-h-12 items-center gap-3 rounded-xl bg-[#e7edf1] px-4 text-xs font-black text-[#192a3a] transition active:scale-[0.98]"
                      >
                        <Icon size={17} />
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition active:scale-[0.98]"
                  >
                    <ExternalLink size={17} />
                    Ver sitio público
                  </Link>

                  <form
                    action="/admin/logout"
                    method="post"
                  >
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-600 transition active:scale-[0.98] active:bg-red-100"
                    >
                      <LogOut size={17} />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DesktopNavigationLink({
  item,
  pathname,
  collapsed,
  quick = false,
}: {
  item: AdminLink;
  pathname: string;
  collapsed: boolean;
  quick?: boolean;
}) {
  const Icon = item.icon;

  const active = isActive(
    pathname,
    item.href
  );

  return (
    <Link
      href={item.href}
      title={
        collapsed
          ? item.label
          : undefined
      }
      className={`relative flex min-h-11 items-center overflow-hidden rounded-xl text-xs font-black transition ${collapsed
          ? "justify-center px-3"
          : "gap-3 px-4"
        } ${active
          ? quick
            ? "bg-[#192a3a] text-white"
            : "bg-[#e7edf1] text-[#192a3a]"
          : quick
            ? "bg-[#f8fafb] text-slate-600 hover:bg-[#e7edf1] hover:text-[#192a3a]"
            : "text-slate-600 hover:bg-[#f1f5f7] hover:text-[#192a3a]"
        }`}
    >
      {active && !collapsed && (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#192a3a]" />
      )}

      <Icon
        size={18}
        className="shrink-0"
      />

      {!collapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}
    </Link>
  );
}