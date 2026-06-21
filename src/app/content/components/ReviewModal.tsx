"use client";

import { useState, useEffect } from "react";
import { ModerationVideo, Report } from "@/modules/content/services/content.service";

interface Props {
    video: ModerationVideo;
    onClose: () => void;
    onApprove: (videoId: string) => Promise<boolean>;
    onReject: (videoId: string, reason: string) => Promise<boolean>;
    onDismissReport: (reportId: string, videoId: string) => Promise<boolean>;
}

function formatDate(ts: any): string {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(seconds: number): string {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

const PRIORITY_STYLES = {
    critical: "bg-red-500/15 text-red-400 border border-red-500/25",
    elevated: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    "low-priority": "bg-[#1E2433] text-[#6B7280] border border-[#1E2433]",
};

const REASON_COLORS: Record<string, string> = {
    "Harmful or Dangerous Acts": "text-red-400",
    "Automated Content Match": "text-amber-400",
    "Misleading Information": "text-orange-400",
    "Copyright Infringement": "text-purple-400",
    "Hate Speech": "text-red-400",
    "Spam": "text-[#6B7280]",
};

function getReasonColor(reason: string): string {
    for (const [key, color] of Object.entries(REASON_COLORS)) {
        if (reason.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return "text-blue-400";
}

function InitialAvatar({ name, size = 8 }: { name: string; size?: number }) {
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
    return (
        <div
            className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}
        >
            {initials}
        </div>
    );
}

export default function ReviewModal({ video, onClose, onApprove, onReject, onDismissReport }: Props) {
    const [rejectionReason, setRejectionReason] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
    const [dismissingId, setDismissingId] = useState<string | null>(null);
    const [localReports, setLocalReports] = useState<Report[]>(video.reports);

    useEffect(() => {
        setLocalReports(video.reports);
    }, [video.reports]);

    // Escape key
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    const handleApprove = async () => {
        setActionLoading("approve");
        await onApprove(video.videoId);
        setActionLoading(null);
        onClose();
    };

    const handleReject = async () => {
        setActionLoading("reject");
        await onReject(video.videoId, rejectionReason);
        setActionLoading(null);
        onClose();
    };

    const handleDismiss = async (reportId: string) => {
        setDismissingId(reportId);
        const ok = await onDismissReport(reportId, video.videoId);
        if (ok) setLocalReports((prev) => prev.filter((r) => r.id !== reportId));
        setDismissingId(null);
    };

    const priorityLabel = video.priority.replace("-", " ").toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-[#0D1117] border border-[#1E2433] rounded-2xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433] flex-shrink-0">
                    <h2 className="text-white text-[15px] font-semibold">Review Video</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-[12px] font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Reject
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                        >
                            {actionLoading === "approve" ? (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            Approve
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-[#131B2E] border border-[#1E2433] flex items-center justify-center text-[#6B7280] hover:text-white transition-colors"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body - two columns */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left - Video Preview */}
                    <div className="flex-1 overflow-y-auto p-5 border-r border-[#1E2433]">
                        <h3 className="text-white text-[14px] font-semibold mb-4">Review Video</h3>

                        {/* Video Player Placeholder */}
                        <div className="relative bg-[#080C14] rounded-xl overflow-hidden aspect-video mb-4">
                            {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-70" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-[#374151]">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    </div>
                                </div>
                            )}
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-blue-600/90 flex items-center justify-center shadow-xl">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                </div>
                            </div>
                            {/* Duration + controls bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-4 py-3">
                                <div className="w-full h-0.5 bg-white/20 rounded mb-2">
                                    <div className="h-full w-2/5 bg-blue-500 rounded" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-[11px]">02:14</span>
                                    <div className="flex items-center gap-3">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        <span className="text-white text-[11px]">{formatDuration(video.duration)}</span>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Video meta chips */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="text-[11px] text-[#4B5563] bg-[#131B2E] border border-[#1E2433] px-2.5 py-1.5 rounded-lg font-mono">
                                vid_{video.videoId.slice(-6)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-[#6B7280] bg-[#131B2E] border border-[#1E2433] px-2.5 py-1.5 rounded-lg">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                @{video.creatorHandle || video.creatorName}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-[#6B7280] bg-[#131B2E] border border-[#1E2433] px-2.5 py-1.5 rounded-lg">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                {formatViews(video.views)} views
                            </span>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {[
                                { label: "UPLOADED", value: formatDate(video.uploadedAt) },
                                { label: "CATEGORY", value: video.category },
                                { label: "MONETIZATION", value: video.monetization === "pay_per_view" ? "PPV" : video.monetization === "subscription" ? "Subscription" : "Active" },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-[#131B2E] border border-[#1E2433] rounded-xl px-3 py-2.5">
                                    <p className="text-[9px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1">{label}</p>
                                    <p className="text-white text-[12px] font-medium">{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Rejection Reason */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest">
                                    Rejection Reason (Public)
                                </p>
                                <a href="#" className="text-[10px] text-blue-400 hover:text-blue-300">
                                    Visible to Creator
                                </a>
                            </div>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter the reason for rejection..."
                                rows={3}
                                className="w-full bg-[#131B2E] border border-[#1E2433] rounded-xl px-4 py-3 text-[#9CA3AF] text-[12px] outline-none focus:border-blue-600/50 transition-colors resize-none placeholder-[#374151]"
                            />
                        </div>

                        {/* Admin Note */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest">
                                    Internal Admin Note (Private)
                                </p>
                                <button className="text-[10px] text-blue-400 hover:text-blue-300">
                                    Team Info
                                </button>
                            </div>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add notes for other moderators..."
                                rows={3}
                                className="w-full bg-[#131B2E] border border-[#1E2433] rounded-xl px-4 py-3 text-[#9CA3AF] text-[12px] outline-none focus:border-blue-600/50 transition-colors resize-none placeholder-[#374151]"
                            />
                            <p className="text-[10px] text-[#374151] mt-1.5">
                                This note is only visible to other administrators.
                            </p>
                        </div>
                    </div>

                    {/* Right - Reports Panel */}
                    <div className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden">
                        {/* Reports header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1E2433] flex-shrink-0">
                            <h3 className="text-white text-[13px] font-semibold">
                                Viewer Reports ({localReports.length})
                            </h3>
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${PRIORITY_STYLES[video.priority]}`}>
                                {priorityLabel}
                            </span>
                        </div>

                        {/* Reports list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {localReports.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[#4B5563] text-[12px]">All reports dismissed</p>
                                </div>
                            ) : (
                                localReports.map((report) => (
                                    <div key={report.id} className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <InitialAvatar name={report.reporterName} size={7} />
                                                <span className="text-white text-[12px] font-medium">
                                                    {report.reporterHandle || report.reporterName}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDismiss(report.id)}
                                                disabled={dismissingId === report.id}
                                                className="text-[9px] font-semibold text-[#4B5563] hover:text-red-400 transition-colors uppercase tracking-wide flex-shrink-0"
                                            >
                                                {dismissingId === report.id ? (
                                                    <span className="w-2.5 h-2.5 border border-current rounded-full animate-spin inline-block" />
                                                ) : "Dismiss Report"}
                                            </button>
                                        </div>
                                        <p className={`text-[11px] font-semibold mb-1.5 ${getReasonColor(report.reason)}`}>
                                            Reason: {report.reason}
                                        </p>
                                        <p className="text-[#6B7280] text-[11px] leading-relaxed">
                                            "{report.description}"
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Bottom action buttons */}
                        <div className="flex items-center gap-2 p-4 border-t border-[#1E2433] flex-shrink-0">
                            <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#131B2E] border border-[#1E2433] text-[#9CA3AF] hover:text-white hover:border-[#374151] text-[12px] font-medium transition-colors disabled:opacity-50"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                Shadowban
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                            >
                                {actionLoading === "reject" ? (
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                )}
                                Take Down
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
