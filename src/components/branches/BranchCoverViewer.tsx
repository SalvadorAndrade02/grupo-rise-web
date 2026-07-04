"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Maximize2, X } from "lucide-react";

type BranchCoverViewerProps = {
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  branchName: string;
  heightClassName?: string;
  showLogo?: boolean;
  showTitle?: boolean;
};

export function BranchCoverViewer({
  coverImageUrl,
  logoUrl,
  branchName,
  heightClassName = "h-52",
  showLogo = true,
  showTitle = true,
}: BranchCoverViewerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hasImage = Boolean(coverImageUrl);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleOpen() {
    if (!hasImage) {
      return;
    }

    setOpen(true);
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!hasImage}
        className={`group relative block w-full overflow-hidden bg-slate-200 text-left ${heightClassName} ${hasImage ? "cursor-zoom-in" : "cursor-default"
          }`}
        aria-label={
          hasImage
            ? `Ver foto de ${branchName} en grande`
            : `Sin foto de ${branchName}`
        }
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`Fachada de ${branchName}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <Building2 size={46} className="text-slate-400" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {hasImage && (
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-xs font-black text-white backdrop-blur transition group-hover:bg-black/50">
            <Maximize2 size={15} />
            Ver foto
          </div>
        )}

        {showLogo && logoUrl && (
          <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white p-2 shadow-lg">
            <img
              src={logoUrl}
              alt={`Logo ${branchName}`}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {showTitle && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              Agencia
            </p>

            <p className="mt-1 text-xl font-black text-white">{branchName}</p>
          </div>
        )}
      </button>

      {mounted &&
        open &&
        coverImageUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={handleBackdropClick}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition hover:bg-slate-100"
              aria-label="Cerrar imagen"
            >
              <X size={24} />
            </button>

            <div
              className="relative z-10 w-full max-w-6xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <img
                src={coverImageUrl}
                alt={`Fachada de ${branchName}`}
                className="mx-auto max-h-[82vh] w-auto max-w-full rounded-[2rem] object-contain shadow-2xl"
                draggable={false}
              />

              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center text-white backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                  Foto de agencia
                </p>

                <p className="mt-1 text-xl font-black">{branchName}</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}