import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const navItems = [
  "Autos",
  "Motos",
  "Seminuevos",
  "Servicios",
  "Sucursales",
  "Financiamiento",
  "Contacto",
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rise-border)] bg-white/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <a href="/" className="flex items-center">
          <Image
            src="/brand/logo-rise.jpeg"
            alt="Grupo Rise"
            width={210}
            height={60}
            priority
            className="h-12 w-auto object-contain"
          />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--rise-navy)] lg:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="transition hover:text-[var(--rise-blue)]"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button className="py-2.5">WhatsApp</Button>

          <Button variant="secondary" className="py-2.5">
            <CalendarDays size={18} />
            Agendar servicio
          </Button>
        </div>

        <button className="rounded-xl border border-[var(--rise-border)] px-4 py-2 text-sm font-bold text-[var(--rise-navy)] lg:hidden">
          Menú
        </button>
      </Container>
    </header>
  );
}