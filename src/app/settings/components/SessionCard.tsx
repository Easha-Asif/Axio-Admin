// ── Section Card ───────────────────────────────────────────────────────────

export function SectionCard({
    title,
    subtitle,
    badge,
    badgeColor,
    icon,
    iconColor,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    icon: React.ReactNode;
    iconColor: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433]">
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
                        {icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-white text-[14px] font-semibold">{title}</h3>
                            {badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && <p className="text-[#4B5563] text-[11px]">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}