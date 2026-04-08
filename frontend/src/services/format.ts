export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null) return "N/A";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(2);
}

export function formatPct(n: number | null | undefined): string {
  if (n == null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatVolume(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return formatCompact(n);
}

export function pctClass(n: number | null | undefined): string {
  if (n == null) return "neutral";
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "neutral";
}
