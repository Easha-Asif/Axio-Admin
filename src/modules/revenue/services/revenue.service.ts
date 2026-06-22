import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    DocumentSnapshot,
    doc,
    getDoc,
} from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "initiated" | "completed" | "cancel" | "paid";
export type MonetizationStrategy = "free" | "pay_per_view" | "subscription";

export interface RevenueTransaction {
    id: string;
    user_id: string;
    video_id: string;
    payment_id: string;
    status: PaymentStatus;
    amount: number;
    created_at: any;
    updated_at: any;
    // hydrated
    creatorName: string;
    creatorInitials: string;
    monetization_strategy: MonetizationStrategy;
}

export interface RevenueStats {
    totalGrossRevenue: number;
    netPlatformCommission: number;
    activeMonetizingCreators: number;
    totalTransactions: number;
    subscriptionRevenue: number;
    ppvRevenue: number;
    freeRevenue: number;
}

export interface PaginatedTransactions {
    transactions: RevenueTransaction[];
    lastDoc: DocumentSnapshot | null;
    total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Platform takes 15% commission
const PLATFORM_COMMISSION_RATE = 0.15;

// ── Service ────────────────────────────────────────────────────────────────

export const revenueService = {

    async getRevenueStats(): Promise<RevenueStats> {
        try {
            const paymentsRef = collection(db, "payments");
            const subsRef = collection(db, "subscriptions");

            // All paid payments
            const paidPaymentsSnap = await getDocs(
                query(paymentsRef, where("status", "==", "paid"))
            );

            // All completed subscriptions
            const paidSubsSnap = await getDocs(
                query(subsRef, where("status", "==", "paid"))
            );

            // Count active monetizing creators (creators with at least 1 paid payment or subscription)
            const creatorIdsFromPayments = new Set<string>();
            paidPaymentsSnap.forEach((d) => {
                const data = d.data();
                if (data.creator_id) creatorIdsFromPayments.add(data.creator_id);
            });
            paidSubsSnap.forEach((d) => {
                const data = d.data();
                if (data.creator_id) creatorIdsFromPayments.add(data.creator_id);
            });

            // Tally revenue from payments
            let ppvRevenue = 0;
            let freeRevenue = 0;
            paidPaymentsSnap.forEach((d) => {
                const data = d.data();
                const amount = data.amount || 0;
                ppvRevenue += amount;
            });

            // Tally revenue from subscriptions
            let subscriptionRevenue = 0;
            paidSubsSnap.forEach((d) => {
                const data = d.data();
                subscriptionRevenue += data.amount || 0;
            });

            const totalGrossRevenue = ppvRevenue + subscriptionRevenue + freeRevenue;
            const netPlatformCommission = totalGrossRevenue * PLATFORM_COMMISSION_RATE;

            const totalTransactionsSnap = await getCountFromServer(
                query(paymentsRef)
            );

            return {
                totalGrossRevenue,
                netPlatformCommission,
                activeMonetizingCreators: creatorIdsFromPayments.size,
                totalTransactions: totalTransactionsSnap.data().count,
                subscriptionRevenue,
                ppvRevenue,
                freeRevenue,
            };
        } catch (e: any) {
            console.error("getRevenueStats error:", e);
            return {
                totalGrossRevenue: 0,
                netPlatformCommission: 0,
                activeMonetizingCreators: 0,
                totalTransactions: 0,
                subscriptionRevenue: 0,
                ppvRevenue: 0,
                freeRevenue: 0,
            };
        }
    },

    async getTransactions(
        pageSize = 10,
        lastDocument: DocumentSnapshot | null = null
    ): Promise<PaginatedTransactions> {
        try {
            const paymentsRef = collection(db, "payments");

            const countSnap = await getCountFromServer(query(paymentsRef));
            const total = countSnap.data().count;

            let q = query(
                paymentsRef,
                orderBy("created_at", "desc"),
                limit(pageSize)
            );

            if (lastDocument) {
                q = query(
                    paymentsRef,
                    orderBy("created_at", "desc"),
                    startAfter(lastDocument),
                    limit(pageSize)
                );
            }

            const snap = await getDocs(q);

            // Hydrate creator name + video strategy in parallel
            const transactions: RevenueTransaction[] = await Promise.all(
                snap.docs.map(async (d) => {
                    const data = d.data();

                    // Fetch creator name
                    let creatorName = "Unknown";
                    let monetization_strategy: MonetizationStrategy = "free";

                    try {
                        if (data.user_id) {
                            const userSnap = await getDoc(doc(db, "user", data.user_id));
                            if (userSnap.exists()) {
                                creatorName = userSnap.data().name || userSnap.data().email || "Unknown";
                            }
                        }
                    } catch (_) {}

                    try {
                        if (data.video_id) {
                            const videoSnap = await getDoc(doc(db, "video", data.video_id));
                            if (videoSnap.exists()) {
                                monetization_strategy = videoSnap.data().monitization_strategy || "free";
                            }
                        }
                    } catch (_) {}

                    return {
                        id: d.id,
                        user_id: data.user_id || "",
                        video_id: data.video_id || "",
                        payment_id: data.payment_id || d.id,
                        status: data.status || "initiated",
                        amount: data.amount || 0,
                        created_at: data.created_at,
                        updated_at: data.updated_at,
                        creatorName,
                        creatorInitials: getInitials(creatorName),
                        monetization_strategy,
                    };
                })
            );

            return {
                transactions,
                lastDoc: snap.docs[snap.docs.length - 1] ?? null,
                total,
            };
        } catch (e: any) {
            console.error("getTransactions error:", e);
            return { transactions: [], lastDoc: null, total: 0 };
        }
    },
};
