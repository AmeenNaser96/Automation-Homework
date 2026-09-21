export function money(n: number | string) {
  const v = Number(n) || 0;
  return `${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ`;
}

export function statusBadgeClass(status: string) {
  if (status === "completed") return "badge badge-success";
  if (status === "pending") return "badge badge-warning";
  if (status === "cancelled") return "badge badge-danger";
  return "badge badge-neutral";
}

export function statusLabel(status: string) {
  if (status === "completed") return "مكتمل";
  if (status === "pending") return "قيد الانتظار";
  if (status === "cancelled") return "ملغي";
  return status;
}

export function channelLabel(channel: string) {
  return channel === "branch" ? "فرع" : "متجر إلكتروني";
}
