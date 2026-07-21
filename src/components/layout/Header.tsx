"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { useState } from "react";

const catalogBrands = [
  {
    label: "Can-Am",
    href: "/catalogo/can-am",
    logo: "/catalog/brands/can-am.png",
    logoClass: "scale-110",
  },
  {
    label: "Polaris",
    href: "/catalogo/polaris",
    logo: "/catalog/brands/polaris.jpg",
    logoClass: "scale-140",
  },
  {
    label: "Sea-Doo",
    href: "/catalogo/sea-doo",
    logo: "/catalog/brands/sea-doo.jpg",
    logoClass: "scale-125",
  },
  {
    label: "Indian Motorcycle",
    href: "/catalogo/indian-motorcycle",
    logo: "/catalog/brands/indian.jpg",
    logoClass: "scale-140",
  },
  {
    label: "Triumph",
    href: "/catalogo/triumph-motorcycles",
    logo: "/catalog/brands/triumph.png",
    logoClass: "scale-125",
  },
  {
    label: "Royal Enfield",
    href: "/catalogo/royal-enfield",
    logo: "/catalog/brands/royal-enfield.jpg",
    logoClass: "scale-125",
  },
  {
    label: "Zeekr",
    href: "/catalogo/zeekrlife",
    logo: "/catalog/brands/zeekNegro.png",
    logoClass: "scale-100",
  },
  {
    label: "Lynk & Co",
    href: "/catalogo/lynk-co",
    logo: "/catalog/brands/lynkco.png",
    logoClass: "scale-125",
  },
];

const navigationItems = [
  {
    label: "Inicio",
    href: "/",
    activePaths: ["/"],
  },
  {
    label: "Grupo RISE",
    href: "/#grupo-rise",
    activePaths: ["/grupo-rise"],
  },
  {
    label: "Agencias",
    href: "/sucursales",
    activePaths: ["/sucursales"],
  },
  {
    label: "Noticias",
    href: "/#noticias",
    activePaths: ["/noticias"],
  },
  {
    label: "Eventos",
    href: "/#eventos",
    activePaths: ["/eventos"],
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandsActive =
    pathname.startsWith("/catalogo") ||
    pathname.startsWith("/vehiculos") ||
    pathname.startsWith("/inventario");

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function isActive(paths: string[]) {
    return paths.some((path) => {
      if (path === "/") {
        return pathname === "/";
      }

      return pathname.startsWith(path);
    });
  }

  function desktopLinkClass(active: boolean) {
    return [
      "group relative flex h-full items-center px-3",
      "text-[13px] font-semibold uppercase tracking-[0.08em]",
      "transition-colors duration-200",
      active
        ? "text-white"
        : "text-white/60 hover:text-white",
    ].join(" ");
  }

  function activeLineClass(active: boolean) {
    return [
      "absolute bottom-0 left-3 right-3 h-px",
      "origin-left bg-white transition-transform duration-300",
      active
        ? "scale-x-100"
        : "scale-x-0 group-hover:scale-x-100",
    ].join(" ");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#101418]/95 text-white shadow-[0_8px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <div className="mx-auto flex h-[80px] w-full max-w-[1435px] items-center px-5 md:h-[88px] md:px-8 lg:px-10">
        <Link
          href="/"
          onClick={closeMobileMenu}
          aria-label="Ir al inicio de Grupo RISE"
          className="flex min-w-0 shrink-0 items-center justify-start lg:w-[270px]"
        >
          <Image
            src="/brand/logo-rise.png"
            alt="Grupo RISE"
            width={280}
            height={90}
            priority
            className="h-[62px] w-auto origin-left object-contain md:h-[68px]"
          />
        </Link>

        <nav className="ml-10 hidden h-full flex-1 items-center justify-center lg:flex">
          {navigationItems.slice(0, 2).map((item) => {
            const active = isActive(item.activePaths);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={desktopLinkClass(active)}
              >
                {item.label}
                <span className={activeLineClass(active)} />
              </Link>
            );
          })}

          <div className="group relative flex h-full items-center">
            <Link
              href="/catalogo"
              className={desktopLinkClass(brandsActive)}
            >
              <span className="flex items-center gap-1.5">
                Marcas

                <ChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </span>

              <span className={activeLineClass(brandsActive)} />
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 w-[440px] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-none border border-white/10 bg-[#eceeec] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">
                      Nuestras marcas
                    </p>

                    <p className="mt-1 text-xs text-black">
                      Automotriz, motocicletas y experiencias.
                    </p>
                  </div>

                  <Link
                    href="/catalogo"
                    className="flex items-center gap-2 text-xs font-bold text-black/70 transition hover:text-white"
                  >
                    <span className="text-black">Ver todas</span>

                    <ArrowRight className="text-black" size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[#d3d7d6]">
                  {catalogBrands.map((brand) => (
                    <Link
                      key={brand.label}
                      href={brand.href}
                      className="group/brand bg-[#dfe2e2] px-5 py-4 transition hover:bg-white/[0.06]"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm font-semibold text-black">
                            {brand.label}
                          </span>
                        </span>

                        <span className="flex h-14 w-[130px] shrink-0 items-center justify-center overflow-hidden">
                          <Image
                            src={brand.logo}
                            alt={`Logo de ${brand.label}`}
                            width={140}
                            height={56}
                            className={`max-h-full w-auto max-w-full object-contain transition-transform duration-200 ${brand.logoClass ?? "scale-100"
                              }`}
                          />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="grid grid-cols-2 border-t border-white/10">
                  <Link
                    href="/catalogo"
                    className="border-r border-white/10 px-5 py-3 text-center text-xs font-semibold text-black transition hover:bg-white/[0.05] hover:text-black"
                  >
                    <span className="text-black">
                      Vehículos nuevos
                    </span>

                  </Link>

                  <Link
                    href="/inventario"
                    className="px-5 py-3 text-center text-xs font-semibold text-black transition hover:bg-white/[0.05] hover:text-black"
                  >
                    <span className="text-black">
                      Seminuevos
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {navigationItems.slice(2).map((item) => {
            const active = isActive(item.activePaths);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={desktopLinkClass(active)}
              >
                {item.label}
                <span className={activeLineClass(active)} />
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            href="/contacto"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-none border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:border-white/40 hover:bg-white/10"
          >
            Contactanos
            <ArrowRight size={14} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-label={
            mobileMenuOpen
              ? "Cerrar menú de navegación"
              : "Abrir menú de navegación"
          }
          className="ml-auto grid h-10 w-10 place-items-center rounded-none border border-white/15 text-white transition hover:bg-white/10 active:scale-95 lg:hidden"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <div
        className={[
          "overflow-hidden border-t bg-[#101418] transition-all duration-300 lg:hidden",
          mobileMenuOpen
            ? "max-h-[780px] border-white/10 opacity-100"
            : "max-h-0 border-transparent opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto w-full max-w-[1440px] px-5 py-5 md:px-8">
          <MobileLink
            href="/"
            label="Inicio"
            active={pathname === "/"}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/#grupo-rise"
            label="Grupo RISE"
            active={pathname.startsWith("/grupo-rise")}
            onClick={closeMobileMenu}
          />

          <div className="my-3 border-y border-white/10 py-3">
            <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
              Marcas
            </p>

            <div className="grid grid-cols-2 gap-2">
              {catalogBrands.map((brand) => (
                <Link
                  key={brand.label}
                  href={brand.href}
                  onClick={closeMobileMenu}
                  className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-none border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.08]"
                >
                  <span className="flex h-12 w-full items-center justify-center px-1">
                    <Image
                      src={brand.logo}
                      alt={`Logo de ${brand.label}`}
                      width={130}
                      height={48}
                      className="max-h-full w-auto max-w-full object-contain"
                    />
                  </span>

                  <span className="text-center text-xs font-semibold text-white/70">
                    {brand.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <MobileLink
            href="/sucursales"
            label="Agencias"
            active={pathname.startsWith("/sucursales")}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/#noticias"
            label="Noticias"
            active={pathname.startsWith("/noticias")}
            onClick={closeMobileMenu}
          />

          <MobileLink
            href="/#eventos"
            label="Eventos"
            active={pathname.startsWith("/eventos")}
            onClick={closeMobileMenu}
          />

          <Link
            href="/contacto"
            onClick={closeMobileMenu}
            className="mt-4 flex items-center justify-center gap-2 rounded-none bg-white px-5 py-3.5 text-sm font-bold text-[#101418] transition hover:bg-white/85 active:scale-[0.98]"
          >
            Contacto
            <ArrowRight size={16} />
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
      className={[
        "flex items-center justify-between rounded-none px-4 py-3.5 text-sm font-semibold transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {label}

      <ArrowRight
        size={15}
        className={active ? "text-white" : "text-white/25"}
      />
    </Link>
  );
}