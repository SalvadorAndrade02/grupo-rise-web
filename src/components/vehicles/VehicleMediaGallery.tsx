"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon, PlayCircle } from "lucide-react";

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

  if (normalizedItems.length === 0) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-100">
        <div className="text-center">
          <ImageIcon className="mx-auto text-slate-400" size={46} />
          <p className="mt-3 text-sm font-bold text-slate-500">
            Sin imágenes disponibles
          </p>
        </div>
      </div>
    );
  }

  const selectedItem = normalizedItems[selectedIndex];

  return (
    <div>
      <div className="overflow-hidden rounded-[2rem] border border-[var(--rise-border)] bg-black shadow-xl shadow-slate-900/10">
        <div className="relative aspect-[16/10] w-full">
          {selectedItem.type === "VIDEO" ? (
            <video
              src={selectedItem.url}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={selectedItem.url}
              alt={selectedItem.alt ?? vehicleName}
              fill
              priority
              className="object-cover"
            />
          )}
        </div>
      </div>

      {normalizedItems.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {normalizedItems.map((item, index) => (
            <button
              key={`${item.id}-${item.url}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative overflow-hidden rounded-2xl border bg-slate-100 ${
                index === selectedIndex
                  ? "border-[var(--rise-blue)] ring-2 ring-[var(--rise-blue)]"
                  : "border-[var(--rise-border)]"
              }`}
            >
              <div className="relative aspect-square">
                {item.type === "VIDEO" ? (
                  <div className="grid h-full w-full place-items-center bg-slate-900 text-white">
                    <PlayCircle size={34} />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.alt ?? vehicleName}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}