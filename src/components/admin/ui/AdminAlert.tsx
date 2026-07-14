import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";

type AdminAlertVariant =
  | "error"
  | "success"
  | "info"
  | "warning";

type AdminAlertProps = {
  variant: AdminAlertVariant;
  children: ReactNode;
  className?: string;
};

const alertStyles: Record<
  AdminAlertVariant,
  {
    icon: LucideIcon;
    className: string;
    role: "alert" | "status";
  }
> = {
  error: {
    icon: AlertCircle,
    className:
      "border-red-200 bg-red-50 text-red-700",
    role: "alert",
  },

  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    role: "status",
  },

  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    role: "alert",
  },

  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    role: "status",
  },
};

export function AdminAlert({
  variant,
  children,
  className = "",
}: AdminAlertProps) {
  const config = alertStyles[variant];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      className={`flex items-start gap-3 rounded-[16px] border px-4 py-4 text-sm font-bold ${config.className} ${className}`}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
      />

      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}