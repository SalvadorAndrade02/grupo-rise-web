import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bike,
  CarFront,
  Mountain,
} from "lucide-react";

type VehicleCategoryShowcaseProps = {
  autoImage?: string | null;
  motorcycleImage?: string | null;
  offRoadImage?: string | null;
};

type CategoryItem = {
  title: string;
  label: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  icon: LucideIcon;
};

export function VehicleCategoryShowcase({
  autoImage,
  motorcycleImage,
  offRoadImage,
}: VehicleCategoryShowcaseProps) {
  const categories: CategoryItem[] = [
    {
      title: "Autos",
      label: "Movilidad",
      description: "Tecnología y comodidad para cada trayecto.",
      href: "/catalogo?categoria=AUTO",
      imageUrl: autoImage,
      icon: CarFront,
    },
    {
      title: "Motocicletas",
      label: "Libertad",
      description: "Diseñadas para ciudad, carretera y aventura.",
      href: "/catalogo?categoria=MOTO",
      imageUrl: motorcycleImage,
      icon: Bike,
    },
    {
      title: "Todoterreno",
      label: "Aventura",
      description: "Potencia y capacidad para caminos sin límites.",
      href: "/catalogo?categoria=TODOTERRENO",
      imageUrl: offRoadImage,
      icon: Mountain,
    },
  ];

  return (
    <section
      id="categorias"
      className="border-y border-[var(--home-border)] bg-[var(--home-background)] py-16 md:py-24"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#192a3a]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#192a3a]">
                Explora nuestro catálogo
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0a0f14] md:text-4xl">
              ¿Qué tipo de vehículo buscas?
            </h2>
          </div>

          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-[#0a0f14]"
          >
            Ver todos

            <span className="grid h-9 w-9 place-items-center rounded-none border border-black/15 bg-white transition group-hover:border-[#192a3a] group-hover:bg-[#192a3a] group-hover:text-white group-active:border-[#192a3a] group-active:bg-[#192a3a] group-active:text-white">
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <CategoryButton
              key={category.title}
              category={category}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryButton({
  category,
}: {
  category: CategoryItem;
}) {
  const Icon = category.icon;

  return (
    <Link
      href={category.href}
      className="group relative min-h-[172px] overflow-hidden rounded-none border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#192a3a]/60 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] active:scale-[0.98] active:border-[#192a3a]/60"
    >
      <div className="relative z-10 flex min-h-[172px] items-center justify-between gap-4 px-5 py-5 md:px-6">
        <div className="max-w-[58%]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-none bg-[#e7edf1] text-[#192a3a] transition duration-300 group-hover:bg-[#192a3a] group-hover:text-white group-active:bg-[#192a3a] group-active:text-white">              <Icon size={17} strokeWidth={1.9} />
            </span>

            <p className="text-[9px] font-black uppercase tracking-[0.23em] text-[#192a3a]">
              {category.label}
            </p>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#0a0f14]">
            {category.title}
          </h3>

          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
            {category.description}
          </p>

          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0f14]">
            Explorar

            <ArrowRight
              size={14}
              className="text-[#192a3a] transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1"
            />
          </span>
        </div>

        <div className="relative h-[118px] w-[42%] shrink-0">
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.title}
              fill
              sizes="(max-width: 768px) 40vw, 15vw"
              className="object-contain object-center transition duration-500 group-hover:scale-105 group-active:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon
                size={62}
                strokeWidth={1.1}
                className="text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#192a3a] transition-all duration-500 group-hover:w-full group-active:w-full" />

      <div className="pointer-events-none absolute right-[-30px] top-[-45px] h-32 w-32 rounded-none bg-[#dbeafe]/60 blur-2xl transition duration-300 group-hover:bg-[#93c5fd]/50 group-active:bg-[#93c5fd]/50" />
    </Link>
  );
}