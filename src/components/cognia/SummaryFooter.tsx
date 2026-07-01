export interface SummaryItem {
  label: string;
  value: string;
  color?: "default" | "success" | "warning" | "risk" | "cyan";
}
export interface SummaryFooterProps {
  items: SummaryItem[];
  recordCount: number;
  recordLabel?: string;
}

const toneMap: Record<NonNullable<SummaryItem["color"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  risk: "text-risk",
  cyan: "text-cyan",
};

export function SummaryFooter({ items, recordCount, recordLabel = "registros" }: SummaryFooterProps) {
  return (
    <div className="glass-card mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs">
      <span className="font-semibold tabular-nums">
        {recordCount} {recordLabel}
      </span>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-white/30">|</span>
          <span>{it.label}:</span>
          <span className={`font-semibold tabular-nums ${toneMap[it.color ?? "default"]}`}>{it.value}</span>
        </span>
      ))}
    </div>
  );
}
