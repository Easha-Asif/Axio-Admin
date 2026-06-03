"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { useDashboard } from "@/modules/dashboard/useDashboard";
import CreatorRow from "@/components/creator/creatorrow";

// Helpers
function formatRevenue(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
}

function formatViewers(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

const SYSTEM_HEALTH = [
    { label: "Encoding API", status: "99.9%", color: "bg-emerald-500", width: "w-[99%]", tag: "NORMAL", tagColor: "text-emerald-400" },
    { label: "Storage Nodes", status: "Normal", color: "bg-emerald-500", width: "w-[82%]", tag: "NORMAL", tagColor: "text-emerald-400" },
    { label: "Payment Gateway", status: "Slight Latency", color: "bg-amber-500", width: "w-[60%]", tag: "SLIGHT LATENCY", tagColor: "text-amber-400" },
];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHART_DATA = [
    { verified: 40, pending: 15 },
    { verified: 65, pending: 25 },
    { verified: 30, pending: 10 },
    { verified: 80, pending: 30 },
    { verified: 55, pending: 20 },
    { verified: 45, pending: 10 },
    { verified: 70, pending: 25 },
];

export default function DashboardPage() {
    const { stats, recentSignups, loading, error, refresh } = useDashboard();

    const [creators, setCreators] = useState(recentSignups);

    useEffect(() => {
        setCreators(recentSignups);
    }, [recentSignups]);

    const now = new Date();
    const dateRange = `${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })} – ${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })}`;

    return (
        <AdminLayout title="Admin Dashboard">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white text-[22px] font-bold">
                        Dashboard Overview
                    </h2>
                    <p className="text-[#6B7280] text-[13px]">
                        Real-time platform performance and creator health.
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="Total Creators"
                    value={loading ? "—" : stats.totalCreators.toLocaleString()}
                />
                <StatCard
                    label="Total Viewers"
                    value={loading ? "—" : formatViewers(stats.totalViewers)}
                />
                <StatCard
                    label="Total Revenue"
                    value={loading ? "—" : formatRevenue(stats.totalRevenue)}
                />
                <StatCard
                    label="Pending Approvals"
                    value={loading ? "—" : stats.pendingApprovals}
                />
            </div>

            {/* Table */}
            <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433]">
                    <h3 className="text-white text-[14px] font-semibold">
                        Recent Creator Sign-ups
                    </h3>
                    <Link
                        href="/creators"
                        className="text-[12px] text-blue-400 hover:text-blue-300"
                    >
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1E2433]">
                                {["Creator", "Status", "Join Date", "Action"].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="text-left px-5 py-3 text-[10px] text-[#4B5563] uppercase"
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 4 }).map((__, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 bg-[#1E2433] rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : creators.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-8 text-center text-[#4B5563]"
                                    >
                                        No recent sign-ups
                                    </td>
                                </tr>
                            ) : (
                                creators.map((creator) => (
                                    <CreatorRow
                                        key={creator.id}
                                        creator={creator}
                                        onStatusUpdated={(id, status) => {
                                            setCreators((prev) =>
                                                prev.map((c) =>
                                                    c.id === id
                                                        ? {
                                                            ...c,
                                                            invitation_status:
                                                                status,
                                                        }
                                                        : c
                                                )
                                            );
                                        }}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}


// "use client";

// import { useEffect } from "react";
// import Link from "next/link";
// import AdminLayout from "@/components/admin/AdminLayout";
// import StatCard from "@/components/admin/StatCard";
// import { useDashboard } from "@/modules/dashboard/useDashboard";
// import CreatorRow from "@/components/creator/creatorrow";

// // Helpers
// function formatRevenue(amount: number): string {
//     if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
//     if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
//     return `$${amount.toLocaleString()}`;
// }

// function formatDate(ts: any): string {
//     if (!ts) return "—";
//     const date = ts?.toDate ? ts.toDate() : new Date(ts);
//     return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
// }

// function formatViewers(n: number): string {
//     if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//     if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
//     return n.toLocaleString();
// }

// const SYSTEM_HEALTH = [
//     { label: "Encoding API", status: "99.9%", color: "bg-emerald-500", width: "w-[99%]", tag: "NORMAL", tagColor: "text-emerald-400" },
//     { label: "Storage Nodes", status: "Normal", color: "bg-emerald-500", width: "w-[82%]", tag: "NORMAL", tagColor: "text-emerald-400" },
//     { label: "Payment Gateway", status: "Slight Latency", color: "bg-amber-500", width: "w-[60%]", tag: "SLIGHT LATENCY", tagColor: "text-amber-400" },
// ];

// // Placeholder bar chart data
// const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// const CHART_DATA = [
//     { verified: 40, pending: 15 },
//     { verified: 65, pending: 25 },
//     { verified: 30, pending: 10 },
//     { verified: 80, pending: 30 },
//     { verified: 55, pending: 20 },
//     { verified: 45, pending: 10 },
//     { verified: 70, pending: 25 },
// ];

// export default function DashboardPage() {
//     const { stats, recentSignups, loading, error, refresh } = useDashboard();

//     useEffect(() => {
//         // Refresh on mount handled in hook
//     }, []);

//     // Date range
//     const now = new Date();
//     const dateRange = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

//     return (
//         <AdminLayout title="Admin Dashboard">
//             {/* Header row */}
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
//                 <div>
//                     <h2 className="text-white text-[22px] font-bold leading-tight">Dashboard Overview</h2>
//                     <p className="text-[#6B7280] text-[13px] mt-0.5">Real-time platform performance and creator health.</p>
//                 </div>
//                 <div className="flex items-center gap-2 flex-wrap">
//                     {/* Date range */}
//                     <div className="flex items-center gap-2 bg-[#131B2E] border border-[#1E2433] rounded-lg px-3 py-2">
//                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
//                         <span className="text-[#9CA3AF] text-[12px]">Oct 1 – Oct 31, 2023</span>
//                     </div>

//                     {/* Time filters */}
//                     <div className="flex bg-[#131B2E] border border-[#1E2433] rounded-lg overflow-hidden">
//                         {["Live", "24h", "7d", "30d"].map((f, i) => (
//                             <button
//                                 key={f}
//                                 className={`px-3 py-2 text-[11px] font-medium transition-colors
//                                     ${i === 0 ? "bg-blue-600/20 text-blue-400 border-r border-[#1E2433]" : "text-[#6B7280] hover:text-white border-r border-[#1E2433] last:border-r-0"}`}
//                             >
//                                 {f === "Live" ? (
//                                     <span className="flex items-center gap-1.5">
//                                         <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
//                                         Live
//                                     </span>
//                                 ) : f}
//                             </button>
//                         ))}
//                     </div>

//                     <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium rounded-lg transition-colors">
//                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
//                         Export Report
//                     </button>
//                 </div>
//             </div>

//             {/* Error */}
//             {error && (
//                 <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px] flex items-center gap-2">
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
//                     {error}
//                     <button onClick={refresh} className="ml-auto text-red-300 hover:text-white underline text-[11px]">Retry</button>
//                 </div>
//             )}

//             {/* Stat Cards */}
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
//                 <StatCard
//                     label="Total Creators"
//                     value={loading ? "—" : stats.totalCreators.toLocaleString()}
//                     change="12.5%"
//                     changeType="up"
//                     loading={loading}
//                 />
//                 <StatCard
//                     label="Total Viewers"
//                     value={loading ? "—" : formatViewers(stats.totalViewers)}
//                     change="5.2%"
//                     changeType="down"
//                     loading={loading}
//                 />
//                 <StatCard
//                     label="Total Revenue"
//                     value={loading ? "—" : formatRevenue(stats.totalRevenue)}
//                     change="18.0%"
//                     changeType="down"
//                     loading={loading}
//                 />
//                 <StatCard
//                     label="Pending Approvals"
//                     value={loading ? "—" : stats.pendingApprovals}
//                     action={
//                         <button className="text-[#4B5563] hover:text-white transition-colors">
//                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
//                         </button>
//                     }
//                     loading={loading}
//                 />
//             </div>

//             {/* Charts Row */}
//             {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6"> */}
//             <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-6">
//                 {/* Platform Growth Chart */}
//                 <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5 min-h-[420px] flex flex-col">
//                     <div className="flex justify-between items-center mb-1">
//                         <div>
//                             <h3 className="text-white text-[14px] font-semibold">Platform Growth</h3>
//                             <p className="text-[#6B7280] text-[11px]">New creator sign-ups over the last 7 days</p>
//                         </div>
//                         <div className="flex items-center gap-3 text-[11px]">
//                             <span className="flex items-center gap-1.5 text-[#9CA3AF]">
//                                 <span className="w-2 h-2 rounded-full bg-blue-500" /> Verified
//                             </span>
//                             <span className="flex items-center gap-1.5 text-[#9CA3AF]">
//                                 <span className="w-2 h-2 rounded-full bg-[#2E3A4E]" /> Pending
//                             </span>
//                         </div>
//                     </div>

//                     {/* Bar chart */}
//                     <div className="flex items-end justify-between gap-1.5 h-full mt-4">
//                         {CHART_DATA.map((d, i) => {
//                             const maxH = 80;
//                             const vH = Math.round((d.verified / 100) * maxH);
//                             const pH = Math.round((d.pending / 100) * maxH);
//                             return (
//                                 <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
//                                     <div className="w-full flex flex-col gap-0.5 items-center">
//                                         <div
//                                             className="w-full rounded-t bg-blue-600 transition-all duration-500 hover:bg-blue-500"
//                                             style={{ height: vH }}
//                                         />
//                                         <div
//                                             className="w-full rounded-b bg-[#1E2A3A] transition-all duration-500"
//                                             style={{ height: pH }}
//                                         />
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                     <div className="flex justify-between mt-2">
//                         {WEEK_DAYS.map((d) => (
//                             <span key={d} className="flex-1 text-center text-[10px] text-[#4B5563]">{d}</span>
//                         ))}
//                     </div>

//                     <button className="mt-4 text-[12px] text-blue-400 hover:text-blue-300 transition-colors">
//                         View Detailed Metrics →
//                     </button>
//                 </div>

//                 {/* System Health */}
//                 <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5 min-h-[420px]">
//                     <h3 className="text-white text-[14px] font-semibold mb-4">System Health</h3>
//                     <div className="space-y-5">
//                         {SYSTEM_HEALTH.map((item) => (
//                             <div key={item.label}>
//                                 <div className="flex justify-between items-center mb-2">
//                                     <span className="text-[#9CA3AF] text-[12px] font-medium uppercase tracking-wider">{item.label}</span>
//                                     <span className={`text-[11px] font-semibold ${item.tagColor}`}>{item.tag}</span>
//                                 </div>
//                                 <div className="w-full h-2 bg-[#1E2433] rounded-full overflow-hidden">
//                                     <div className={`h-full ${item.color} ${item.width} rounded-full transition-all duration-700`} />
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Recent Signups Table */}
//             <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
//                 <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433]">
//                     <h3 className="text-white text-[14px] font-semibold">Recent Creator Sign-ups</h3>
//                     <Link href="/creators" className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors">
//                         View All Creators →
//                     </Link>
//                 </div>

//                 <div className="overflow-x-auto">
//                     <table className="w-full">
//                         <thead>
//                             <tr className="border-b border-[#1E2433]">
//                                 {["Creator", "Status", "Join Date", "Action"].map((h) => (
//                                     <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest">
//                                         {h}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 Array.from({ length: 3 }).map((_, i) => (
//                                     <tr key={i} className="border-b border-[#1E2433]">
//                                         {Array.from({ length: 5 }).map((__, j) => (
//                                             <td key={j} className="px-5 py-4">
//                                                 <div className="h-4 bg-[#1E2433] rounded animate-pulse" />
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 ))
//                             ) : recentSignups.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={5} className="px-5 py-8 text-center text-[#4B5563] text-[13px]">
//                                         No recent sign-ups
//                                     </td>
//                                 </tr>
//                             ) : (

//                                 recentSignups.map((creator) => (
//                                     <CreatorRow
//                                         key={creator.id}
//                                         creator={creator}
//                                         onStatusUpdated={(id, status) => {

//                                         }}

//                                     />
//                                 ))

//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </AdminLayout>
//     );
// }
