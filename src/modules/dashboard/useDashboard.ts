import { useState, useEffect } from "react";
import { Creator, creatorsService } from "../creators/services/creators.service";

export interface DashboardStats {
    totalCreators: number;
    totalViewers: number;
    totalRevenue: number;
    pendingApprovals: number;
}

export const useDashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalCreators: 0,
        totalViewers: 0,
        totalRevenue: 0,
        pendingApprovals: 0,
    });
    const [recentSignups, setRecentSignups] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, signups] = await Promise.all([
                creatorsService.getDashboardStats(),
                creatorsService.getRecentCreatorSignups(5),
            ]);
            setStats(statsData);
            setRecentSignups(signups);
        } catch (e: any) {
            setError(e.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return { stats, recentSignups, loading, error, refresh: fetchDashboardData };
};
