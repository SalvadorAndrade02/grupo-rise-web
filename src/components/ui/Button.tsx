import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--rise-navy)] text-white hover:bg-[var(--rise-blue)] shadow-sm shadow-slate-900/20",
  secondary:
    "border border-[var(--rise-border)] bg-white text-[var(--rise-navy)] hover:bg-[var(--rise-blue-soft)]",
  ghost:
    "text-slate-700 hover:bg-slate-100",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}