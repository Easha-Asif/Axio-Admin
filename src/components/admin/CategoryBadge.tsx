const CATEGORY_COLORS: Record<string, string> = {
    "tech & ai": "bg-blue-500/15 text-blue-400",
    cinematography: "bg-pink-500/15 text-pink-400",
    "health & fitness": "bg-emerald-500/15 text-emerald-400",
    education: "bg-violet-500/15 text-violet-400",
    finance: "bg-amber-500/15 text-amber-400",
    lifestyle: "bg-orange-500/15 text-orange-400",
    gaming: "bg-cyan-500/15 text-cyan-400",
};

interface Category {
    id: string;
    label: string;
    value?: string;
}

interface CategoryBadgeProps {
    label: string | Category;
}

export default function CategoryBadge({ label }: CategoryBadgeProps) {
    const categoryLabel =
        typeof label === "string"
            ? label
            : label?.label || label?.value || "Unknown";

    const key = categoryLabel.toLowerCase();

    const colorClass =
        CATEGORY_COLORS[key] ?? "bg-[#1E2433] text-[#6B7280]";

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}
        >
            {categoryLabel}
        </span>
    );
}

// const CATEGORY_COLORS: Record<string, string> = {
//     "tech & ai": "bg-blue-500/15 text-blue-400",
//     "cinematography": "bg-pink-500/15 text-pink-400",
//     "health & fitness": "bg-emerald-500/15 text-emerald-400",
//     "education": "bg-violet-500/15 text-violet-400",
//     "finance": "bg-amber-500/15 text-amber-400",
//     "lifestyle": "bg-orange-500/15 text-orange-400",
//     "gaming": "bg-cyan-500/15 text-cyan-400",
// };

// interface CategoryBadgeProps {
//     label: string;
// }

// export default function CategoryBadge({ label }: CategoryBadgeProps) {
//     console.log(label);
//     const key = label.toLowerCase();
//     const colorClass = CATEGORY_COLORS[key] ?? "bg-[#1E2433] text-[#6B7280]";
//     return (
//         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
//             {label}
//         </span>
//     );
// }
