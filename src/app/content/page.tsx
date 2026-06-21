"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useContentModeration } from "@/modules/content/useContentModeration";
import { ModerationVideo, TabFilter } from "@/modules/content/services/content.service";
import ReviewModal from "./components/ReviewModal";
import toast from "react-hot-toast";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

// ── Priority Badge ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    critical: { label: "CRITICAL", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25", dot: "bg-red-400" },
    elevated: { label: "ELEVATED", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25", dot: "bg-amber-400" },
    "low-priority": { label: "LOW PRIORITY", bg: "bg-[#1E2433]", text: "text-[#6B7280]", border: "border-[#1E2433]", dot: "bg-[#4B5563]" },
};

function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_CONFIG }) {
    const cfg = PRIORITY_CONFIG[priority];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    delta,
    loading,
}: {
    label: string;
    value: string | number;
    delta: number;
    loading: boolean;
}) {
    const isPositive = delta > 0;
    const color = isPositive ? "text-emerald-400" : "text-red-400";
    const sign = isPositive ? "+" : "";

    return (
        <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl px-5 py-4">
            <p className="text-[#6B7280] text-[11px] font-medium uppercase tracking-widest mb-2">{label}</p>
            {loading ? (
                <div className="h-9 w-24 bg-[#1E2433] rounded-lg animate-pulse" />
            ) : (
                <div className="flex items-end gap-2">
                    <p className="text-white text-[32px] font-bold leading-none">{value}</p>
                    <span className={`text-[12px] font-semibold mb-1 ${color}`}>
                        {sign}{delta}%
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-[#1E2433]">
            {[140, 100, 60, 140, 80, 80].map((w, i) => (
                <td key={i} className="px-5 py-4">
                    <div className="h-4 bg-[#1E2433] rounded animate-pulse" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ── Video Thumbnail ────────────────────────────────────────────────────────

function VideoThumb({ video }: { video: ModerationVideo }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-14 h-10 rounded-lg bg-[#0D1117] border border-[#1E2433] overflow-hidden flex-shrink-0 relative">
                {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#374151]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-5 h-5 rounded-full bg-blue-600/80 flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                </div>
            </div>
            <div className="min-w-0">
                <p className="text-white text-[13px] font-medium truncate max-w-[160px]">{video.title}</p>
                <p className="text-[#4B5563] text-[10px] font-mono">ID: VID-{video.videoId.slice(-4)}</p>
            </div>
        </div>
    );
}

// ── Creator Cell ───────────────────────────────────────────────────────────

function CreatorCell({ video }: { video: ModerationVideo }) {
    const initials = video.creatorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                {video.creatorAvatar ? (
                    <img src={video.creatorAvatar} alt={video.creatorName} className="w-full h-full object-cover" />
                ) : initials}
            </div>
            <div>
                <p className="text-white text-[12px] font-medium leading-tight">{video.creatorName}</p>
                {video.creatorHandle && (
                    <p className="text-[#4B5563] text-[10px]">@{video.creatorHandle}</p>
                )}
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All Pending" },
    { key: "reported", label: "Reported Videos" },
    { key: "high-priority", label: "High Priority" },
];

export default function ContentPage() {
    const {
        stats,
        statsLoading,
        videos,
        total,
        loading,
        error,
        activeTab,
        searchQuery,
        setSearchQuery,
        switchTab,
        approveVideo,
        rejectVideo,
        dismissReport,
        reload,
        tabCounts,
    } = useContentModeration();

    const [reviewingVideo, setReviewingVideo] = useState<ModerationVideo | null>(null);

    const handleApprove = async (videoId: string) => {
        const ok = await approveVideo(videoId);
        if (ok) toast.success("Video approved — reports cleared");
        else toast.error("Failed to approve video");
        return ok;
    };

    const handleReject = async (videoId: string, reason: string) => {
        const ok = await rejectVideo(videoId, reason);
        if (ok) toast.success("Video taken down successfully");
        else toast.error("Failed to take down video");
        return ok;
    };

    const handleDismiss = async (reportId: string, videoId: string) => {
        const ok = await dismissReport(reportId, videoId);
        if (!ok) toast.error("Failed to dismiss report");
        return ok;
    };

    return (
        <AdminLayout title="Content">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white text-[22px] font-bold">Reported Content Moderation Queue</h2>
                    <p className="text-[#6B7280] text-[13px] mt-0.5">
                        Review and action community-reported videos across the platform.
                    </p>
                </div>
                <button
                    onClick={reload}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#131B2E] border border-[#1E2433] text-[#9CA3AF] hover:text-white text-[13px] rounded-xl transition-colors"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <StatCard label="Pending Reviews" value={stats.pendingReviews} delta={stats.pendingDelta} loading={statsLoading} />
                <StatCard label="Reported Videos" value={stats.reportedVideos} delta={stats.reportedDelta} loading={statsLoading} />
                <StatCard
                    label="Avg. Wait Time"
                    value={`${stats.avgWaitMinutes}m`}
                    delta={stats.avgWaitDelta}
                    loading={statsLoading}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px] flex items-center gap-2">
                    {error}
                    <button onClick={reload} className="ml-auto underline text-[11px]">Retry</button>
                </div>
            )}

            {/* Table Card */}
            <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
                {/* Tabs + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-4 pb-0 border-b border-[#1E2433]">
                    {/* Tabs */}
                    <div className="flex items-center gap-0">
                        {TABS.map(({ key, label }) => {
                            const count = key === "all" ? total : tabCounts[key];
                            const active = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => switchTab(key)}
                                    className={`px-4 py-3 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${active
                                        ? "border-blue-500 text-white"
                                        : "border-transparent text-[#6B7280] hover:text-white"
                                        }`}
                                >
                                    {label}
                                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-blue-600/30 text-blue-300" : "bg-[#1E2433] text-[#4B5563]"}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search + Filter */}
                    <div className="flex items-center gap-2 pb-3">
                        <div className="flex items-center gap-2 bg-[#0D1117] border border-[#1E2433] rounded-xl px-3 py-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                                type="text"
                                placeholder="Search reported content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-[12px] text-white placeholder-[#374151] outline-none w-44"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0D1117] border border-[#1E2433] text-[#6B7280] hover:text-white text-[12px] rounded-xl transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
                            Filter
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1E2433]">
                                {["Video", "Creator", "Report Count", "Latest Viewer Reason", "Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : videos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-[#1E2433] flex items-center justify-center text-[#374151]">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            </div>
                                            <p className="text-[#4B5563] text-[13px] font-medium">No reported content</p>
                                            <p className="text-[#374151] text-[12px]">All videos have been reviewed or no reports are pending.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                videos.map((video) => (
                                    <tr
                                        key={video.videoId}
                                        className="border-b border-[#1E2433] last:border-b-0 hover:bg-[#1A2235]/40 transition-colors"
                                    >
                                        {/* Video */}
                                        <td className="px-5 py-4">
                                            <VideoThumb video={video} />
                                        </td>

                                        {/* Creator */}
                                        <td className="px-5 py-4">
                                            <CreatorCell video={video} />
                                        </td>

                                        {/* Report Count */}
                                        <td className="px-5 py-4">
                                            <span className={`text-[13px] font-bold ${video.priority === "critical"
                                                ? "text-red-400"
                                                : video.priority === "elevated"
                                                    ? "text-amber-400"
                                                    : "text-[#9CA3AF]"
                                                }`}>
                                                {video.reportCount} Reports
                                            </span>
                                        </td>

                                        {/* Latest Reason */}
                                        <td className="px-5 py-4 max-w-[180px]">
                                            <p className="text-[#6B7280] text-[11px] line-clamp-2 leading-relaxed">
                                                "{video.latestReason}"
                                            </p>
                                        </td>

                                        {/* Priority Status */}
                                        <td className="px-5 py-4">
                                            <PriorityBadge priority={video.priority} />
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => setReviewingVideo(video)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded-xl transition-colors"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!loading && videos.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1E2433]">
                        <p className="text-[11px] text-[#4B5563]">
                            Showing <span className="text-white font-medium">1–{videos.length}</span> of{" "}
                            <span className="text-white font-medium">{total}</span> reported videos
                        </p>
                        <div className="flex items-center gap-1">
                            <button className="w-7 h-7 rounded-lg border border-[#1E2433] flex items-center justify-center text-[#4B5563] hover:text-white hover:border-[#374151] transition-colors">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
                                1
                            </button>
                            <button className="w-7 h-7 rounded-lg border border-[#1E2433] flex items-center justify-center text-[#4B5563] hover:text-white hover:border-[#374151] transition-colors">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewingVideo && (
                <ReviewModal
                    video={reviewingVideo}
                    onClose={() => setReviewingVideo(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDismissReport={handleDismiss}
                />
            )}
        </AdminLayout>
    );
}
