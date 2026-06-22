type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: SectionTitleProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
            {eyebrow}
          </p>
        )}

        <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}