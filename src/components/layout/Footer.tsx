import Image from "next/image";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="bg-[var(--rise-navy)] py-12 text-white">
      <Container>
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Image
              src="/brand/logo-rise.jpeg"
              alt="Grupo Rise"
              width={210}
              height={60}
              className="h-12 w-auto rounded-md bg-white object-contain p-1"
            />

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Tu mejor decisión en autos y motos nuevos, seminuevos, servicios
              y atención de calidad.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white">Navegación</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Autos</li>
              <li>Motos</li>
              <li>Seminuevos</li>
              <li>Sucursales</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Servicios</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Mantenimiento</li>
              <li>Financiamiento</li>
              <li>Prueba de manejo</li>
              <li>Agenda de servicio</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Contacto</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>33 1234 5678</li>
              <li>hola@gruporise.com.mx</li>
              <li>Lun - Vie: 9:00 - 20:00</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-400">
          © 2026 Grupo Rise. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}