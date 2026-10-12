type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

export default function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  const styles = {
    success:
      "bg-emerald-50 text-emerald-700",
    warning:
      "bg-amber-50 text-amber-700",
    danger:
      "bg-red-50 text-red-700",
    info:
      "bg-blue-50 text-blue-700",
    neutral:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}