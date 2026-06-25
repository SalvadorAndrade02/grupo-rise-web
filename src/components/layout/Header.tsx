"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/ui/Container";

const mainLinks = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: "Inventario",
    href: "/inventario",
  },
  {
    label: "Sucursales",
    href: "/sucursales",
  },
{
    label: "Servicios",
    href: "#",
  },
];

const catalogLinks = [
  {
    label: "Autos",
    href: "/inventario?categoria=AUTO",
  },
  {
    label: "Motos",
    href: "/inventario?categoria=MOTO",
  },
  {
    label: "Todo terreno",
    href: "/inventario?categoria=TODOTERRENO",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href.split("?")[0]);
}

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rise-border)] bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <Image
              src="/brand/logo-rise.jpeg"
              alt="Grupo Rise"
              width={210}
              height={60}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {mainLinks.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[var(--rise-navy)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="group relative">
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  pathname.startsWith("/inventario")
                    ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[var(--rise-navy)]"
                }`}
              >
                Catálogo
                <ChevronDown size={16} />
              </button>

              <div className="invisible absolute left-0 top-full w-56 translate-y-2 rounded-2xl border border-[var(--rise-border)] bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition group-hover:visible group-hover:translate-y-1 group-hover:opacity-100">
                {catalogLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-[var(--rise-blue-soft)] hover:text-[var(--rise-blue)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/agendar-cita"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
            >
              <CalendarDays size={18} />
              Agendar cita
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--rise-border)] text-[var(--rise-navy)] lg:hidden"
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-[var(--rise-border)] py-4 lg:hidden">
            <nav className="grid gap-2">
              {mainLinks.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                      active
                        ? "bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-2 rounded-2xl bg-slate-50 p-3">
                <p className="px-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Catálogo
                </p>

                <div className="mt-2 grid gap-1">
                  {catalogLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="rounded-xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white hover:text-[var(--rise-blue)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/sucursales"
                onClick={closeMobileMenu}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rise-navy)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--rise-blue)]"
              >
                <CalendarDays size={18} />
                Agendar cita
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}