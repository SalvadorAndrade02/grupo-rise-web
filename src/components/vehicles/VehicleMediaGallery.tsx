"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  PlayCircle,
} from "lucide-react";

type VehicleMediaItem = {
  id: number;
  url: string;
  alt?: string | null;
  type: "IMAGE" | "VIDEO";
};

type VehicleMediaGalleryProps = {
  items: VehicleMediaItem[];
  fallbackImage?: string | null;
  vehicleName: string;
};

export function VehicleMediaGallery({
  items,
  fallbackImage,
  vehicleName,
}: VehicleMediaGalleryProps) {
  const normalizedItems =
    items.length > 0
      ? items
      : fallbackImage
        ? [
          {
            id: 0,
            url: fallbackImage,
            alt: vehicleName,
            type: "IMAGE" as const,
          },
        ]
        : [];

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= normalizedItems.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    }
  }, [normalizedItems.length, selectedIndex]);

  if (normalizedItems.length === 0) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-[22px] border border-dashed border-slate-300 bg-[#eef1f3] md:min-h-[480px]">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
            <ImageIcon size={30} />
          </span>

          <p className="mt-4 text-sm font-black text-slate-500">
            Sin imágenes disponibles
          </p>
        </div>
      </div>
    );
  }

  const selectedItem = normalizedItems[selectedIndex];
  const hasMultipleItems = normalizedItems.length > 1;

  function showPrevious() {
    setSelectedIndex((current) =>
      current === 0 ? normalizedItems.length - 1 : current - 1
    );
  }

  function showNext() {
    setSelectedIndex((current) =>
      current === normalizedItems.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div>
      <div className="group relative overflow-hidden border border-[var(--home-border)] bg-[var(--home-surface-alt)] shadow-[0_18px_45px_rgba(18,24,28,0.09)]">
        {/* Imagen o video principal */}
        <div className="relative aspect-[4/3] w-full md:aspect-[16/10]">
          {selectedItem.type === "VIDEO" ? (
            <video
              key={selectedItem.url}
              src={selectedItem.url}
              controls
              playsInline
              className="h-full w-full bg-black object-contain"
            />
          ) : (
            <Image
              key={selectedItem.url}
              src={selectedItem.url}
              alt={selectedItem.alt ?? vehicleName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-contain p-3 transition-transform duration-700 group-hover:scale-[1.02] md:p-6"
            />
          )}
        </div>

        {/* Etiqueta y contador */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="inline-flex items-center gap-2 border border-white/50 bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--public-ink)] shadow-sm backdrop-blur-sm">
            {selectedItem.type === "VIDEO" ? (
              <PlayCircle size={14} />
            ) : (
              <ImageIcon size={14} />
            )}

            {selectedItem.type === "VIDEO"
              ? "Video"
              : "Fotografía"}
          </span>

          {hasMultipleItems && (
            <span className="bg-[#0a0f14]/90 px-3 py-2 text-xs font-black text-white shadow-sm backdrop-blur-sm">
              {selectedIndex + 1} / {normalizedItems.length}
            </span>
          )}
        </div>

        {/* Flechas de navegación */}
        {hasMultipleItems && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Mostrar contenido anterior"
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/60 bg-white/90 text-[var(--public-ink)] shadow-lg backdrop-blur-sm transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:text-white active:scale-95 md:left-5"
            >
              <ChevronLeft size={21} />
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="Mostrar siguiente contenido"
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/60 bg-white/90 text-[var(--public-ink)] shadow-lg backdrop-blur-sm transition hover:border-[var(--public-header)] hover:bg-[var(--public-header)] hover:text-white active:scale-95 md:right-5"
            >
              <ChevronRight size={21} />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {hasMultipleItems && (
        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {normalizedItems.map((item, index) => {
            const active = index === selectedIndex;

            return (
              <button
                key={`${item.id}-${item.url}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Mostrar contenido ${index + 1}`}
                aria-current={active ? "true" : undefined}
                className={`relative h-[76px] w-[98px] shrink-0 snap-start overflow-hidden border bg-[var(--home-surface-alt)] transition duration-300 active:scale-95 md:h-[86px] md:w-[112px] ${active
                    ? "border-[var(--public-ink)] ring-2 ring-black/15"
                    : "border-[var(--home-border-strong)] hover:border-[var(--public-ink)]"
                  }`}
              >
                {item.type === "VIDEO" ? (
                  <div className="grid h-full w-full place-items-center bg-[var(--public-header)] text-white">
                    <PlayCircle size={28} />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.alt ?? vehicleName}
                    fill
                    sizes="112px"
                    className={`object-cover transition duration-300 ${active
                        ? "scale-105"
                        : "hover:scale-105"
                      }`}
                  />
                )}

                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--public-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}