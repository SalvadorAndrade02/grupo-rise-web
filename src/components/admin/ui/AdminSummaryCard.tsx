import type { LucideIcon } from "lucide-react";

type AdminSummaryCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?:
    | "navy"
    | "blue"
    | "violet"
    | "amber"
    | "emerald"
    | "red";
};

const toneClasses = {
  navy: "border-[#192a3a]/10 bg-[#e7edf1] text-[#192a3a]",
  blue:
    "border-blue-100 bg-blue-50 text-blue-700",
  violet:
    "border-violet-100 bg-violet-50 text-violet-700",
  amber:
    "border-amber-100 bg-amber-50 text-amber-700",
  emerald:
    "border-emerald-100 bg-emerald-50 text-emerald-700",
  red:
    "border-red-100 bg-red-50 text-red-700",
};

export function AdminSummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "navy",
}: AdminSummaryCardProps) {
  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl border ${toneClasses[tone]}`}
      >
        <Icon size={20} />
      </span>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-[#192a3a]">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}