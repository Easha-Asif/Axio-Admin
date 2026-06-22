interface PaginationProps {
    currentPage: number;
    totalPages: number;
    total: number;
    pageSize: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onPage?: (page: number) => void;
    loading?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    total,
    pageSize,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    loading,
}: PaginationProps) {
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, total);

    const visiblePages = () => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between pt-4 border-t border-[#1E2433]">
            <p className="text-[12px] text-[#6B7280]">
                Showing <span className="text-white font-medium">{from} – {to}</span> of{" "}
                <span className="text-white font-medium">{total.toLocaleString()}</span> creators
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={onPrev}
                    disabled={!hasPrev || loading}
                    className="w-7 h-7 rounded-lg border border-[#1E2433] bg-[#131B2E] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#2E3A4E] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                {visiblePages().map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[#4B5563] text-[12px]">…</span>
                    ) : (
                        <button
                            key={p}
                            className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-all
                                ${p === currentPage
                                    ? "bg-blue-600 text-white border border-blue-500"
                                    : "border border-[#1E2433] bg-[#131B2E] text-[#6B7280] hover:text-white hover:border-[#2E3A4E]"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={onNext}
                    disabled={!hasNext || loading}
                    className="w-7 h-7 rounded-lg border border-[#1E2433] bg-[#131B2E] flex items-center justify-center text-[#6B7280] hover:text-white hover:border-[#2E3A4E] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </div>
        </div>
    );
}
