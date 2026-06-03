"use client";

import { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useRevenue } from "@/modules/revenue/hooks/useRevenue";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return fmt(n);
}

function formatDate(ts: any) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MiniSparkline({ color }: { color: string }) {
    const heights = [30, 50, 35, 62, 45, 70, 55, 80];
    return (
        <div className="flex items-end gap-[3px] h-8 mt-3">
            {heights.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: color, opacity: 0.5 + i * 0.06 }} />
            ))}
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="border-b border-[#1E2433]">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <div className="h-4 bg-[#1E2433] rounded animate-pulse" style={{ width: i === 1 ? "120px" : "80px" }} />
                </td>
            ))}
        </tr>
    );
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    free: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "FREE" },
    pay_per_view: { bg: "bg-amber-500/10", text: "text-amber-400", label: "PPV" },
    subscription: { bg: "bg-blue-500/10", text: "text-blue-400", label: "SUBSCRIPTION" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    initiated: { bg: "bg-[#1E2433]", text: "text-[#6B7280]", label: "INITIATED" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "COMPLETED" },
    paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "PAID" },
    cancel: { bg: "bg-red-500/10", text: "text-red-400", label: "CANCELLED" },
};

function DonutChart({ sub, ppv, free }: { sub: number; ppv: number; free: number }) {
    const total = sub + ppv + free || 1;
    const data = [
        { value: (sub / total) * 100, color: "#3B82F6", label: "Subscriptions" },
        { value: (ppv / total) * 100, color: "#6366F1", label: "Pay Per View" },
        { value: (free / total) * 100, color: "#8B5CF6", label: "Free" },
    ];

    const size = 130;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 52;
    const innerR = 32;
    let angle = -Math.PI / 2;

    const segments = data.map((item) => {
        const sweep = (item.value / 100) * 2 * Math.PI;
        if (sweep < 0.01) { angle += sweep; return { ...item, d: "" }; }
        const x1 = cx + outerR * Math.cos(angle);
        const y1 = cy + outerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle + sweep);
        const y2 = cy + outerR * Math.sin(angle + sweep);
        const ix1 = cx + innerR * Math.cos(angle);
        const iy1 = cy + innerR * Math.sin(angle);
        const ix2 = cx + innerR * Math.cos(angle + sweep);
        const iy2 = cy + innerR * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const d = `M${x1} ${y1} A${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}Z`;
        angle += sweep;
        return { ...item, d };
    });

    return (
        <div className="flex items-center gap-6">
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
                    {segments.map((s, i) => s.d ? (
                        <path key={i} d={s.d} fill={s.color} stroke="#0D1117" strokeWidth={2} />
                    ) : null)}
                    <text x={cx} y={cy - 7} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight={500}>TOTAL</text>
                    <text x={cx} y={cy + 9} textAnchor="middle" fill="#FFFFFF" fontSize={13} fontWeight={700}>{fmtShort(total)}</text>
                </svg>
            </div>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                {data.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                            <span className="text-[#9CA3AF] text-[12px] truncate">{item.label}</span>
                        </div>
                        <span className="text-white text-[12px] font-semibold whitespace-nowrap">{item.value.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RevenuePage() {
    const {
        stats, transactions, total, currentPage, totalPages,
        hasPrev, hasNext, loading, statsLoading, error,
        fetchStats, loadFirstPage, nextPage, prevPage, PAGE_SIZE,
    } = useRevenue();

    useEffect(() => {
        fetchStats();
        loadFirstPage();
    }, []);

    const from = (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, total);

    // Commission breakdown derived from real stats
    const grossFees = stats.netPlatformCommission;
    const stripeProcessing = stats.totalGrossRevenue * 0.029 + (transactions.length * 0.30);
    const affiliatePayouts = stats.totalGrossRevenue * 0.015;
    const netProfit = grossFees - stripeProcessing - affiliatePayouts;

    const maxFee = Math.max(grossFees, 1);

    return (
        <AdminLayout title="Revenue">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white text-[22px] font-bold">Platform Revenue Reports</h2>
                    <p className="text-[#6B7280] text-[13px] mt-0.5">Track earnings, commissions, and transaction history.</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px] flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                    <button onClick={() => { fetchStats(); loadFirstPage(); }} className="ml-auto underline text-[11px]">Retry</button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {/* Total Gross Revenue */}
                <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-4">
                    <div className="flex items-start justify-between">
                        <p className="text-[#6B7280] text-[11px] uppercase tracking-widest font-medium">Total Gross Revenue</p>
                    </div>
                    {statsLoading ? (
                        <div className="h-8 w-36 bg-[#1E2433] rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-white text-[24px] font-bold tracking-tight mt-1">{fmt(stats.totalGrossRevenue)}</p>
                    )}
                    <MiniSparkline color="#3B82F6" />
                </div>

                {/* Net Platform Commission */}
                <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-4">
                    <div className="flex items-start justify-between">
                        <p className="text-[#6B7280] text-[11px] uppercase tracking-widest font-medium">Net Platform Commission</p>
                        <span className="text-[10px] text-[#4B5563] bg-[#1E2433] px-2 py-0.5 rounded-full">15%</span>
                    </div>
                    {statsLoading ? (
                        <div className="h-8 w-36 bg-[#1E2433] rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-white text-[24px] font-bold tracking-tight mt-1">{fmt(stats.netPlatformCommission)}</p>
                    )}
                    <MiniSparkline color="#6366F1" />
                </div>

                {/* Active Monetizing Creators */}
                <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-4">
                    <p className="text-[#6B7280] text-[11px] uppercase tracking-widest font-medium">Active Monetizing Creators</p>
                    {statsLoading ? (
                        <div className="h-8 w-24 bg-[#1E2433] rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-white text-[24px] font-bold tracking-tight mt-1">{stats.activeMonetizingCreators.toLocaleString()}</p>
                    )}
                    <MiniSparkline color="#8B5CF6" />
                </div>
            </div>

            {/* Middle row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                {/* Revenue Distribution */}
                <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
                    <p className="text-white text-[14px] font-semibold mb-4">Revenue Distribution</p>
                    {statsLoading ? (
                        <div className="flex items-center gap-6">
                            <div className="w-[130px] h-[130px] rounded-full bg-[#1E2433] animate-pulse flex-shrink-0" />
                            <div className="flex flex-col gap-3 flex-1">
                                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-[#1E2433] rounded animate-pulse" />)}
                            </div>
                        </div>
                    ) : (
                        <DonutChart
                            sub={stats.subscriptionRevenue}
                            ppv={stats.ppvRevenue}
                            free={stats.freeRevenue}
                        />
                    )}
                </div>

                {/* Commission Breakdown */}
                <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
                    <p className="text-white text-[14px] font-semibold mb-4">Commission Breakdown</p>
                    {statsLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="h-4 bg-[#1E2433] rounded animate-pulse mb-2" />
                                    <div className="h-1 bg-[#1E2433] rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4">
                                {[
                                    { label: "Gross Platform Fees", amount: grossFees, pct: 100, color: "#3B82F6" },
                                    { label: "Payment Processing (Stripe)", amount: stripeProcessing, pct: (stripeProcessing / maxFee) * 100, color: "#EF4444" },
                                    { label: "Affiliate Payouts", amount: affiliatePayouts, pct: (affiliatePayouts / maxFee) * 100, color: "#F59E0B" },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[#9CA3AF] text-[12px]">{item.label}</span>
                                            <span className="text-white text-[12px] font-semibold">{fmt(item.amount)}</span>
                                        </div>
                                        <div className="w-full h-[4px] bg-[#1E2433] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, Math.max(0, item.pct))}%`, background: item.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 pt-4 border-t border-[#1E2433] flex justify-between items-center">
                                <span className="text-[#9CA3AF] text-[13px] font-medium">Net Platform Profit</span>
                                <span className={`text-[16px] font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {fmt(Math.max(0, netProfit))}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433]">
                    <h3 className="text-white text-[14px] font-semibold">Recent Transactions</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[#4B5563] text-[12px]">{total.toLocaleString()} total</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1E2433]">
                                {["Transaction ID", "Creator", "Type", "Amount", "Platform Fee", "Status", "Date"].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-[#4B5563]">
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                            <p className="text-[13px]">No transactions found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => {
                                    const typeStyle = TYPE_STYLES[txn.monetization_strategy] ?? TYPE_STYLES.free;
                                    const statusStyle = STATUS_STYLES[txn.status] ?? STATUS_STYLES.initiated;
                                    const platformFee = txn.amount * PLATFORM_COMMISSION_RATE;
                                    return (
                                        <tr key={txn.id} className="border-b border-[#1E2433] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4 font-mono text-[12px] text-[#6B7280] whitespace-nowrap">
                                                #{txn.payment_id.slice(0, 10).toUpperCase()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                                                        {txn.creatorInitials}
                                                    </div>
                                                    <span className="text-white text-[13px] font-medium whitespace-nowrap">{txn.creatorName}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded ${typeStyle.bg} ${typeStyle.text} tracking-wider`}>
                                                    {typeStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-white text-[13px] font-semibold whitespace-nowrap">
                                                {fmt(txn.amount)}
                                            </td>
                                            <td className="px-5 py-4 text-[#9CA3AF] text-[13px] whitespace-nowrap">
                                                {fmt(platformFee)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded ${statusStyle.bg} ${statusStyle.text} tracking-wider`}>
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-[#6B7280] text-[12px] whitespace-nowrap">
                                                {formatDate(txn.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && total > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E2433]">
                        <p className="text-[12px] text-[#6B7280]">
                            Showing <span className="text-white font-medium">{from} – {to}</span> of{" "}
                            <span className="text-white font-medium">{total.toLocaleString()}</span> transactions
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={prevPage}
                                disabled={!hasPrev || loading}
                                className="w-7 h-7 rounded-lg border border-[#1E2433] bg-[#0D1117] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#2E3A4E] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let p: number;
                                if (totalPages <= 5) {
                                    p = i + 1;
                                } else if (currentPage <= 3) {
                                    p = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    p = totalPages - 4 + i;
                                } else {
                                    p = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={p}
                                        className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-all ${p === currentPage
                                            ? "bg-blue-600 text-white border border-blue-500"
                                            : "border border-[#1E2433] bg-[#0D1117] text-[#6B7280] hover:text-white hover:border-[#2E3A4E]"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={nextPage}
                                disabled={!hasNext || loading}
                                className="w-7 h-7 rounded-lg border border-[#1E2433] bg-[#0D1117] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#2E3A4E] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

const PLATFORM_COMMISSION_RATE = 0.15;
