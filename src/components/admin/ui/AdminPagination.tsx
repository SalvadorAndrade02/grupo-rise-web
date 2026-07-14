import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  firstItem: number;
  lastItem: number;
  itemLabel: string;
  itemLabelPlural: string;
  hrefForPage: (page: number) => string;
  className?: string;
};

function getPaginationPages(
  currentPage: number,
  totalPages: number
) {
  const visiblePages = 5;

  let startPage = Math.max(
    1,
    currentPage - 2
  );

  const endPage = Math.min(
    totalPages,
    startPage + visiblePages - 1
  );

  if (
    endPage - startPage + 1 <
    visiblePages
  ) {
    startPage = Math.max(
      1,
      endPage - visiblePages + 1
    );
  }

  return Array.from(
    {
      length:
        endPage - startPage + 1,
    },
    (_, index) => startPage + index
  );
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  firstItem,
  lastItem,
  itemLabel,
  itemLabelPlural,
  hrefForPage,
  className = "",
}: AdminPaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const pages = getPaginationPages(
    currentPage,
    totalPages
  );

  const finalLabel =
    totalItems === 1
      ? itemLabel
      : itemLabelPlural;

  return (
    <nav
      aria-label="Paginación"
      className={`mt-6 flex flex-col gap-4 rounded-[18px] border border-black/[0.08] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs font-semibold text-slate-500">
        Mostrando{" "}
        <strong className="text-[#192a3a]">
          {firstItem}–{lastItem}
        </strong>{" "}
        de{" "}
        <strong className="text-[#192a3a]">
          {totalItems}
        </strong>{" "}
        {finalLabel}
      </p>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {currentPage > 1 ? (
          <Link
            href={hrefForPage(currentPage - 1)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            <ArrowLeft size={14} />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-300">
            <ArrowLeft size={14} />
            Anterior
          </span>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={hrefForPage(page)}
            aria-current={
              page === currentPage
                ? "page"
                : undefined
            }
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black transition active:scale-[0.98] ${
              page === currentPage
                ? "border-[#192a3a] bg-[#192a3a] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#192a3a] hover:bg-[#e7edf1] hover:text-[#192a3a]"
            }`}
          >
            {page}
          </Link>
        ))}

        {currentPage < totalPages ? (
          <Link
            href={hrefForPage(currentPage + 1)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#192a3a] transition hover:border-[#192a3a] hover:bg-[#e7edf1] active:scale-[0.98]"
          >
            Siguiente
            <ArrowRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-300">
            Siguiente
            <ArrowRight size={14} />
          </span>
        )}
      </div>
    </nav>
  );
}