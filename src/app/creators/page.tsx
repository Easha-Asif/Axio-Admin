

"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Pagination from "@/components/admin/Pagination";
import { useCreators } from "@/modules/creators/hooks/useCreators";
import { useRouter } from "next/navigation";
import CreatorRow from "@/components/creator/creatorrow";

const PAGE_SIZE = 15;

export default function CreatorsPage() {
    const {
        creators,
        loading,
        error,
        total,
        currentPage,
        totalPages,
        hasPrev,
        hasNext,
        loadFirstPage,
        nextPage,
        prevPage,
    } = useCreators(PAGE_SIZE);

    const router = useRouter();

    // 👇 Local state for optimistic UI updates
    const [localCreators, setLocalCreators] = useState(creators);

    // Sync hook data -> local state
    useEffect(() => {
        setLocalCreators(creators);
    }, [creators]);

    useEffect(() => {
        loadFirstPage();
    }, []);

    const gotoInviteScreen = () => {
        router.push("/creators/invite");
    };

    // 👇 This is the ONLY addition: update row state from child
    const handleStatusUpdated = (creatorId: string, status: any) => {
        setLocalCreators((prev) =>
            prev.map((c) =>
                c.id === creatorId
                    ? { ...c, invitation_status: status }
                    : c
            )
        );
    };

    return (
        <AdminLayout title="Creator">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white text-[22px] font-bold">
                        Creators Lists
                    </h2>
                    <p className="text-[#6B7280] text-[13px] mt-0.5">
                        Manage and monitor{" "}
                        <span className="text-white font-medium">
                            {total.toLocaleString()}
                        </span>{" "}
                        platform creators and their monetization status.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={gotoInviteScreen}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium rounded-xl transition-colors"
                    >
                        Invite Creator
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#131B2E] border border-[#1E2433] text-[#9CA3AF] hover:text-white text-[13px] font-medium rounded-xl transition-all">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px] flex items-center gap-2">
                    {error}
                    <button
                        onClick={loadFirstPage}
                        className="ml-auto underline text-[11px]"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1E2433]">
                                {[
                                    "Creator",
                                    "Status",
                                    "Join Date",
                                    "Actions",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map(
                                    (_, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-[#1E2433]"
                                        >
                                            {Array.from({
                                                length: 4,
                                            }).map((__, j) => (
                                                <td
                                                    key={j}
                                                    className="px-5 py-4"
                                                >
                                                    <div className="h-4 bg-[#1E2433] rounded animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                )
                            ) : localCreators.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-12 text-center text-[#4B5563]"
                                    >
                                        No creators found
                                    </td>
                                </tr>
                            ) : (
                                localCreators.map((creator) => (
                                    <CreatorRow
                                        key={creator.id}
                                        creator={creator}
                                        onStatusUpdated={handleStatusUpdated}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && localCreators.length > 0 && (
                    <div className="px-5 py-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            total={total}
                            pageSize={PAGE_SIZE}
                            hasPrev={hasPrev}
                            hasNext={hasNext}
                            onPrev={prevPage}
                            onNext={nextPage}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}