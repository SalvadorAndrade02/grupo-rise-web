"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

type FeaturedVehicle = {
  id: number;
  category: string;
  condition: string;
  status: string;
  brandName: string;
  branchId: number;
  branchCity: string;
  branchWhatsapp?: string | null;
  name: string;
  model: string;
  year: number;
  price: number;
  type: string;
  specs: string[];
  mainImage?: string | null;
};

type FeaturedVehiclesProps = {
  vehicles: FeaturedVehicle[];
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    AUTO: "Auto",
    MOTO: "Motocicleta",
    TODOTERRENO: "Todoterreno",
  };

  return labels[category] ?? category;
}

function getConditionLabel(condition: string) {
  const labels: Record<string, string> = {
    NUEVO: "Nuevo",
    SEMINUEVO: "Seminuevo",
  };

  return labels[condition] ?? condition;
}

export function FeaturedVehicles({
  vehicles,
}: FeaturedVehiclesProps) {
  const featuredVehicles = vehicles.slice(0, 3);

  if (featuredVehicles.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f4f3ef] py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#1A2A3A]" /> {/* Línea decorativa con el azul de la foto */}

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#1A2A3A]"> {/* Texto con el azul de la foto */}
                Selección Grupo Rise
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0a0f14] md:text-4xl lg:text-5xl">
              Vehículos destacados
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500">
              Una selección de unidades disponibles para comenzar a explorar
              nuestro catálogo.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[#0a0f14]"
          >
            Ver todos los vehículos

            <span className="grid h-10 w-10 place-items-center rounded-full border border-black/15 bg-white transition group-hover:border-[#1A2A3A] group-hover:bg-[#1A2A3A] group-hover:text-white"> {/* Círculo hover con el azul de la foto */}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredVehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VehicleCard({
  vehicle,
  priority,
}: {
  vehicle: FeaturedVehicle;
  priority: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)]">
      <Link
        href={`/vehiculos/${vehicle.id}`}
        className="relative block h-[265px] overflow-hidden bg-[#ebe9e4]"
      >
        {vehicle.mainImage ? (
          <Image
            src={vehicle.mainImage}
            alt={`${vehicle.brandName} ${vehicle.name}`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,#d9d7d1,#f1f0ec)]">
            <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Sin imagen
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A2A3A] shadow-sm"> {/* Texto activo usa el azul de la foto */}
            {getConditionLabel(vehicle.condition)}
          </span>

          <span className="rounded-full bg-[#1A2A3A] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm"> {/* Badge cambia a fondo azul de la foto y texto blanco */}
            {getCategoryLabel(vehicle.category)}
          </span>
        </div>

        <div className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-[#0a0f14] shadow-lg transition duration-300 group-hover:bg-[#1A2A3A] group-hover:text-white group-active:text-white"> {/* Círculo flotante cambia al azul de la foto en hover */}
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"  
          />
        </div>
      </Link>

      <div className="p-5 md:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1A2A3A]"> {/* Nombre de marca superior usa el azul de la foto */}
          {vehicle.brandName}
        </p>

        <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight tracking-[-0.035em] text-[#0a0f14]">
          {vehicle.name}
        </h3>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Precio
            </p>

            <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0a0f14]">
              {formatCurrency(vehicle.price)}
            </p>
          </div>

          <Link
            href={`/vehiculos/${vehicle.id}`}
            className="group/link inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0f14]"
          >
            Ver detalle

            <ArrowRight
              size={14}
              className="text-[#1A2A3A] transition-transform group-hover/link:translate-x-1 group-active/link:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}