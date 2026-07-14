import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";

type SharedFieldProps = {
  label: string;
  description?: string;
  containerClassName?: string;
};

type AdminInputProps =
  SharedFieldProps &
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "className"
    >;

export function AdminInput({
  label,
  description,
  containerClassName = "",
  ...inputProps
}: AdminInputProps) {
  return (
    <label
      className={`block ${containerClassName}`}
    >
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <input
        {...inputProps}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

type AdminTextareaProps =
  SharedFieldProps &
    Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "className"
    >;

export function AdminTextarea({
  label,
  description,
  containerClassName = "",
  ...textareaProps
}: AdminTextareaProps) {
  return (
    <label
      className={`block ${containerClassName}`}
    >
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <textarea
        {...textareaProps}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      />

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

type AdminSelectProps =
  SharedFieldProps &
    Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "className"
    > & {
      children: ReactNode;
    };

export function AdminSelect({
  label,
  description,
  containerClassName = "",
  children,
  ...selectProps
}: AdminSelectProps) {
  return (
    <label
      className={`block ${containerClassName}`}
    >
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <select
        {...selectProps}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#192a3a] focus:bg-white focus:ring-2 focus:ring-[#192a3a]/10"
      >
        {children}
      </select>

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </label>
  );
}

type AdminToggleOptionProps = {
  name: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  defaultChecked?: boolean;
  disabled?: boolean;
};

export function AdminToggleOption({
  name,
  title,
  description,
  icon: Icon,
  defaultChecked = false,
  disabled = false,
}: AdminToggleOptionProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-[16px] border border-slate-200 bg-[#f8fafb] p-4 transition ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-[#192a3a]/30"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#192a3a]"
      />

      {Icon && (
        <Icon
          size={17}
          className="mt-0.5 shrink-0 text-[#192a3a]"
        />
      )}

      <span>
        <span className="block text-sm font-black text-slate-700">
          {title}
        </span>

        {description && (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}