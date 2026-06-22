interface StatCardProps {
    label: string;
    value: string | number;
    change?: string;
    changeType?: "up" | "down" | "neutral";
    action?: React.ReactNode;
    loading?: boolean;
}

export default function StatCard({ label, value, change, changeType = "up", action, loading }: StatCardProps) {
    const changeColor = changeType === "up" ? "text-emerald-400" : changeType === "down" ? "text-red-400" : "text-[#6B7280]";

    return (
        <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <p className="text-[#6B7280] text-[11px] uppercase tracking-widest font-medium">{label}</p>
                {action && <div className="text-[#4B5563]">{action}</div>}
            </div>
            {loading ? (
                <div className="h-8 w-32 bg-[#1E2433] rounded-lg animate-pulse" />
            ) : (
                <div className="flex items-end gap-2">
                    <span className="text-white text-[26px] font-bold leading-none tracking-tight">{value}</span>
                    {change && (
                        <span className={`text-[12px] font-medium mb-0.5 ${changeColor}`}>
                            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
