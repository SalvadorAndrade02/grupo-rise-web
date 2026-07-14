import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AdminSectionProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className = "",
  contentClassName = "p-5 md:p-6",
}: AdminSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="border-b border-slate-100 bg-[#f8fafb] p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#192a3a] text-white">
            <Icon size={20} />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#192a3a]">
              {eyebrow}
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              {title}
            </h2>

            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
}