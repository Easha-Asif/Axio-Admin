import { useState, useCallback } from "react";
import { DocumentSnapshot } from "firebase/firestore";
import { revenueService, RevenueStats, RevenueTransaction } from "../services/revenue.service";

const PAGE_SIZE = 10;

export const useRevenue = () => {
    const [stats, setStats] = useState<RevenueStats>({
        totalGrossRevenue: 0,
        netPlatformCommission: 0,
        activeMonetizingCreators: 0,
        totalTransactions: 0,
        subscriptionRevenue: 0,
        ppvRevenue: 0,
        freeRevenue: 0,
    });

    const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageHistory, setPageHistory] = useState<(DocumentSnapshot | null)[]>([null]);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const data = await revenueService.getRevenueStats();
            setStats(data);
        } catch (e: any) {
            setError(e.message || "Failed to load revenue stats");
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchPage = useCallback(async (lastDoc: DocumentSnapshot | null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await revenueService.getTransactions(PAGE_SIZE, lastDoc);
            setTransactions(result.transactions);
            setTotal(result.total);
            return result.lastDoc;
        } catch (e: any) {
            setError(e.message || "Failed to load transactions");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFirstPage = useCallback(async () => {
        const lastDoc = await fetchPage(null);
        setCurrentPage(1);
        setPageHistory([null, lastDoc]);
    }, [fetchPage]);

    const nextPage = useCallback(async () => {
        const lastDoc = pageHistory[currentPage] ?? null;
        const newLastDoc = await fetchPage(lastDoc);
        setCurrentPage((p) => p + 1);
        setPageHistory((h) => {
            const updated = [...h];
            updated[currentPage + 1] = newLastDoc;
            return updated;
        });
    }, [currentPage, fetchPage, pageHistory]);

    const prevPage = useCallback(async () => {
        if (currentPage <= 1) return;
        const lastDoc = pageHistory[currentPage - 2] ?? null;
        await fetchPage(lastDoc);
        setCurrentPage((p) => p - 1);
    }, [currentPage, fetchPage, pageHistory]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return {
        stats,
        transactions,
        total,
        currentPage,
        totalPages,
        hasPrev,
        hasNext,
        loading,
        statsLoading,
        error,
        fetchStats,
        loadFirstPage,
        nextPage,
        prevPage,
        PAGE_SIZE,
    };
};
