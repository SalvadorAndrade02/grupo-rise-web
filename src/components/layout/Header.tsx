"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const catalogBrands = [
  {
    label: "Can-Am",
    href: "/catalogo/can-am",
  },
  {
    label: "Polaris",
    href: "/catalogo/polaris",
  },
  {
    label: "Sea-Doo",
    href: "/catalogo/sea-doo",
  },
  {
    label: "Indian Motorcycle",
    href: "/catalogo/indian-motorcycle",
  },
  {
    label: "Triumph",
    href: "/catalogo/triumph-motorcycles",
  },
  {
    label: "Royal Enfield",
    href: "/catalogo/royal-enfield",
  },
  {
    label: "Zeekr",
    href: "/catalogo/zeekrlife",
  },
  {
    label: "Lynk & Co",
    href: "/catalogo/lynk-co",
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const catalogActive =
    pathname.startsWith("/catalogo") ||
    pathname.startsWith("/vehiculos");

  const seminuevosActive = pathname.startsWith("/inventario");
  const branchesActive = pathname.startsWith("/sucursales");
  const servicesActive = pathname.startsWith("/servicios");

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function desktopLinkClass(active: boolean) {
    return `group relative flex h-full items-center px-4 text-sm font-bold transition ${
      active
        ? "text-[#0a0f14]"
        : "text-slate-600 hover:text-[#0a0f14]"
    }`;
  }

  function activeLineClass(active: boolean) {
    return `absolute bottom-0 left-4 right-4 h-[2px] origin-left bg-[#c98a35] transition-transform duration-300 ${
      active
        ? "scale-x-100"
        : "scale-x-0 group-hover:scale-x-100"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 shadow-[0_6px_25px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[100px] w-full max-w-[1440px] items-center gap-7 px-5 md:px-8 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          aria-label="Ir al inicio de Grupo Rise"
          className="flex min-w-0 shrink-0 items-center justify-start lg:w-[220px]"
        >
          <Image
            src="/brand/logo-rise.jpeg"
            alt="Grupo Rise"
            width={220}
            height={75}
            priority
            className="h-[52px] w-auto origin-left scale-[1.06] object-contain mix-blend-multiply"
          />
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden h-full flex-1 items-center justify-center lg:flex">
          <Link
            href="/"
            className={desktopLinkClass(pathname === "/")}
          >
            Inicio
            <span className={activeLineClass(pathname === "/")} />
          </Link>

          {/* Catálogo desplegable */}
          <div className="group relative flex h-full items-center">
            <Link
              href="/catalogo"
              className={desktopLinkClass(catalogActive)}
            >
              <span className="flex items-center gap-1.5">
                Catálogo

                <ChevronDown
                  size={15}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </span>

              <span className={activeLineClass(catalogActive)} />
            </Link>

            {/* El padding superior evita que el dropdown parpadee */}
            <div className="invisible absolute left-1/2 top-full z-50 w-[510px] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a66d27]">
                    Marcas que manejamos.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Explora vehículos nuevos por marca.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1 p-3">
                  <Link
                    href="/catalogo"
                    className="col-span-2 flex items-center justify-between rounded-lg bg-[#0a0f14] px-4 py-3 text-sm font-black text-white transition hover:bg-[#171d24]"
                  >
                    Ver todos los vehículos nuevos
                    <ArrowRight size={17} />
                  </Link>

                  {catalogBrands.map((brand) => (
                    <Link
                      key={brand.label}
                      href={brand.href}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-[#f7ead7] hover:text-[#0a0f14]"
                    >
                      {brand.label}

                      <ArrowRight
                        size={14}
                        className="text-[#c98a35]"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/inventario"
            className={desktopLinkClass(seminuevosActive)}
          >
            Seminuevos
            <span className={activeLineClass(seminuevosActive)} />
          </Link>

          <Link
            href="/sucursales"
            className={desktopLinkClass(branchesActive)}
          >
            Sucursales
            <span className={activeLineClass(branchesActive)} />
          </Link>

          <Link
            href="/servicios"
            className={desktopLinkClass(servicesActive)}
          >
            Servicios
            <span className={activeLineClass(servicesActive)} />
          </Link>
        </nav>

        {/* Acción derecha */}
        <div className="hidden w-[220px] shrink-0 justify-end lg:flex">
          <Link
            href="/contacto"
            className="group inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-[#0a0f14] bg-[#0a0f14] px-6 text-sm font-black text-white shadow-[0_8px_22px_rgba(10,15,20,0.15)] transition hover:-translate-y-0.5 hover:border-[#c98a35] hover:bg-[#c98a35] hover:text-[#0a0f14]"
          >
            Contáctanos

            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#c98a35] text-[#0a0f14] transition group-hover:bg-[#0a0f14] group-hover:text-white">
              <ArrowRight size={14} strokeWidth={2.6} />
            </span>
          </Link>
        </div>

        {/* Botón móvil */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-label={
            mobileMenuOpen
              ? "Cerrar menú de navegación"
              : "Abrir menú de navegación"
          }
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-[#0a0f14] text-white transition hover:bg-[#c98a35] hover:text-[#0a0f14] lg:hidden"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menú móvil */}
      <div
        className={`overflow-hidden border-t bg-white transition-all duration-300 lg:hidden ${
          mobileMenuOpen
            ? "max-h-[600px] border-slate-100 opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <nav className="mx-auto w-full max-w-[1440px] space-y-1 px-5 py-5 md:px-8">
          <MobileLink
            href="/"
            label="Inicio"
            active={pathname === "/"}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/catalogo"
            label="Catálogo"
            active={catalogActive}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/inventario"
            label="Seminuevos"
            active={seminuevosActive}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/sucursales"
            label="Sucursales"
            active={branchesActive}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/servicios"
            label="Servicios"
            active={servicesActive}
            onClick={closeMobileMenu}
          />

          <Link
            href="/servicios"
            onClick={closeMobileMenu}
            className="mt-4 flex h-13 items-center justify-center gap-3 rounded-lg bg-[#0a0f14] px-5 py-4 text-sm font-black text-white transition hover:bg-[#c98a35] hover:text-[#0a0f14]"
          >
            Contáctanos
            <ArrowRight size={17} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MobileLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-4 py-3.5 text-sm font-black transition ${
        active
          ? "bg-[#f7ead7] text-[#0a0f14]"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#0a0f14]"
      }`}
    >
      {label}

      <ArrowRight
        size={16}
        className={
          active ? "text-[#a66d27]" : "text-slate-400"
        }
      />
    </Link>
  );
}