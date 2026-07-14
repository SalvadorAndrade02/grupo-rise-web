import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AdminHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function AdminHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  backHref,
  backLabel = "Volver",
  actions,
}: AdminHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#192a3a] px-5 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] md:px-7 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_32%),linear-gradient(135deg,rgba(16,28,39,0.98),rgba(25,42,58,0.94))]" />

      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </Link>
          )}

          <div
            className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#dfe7ec] backdrop-blur-sm ${
              backHref ? "mt-5" : ""
            }`}
          >
            {Icon && <Icon size={15} />}
            {eyebrow}
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-4xl lg:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/60 md:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}