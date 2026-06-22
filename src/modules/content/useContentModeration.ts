"use client";

import { useState, useEffect, useCallback } from "react";
import {
    contentModerationService,
    ModerationVideo,
    ModerationStats,
    TabFilter,
} from "./services/content.service";

const PAGE_SIZE = 10;

export function useContentModeration() {
    const [stats, setStats] = useState<ModerationStats>({
        pendingReviews: 0,
        reportedVideos: 0,
        avgWaitMinutes: 0,
        pendingDelta: 0,
        reportedDelta: 0,
        avgWaitDelta: 0,
    });
    const [videos, setVideos] = useState<ModerationVideo[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        const s = await contentModerationService.getModerationStats();
        setStats(s);
        setStatsLoading(false);
    }, []);

    const loadVideos = useCallback(async (tab: TabFilter) => {
        setLoading(true);
        setError(null);
        try {
            const result = await contentModerationService.getModerationVideos(tab, PAGE_SIZE, null);
            setVideos(result.videos);
            setTotal(result.total);
        } catch (e: any) {
            setError(e.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
        loadVideos(activeTab);
    }, []);

    const switchTab = useCallback((tab: TabFilter) => {
        setActiveTab(tab);
        loadVideos(tab);
    }, [loadVideos]);

    const approveVideo = useCallback(async (videoId: string): Promise<boolean> => {
        try {
            await contentModerationService.approveVideo(videoId);
            setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
            setTotal((t) => t - 1);
            await loadStats();
            return true;
        } catch {
            return false;
        }
    }, [loadStats]);

    const rejectVideo = useCallback(async (videoId: string, reason: string): Promise<boolean> => {
        try {
            await contentModerationService.rejectVideo(videoId, reason);
            setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
            setTotal((t) => t - 1);
            await loadStats();
            return true;
        } catch {
            return false;
        }
    }, [loadStats]);

    const dismissReport = useCallback(async (reportId: string, videoId: string): Promise<boolean> => {
        try {
            await contentModerationService.dismissReport(reportId);
            setVideos((prev) =>
                prev.map((v) => {
                    if (v.videoId !== videoId) return v;
                    const updated = v.reports.filter((r) => r.id !== reportId);
                    if (updated.length === 0) return null as any;
                    return { ...v, reports: updated, reportCount: updated.length };
                }).filter(Boolean)
            );
            return true;
        } catch {
            return false;
        }
    }, []);

    const filteredVideos = videos.filter((v) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            v.title.toLowerCase().includes(q) ||
            v.creatorName.toLowerCase().includes(q) ||
            v.creatorHandle.toLowerCase().includes(q)
        );
    });

    const tabCounts = {
        all: total,
        reported: videos.filter((v) => v.reportCount > 0).length,
        "high-priority": videos.filter((v) => v.priority === "critical").length,
    };

    return {
        stats,
        statsLoading,
        videos: filteredVideos,
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
        reload: () => {
            loadStats();
            loadVideos(activeTab);
        },
        tabCounts,
    };
}
