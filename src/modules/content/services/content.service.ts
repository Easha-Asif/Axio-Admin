import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    DocumentSnapshot,
    Timestamp,
} from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReportStatus = "in-review" | "approved" | "rejected";
export type ModerationPriority = "critical" | "elevated" | "low-priority";

export interface Report {
    id: string;
    reporter_id: string;
    video_id: string;
    created_at: any;
    report_status: ReportStatus;
    reason: string;
    description: string;
    // hydrated
    reporterName: string;
    reporterHandle: string;
}

export interface ModerationVideo {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    creatorId: string;
    creatorName: string;
    creatorHandle: string;
    creatorAvatar: string | null;
    category: string;
    monetization: string;
    uploadedAt: any;
    views: number;
    reportCount: number;
    priority: ModerationPriority;
    latestReason: string;
    reports: Report[];
}

export interface ModerationStats {
    pendingReviews: number;
    reportedVideos: number;
    avgWaitMinutes: number;
    pendingDelta: number;
    reportedDelta: number;
    avgWaitDelta: number;
}

export type TabFilter = "all" | "reported" | "high-priority";

// ── Priority Logic ─────────────────────────────────────────────────────────

export function getPriority(reportCount: number): ModerationPriority | null {
    if (reportCount === 0) return null;
    if (reportCount <= 5) return "low-priority";
    if (reportCount <= 10) return "elevated";
    return "critical";
}

// ── Service ────────────────────────────────────────────────────────────────

export const contentModerationService = {

    async getModerationStats(): Promise<ModerationStats> {
        try {
            const reportsRef = collection(db, "reports");

            const [pendingSnap, totalSnap] = await Promise.all([
                getCountFromServer(query(reportsRef, where("report_status", "==", "in-review"))),
                getCountFromServer(query(reportsRef)),
            ]);

            const pendingReviews = pendingSnap.data().count;
            const total = totalSnap.data().count;

            // Get unique video IDs with active reports
            const activeReportsSnap = await getDocs(
                query(reportsRef, where("report_status", "==", "in-review"), limit(200))
            );
            const uniqueVideos = new Set<string>();
            let totalWaitMs = 0;
            let waitCount = 0;

            activeReportsSnap.forEach((d) => {
                const data = d.data();
                uniqueVideos.add(data.video_id);
                if (data.created_at?.toDate) {
                    totalWaitMs += Date.now() - data.created_at.toDate().getTime();
                    waitCount++;
                }
            });

            const avgWaitMinutes = waitCount > 0 ? Math.round(totalWaitMs / waitCount / 60000) : 0;

            return {
                pendingReviews,
                reportedVideos: uniqueVideos.size,
                avgWaitMinutes,
                pendingDelta: 12,
                reportedDelta: 4,
                avgWaitDelta: -5,
            };
        } catch (e) {
            console.error("getModerationStats error:", e);
            return { pendingReviews: 0, reportedVideos: 0, avgWaitMinutes: 0, pendingDelta: 0, reportedDelta: 0, avgWaitDelta: 0 };
        }
    },

    async getModerationVideos(
        tab: TabFilter = "all",
        pageSize = 10,
        lastDocument: DocumentSnapshot | null = null
    ): Promise<{ videos: ModerationVideo[]; lastDoc: DocumentSnapshot | null; total: number }> {
        try {
            const reportsRef = collection(db, "reports");

            // Get all in-review reports (we need to group by video)
            const reportsSnap = await getDocs(
                query(reportsRef, where("report_status", "==", "in-review"), orderBy("created_at", "desc"))
            );

            // Group by video_id
            const videoMap = new Map<string, { reports: any[]; latestReason: string; latestAt: any }>();

            reportsSnap.forEach((d) => {
                const data: any = { id: d.id, ...d.data() };
                const vid = data.video_id;
                if (!videoMap.has(vid)) {
                    videoMap.set(vid, { reports: [], latestReason: data.reason || "", latestAt: data.created_at });
                }
                videoMap.get(vid)!.reports.push(data);
            });

            // Filter by tab
            let entries = Array.from(videoMap.entries()).filter(([, v]) => {
                const count = v.reports.length;
                const priority = getPriority(count);
                if (!priority) return false;
                if (tab === "reported") return count > 0;
                if (tab === "high-priority") return priority === "critical";
                return true;
            });

            // Sort: critical first, then elevated, then low-priority
            const priorityOrder: Record<string, number> = { critical: 0, elevated: 1, "low-priority": 2 };
            entries.sort(([, a], [, b]) => {
                const pA = priorityOrder[getPriority(a.reports.length) ?? "low-priority"];
                const pB = priorityOrder[getPriority(b.reports.length) ?? "low-priority"];
                return pA - pB;
            });

            const total = entries.length;

            // Paginate
            const page = entries.slice(0, pageSize);

            // Hydrate video + creator data
            const videos: ModerationVideo[] = await Promise.all(
                page.map(async ([videoId, { reports, latestReason }]) => {
                    let title = "Untitled Video";
                    let thumbnail: string | null = null;
                    let duration = 0;
                    let creatorId = "";
                    let creatorName = "Unknown Creator";
                    let creatorHandle = "";
                    let creatorAvatar: string | null = null;
                    let category = "—";
                    let monetization = "free";
                    let uploadedAt: any = null;
                    let views = 0;

                    try {
                        const videoSnap = await getDoc(doc(db, "video", videoId));
                        if (videoSnap.exists()) {
                            const v = videoSnap.data();
                            title = v.title || "Untitled Video";
                            thumbnail = v.thumbnail || null;
                            duration = v.duration || 0;
                            creatorId = v.creator || "";
                            monetization = v.monitization_strategy || "free";
                            uploadedAt = v.created_at;
                            views = v.views || 0;

                            if (v.category) {
                                try {
                                    const catSnap = await getDoc(doc(db, "categories", v.category));
                                    if (catSnap.exists()) category = catSnap.data().name;
                                } catch (_) { }
                            }

                            if (creatorId) {
                                try {
                                    const userSnap = await getDoc(doc(db, "user", creatorId));
                                    if (userSnap.exists()) {
                                        const u = userSnap.data();
                                        creatorName = u.name || u.email || "Unknown";
                                        creatorHandle = u.handle || "";
                                        creatorAvatar = u.profile_url || null;
                                    }
                                } catch (_) { }
                            }
                        }
                    } catch (_) { }

                    // Hydrate reporters
                    const hydratedReports: Report[] = await Promise.all(
                        reports.map(async (r: any) => {
                            let reporterName = "Anonymous";
                            let reporterHandle = "";
                            try {
                                if (r.reporter_id) {
                                    const userSnap = await getDoc(doc(db, "user", r.reporter_id));
                                    if (userSnap.exists()) {
                                        const u = userSnap.data();
                                        reporterName = u.name || u.handle || "Anonymous";
                                        reporterHandle = u.handle || "";
                                    }
                                }
                            } catch (_) { }
                            return {
                                id: r.id,
                                reporter_id: r.reporter_id || "",
                                video_id: r.video_id || "",
                                created_at: r.created_at,
                                report_status: r.report_status || "in-review",
                                reason: r.reason || "",
                                description: r.description || "",
                                reporterName,
                                reporterHandle,
                            };
                        })
                    );

                    const reportCount = hydratedReports.length;
                    const priority = getPriority(reportCount) ?? "low-priority";

                    return {
                        id: videoId,
                        videoId,
                        title,
                        thumbnail,
                        duration,
                        creatorId,
                        creatorName,
                        creatorHandle,
                        creatorAvatar,
                        category,
                        monetization,
                        uploadedAt,
                        views,
                        reportCount,
                        priority,
                        latestReason,
                        reports: hydratedReports,
                    };
                })
            );

            return { videos, lastDoc: null, total };
        } catch (e) {
            console.error("getModerationVideos error:", e);
            return { videos: [], lastDoc: null, total: 0 };
        }
    },

    async approveVideo(videoId: string): Promise<void> {
        // Mark all in-review reports for this video as approved
        const snap = await getDocs(
            query(collection(db, "reports"), where("video_id", "==", videoId), where("report_status", "==", "in-review"))
        );
        await Promise.all(
            snap.docs.map((d) => updateDoc(d.ref, { report_status: "approved", updated_at: serverTimestamp() }))
        );
    },

    async rejectVideo(videoId: string, reason: string): Promise<void> {
        // Mark all in-review reports for this video as rejected
        const snap = await getDocs(
            query(collection(db, "reports"), where("video_id", "==", videoId), where("report_status", "==", "in-review"))
        );
        await Promise.all(
            snap.docs.map((d) =>
                updateDoc(d.ref, { report_status: "rejected", rejection_reason: reason, updated_at: serverTimestamp() })
            )
        );
        // Optionally set the video to private
        try {
            await updateDoc(doc(db, "video", videoId), { visibility: "private", updated_at: serverTimestamp() });
        } catch (_) { }
    },

    async dismissReport(reportId: string): Promise<void> {
        await updateDoc(doc(db, "reports", reportId), {
            report_status: "rejected",
            updated_at: serverTimestamp(),
        });
    },
};
