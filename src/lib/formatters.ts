export type SupportedCurrency =
  | "MXN"
  | "USD";

export function formatCurrency(
  value: number,
  currency: SupportedCurrency = "MXN"
) {
  const formatted =
    new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0,
    }).format(value);

  return `$${formatted} ${currency}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}