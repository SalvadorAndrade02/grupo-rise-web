"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Maximize2,
  X,
} from "lucide-react";

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
    if (hasImage) {
      setOpen(true);
    }
  }

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
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
        aria-label={
          hasImage
            ? `Ver fotografía de ${branchName}`
            : `Sin fotografía de ${branchName}`
        }
        className={`group relative block w-full overflow-hidden bg-[#e8ecef] text-left ${heightClassName} ${hasImage
          ? "cursor-zoom-in"
          : "cursor-default"
          }`}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`Fachada de ${branchName}`}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045] group-active:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#eef1f3]">
            <Building2
              size={46}
              strokeWidth={1.4}
              className="text-slate-400"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

        {hasImage && (
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 border border-white/30 bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-sm transition group-hover:bg-[var(--public-header)]">
            <Maximize2 size={14} />
            Ampliar
          </div>
        )}

        {showLogo && logoUrl && (
          <div className="absolute right-4 top-4 flex h-16 w-24 items-center justify-center overflow-hidden border border-white/70 bg-white p-2 shadow-lg">
            <img
              src={logoUrl}
              alt={`Logo ${branchName}`}
              draggable={false}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {showTitle && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#dfe7ec]">
              Agencia Grupo Rise
            </p>

            <p className="mt-1 line-clamp-2 text-xl font-black leading-tight text-white">
              {branchName}
            </p>
          </div>
        )}
      </button>

      {mounted &&
        open &&
        coverImageUrl &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Fotografía de ${branchName}`}
            onMouseDown={handleBackdropClick}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071019]/95 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar imagen"
              className="absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center border border-white/20 bg-white text-[var(--public-header)] shadow-xl transition hover:bg-[var(--home-surface-alt)] active:scale-95"            >
              <X size={23} />
            </button>

            <div
              className="relative z-10 w-full max-w-6xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={coverImageUrl}
                alt={`Fachada de ${branchName}`}
                draggable={false}
                className="mx-auto max-h-[82vh] w-auto max-w-full object-contain shadow-2xl"
              />

              <div className="mx-auto mt-4 max-w-3xl border border-white/10 bg-white/10 px-5 py-4 text-center text-white backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#dfe7ec]">
                  Agencia Grupo Rise
                </p>

                <p className="mt-1 text-xl font-black">
                  {branchName}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}