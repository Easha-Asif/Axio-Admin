
const IconClock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
// ── Audit Entry ────────────────────────────────────────────────────────────

export function AuditEntry({ entry }: { entry: { action: string; field: string; old_value: string; new_value: string; changed_at: any } }) {
    const fieldLabel = entry.field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const timeStr = entry.changed_at?.toDate
        ? entry.changed_at.toDate().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : "Just now";

    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#1E2433] last:border-b-0">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-medium">
                    {fieldLabel}{" "}
                    <span className="font-normal text-[#6B7280]">{entry.action}</span>
                </p>
                {entry.old_value !== entry.new_value && (
                    <p className="text-[11px] text-[#4B5563] mt-0.5">
                        <span className="text-red-400/70">{entry.old_value}</span>
                        {" → "}
                        <span className="text-emerald-400/80">{entry.new_value}</span>
                    </p>
                )}
                <p className="text-[10px] text-[#374151] mt-0.5 flex items-center gap-1">
                    <IconClock /> {timeStr}
                </p>
            </div>
        </div>
    );
}