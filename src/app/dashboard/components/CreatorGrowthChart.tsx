"use client";

import { useMemo, useState, useRef } from "react";

type Period = "7d" | "30d" | "12m" | "all";

interface Creator {
    id: string;
    created_at?: any;
    invitation_status?:
    | "notInvited"
    | "pending"
    | "approved"
    | "rejected"
    | "inactive"
    | "blocked";
}

interface Props {
    creators: Creator[];
    defaultPeriod?: Period;
}

function formatKey(date: Date, period: Period) {
    if (period === "7d" || period === "30d") {
        return date.toISOString().split("T")[0];
    }

    if (period === "12m") {
        return `${date.getFullYear()}-${date.getMonth()}`;
    }

    return `${date.getFullYear()}`;
}

function getRange(period: Period) {
    const now = new Date();

    if (period === "7d") {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            return d;
        });
    }

    if (period === "30d") {
        return Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (29 - i));
            return d;
        });
    }

    if (period === "12m") {
        return Array.from({ length: 12 }).map((_, i) => {
            const d = new Date();
            d.setMonth(now.getMonth() - (11 - i));
            return d;
        });
    }

    const startYear = 2026;
    const endYear = now.getFullYear();

    return Array.from({ length: endYear - startYear + 1 }).map(
        (_, i) => new Date(startYear + i, 0, 1)
    );
}

export default function CreatorGrowthChart({
    creators,
    defaultPeriod = "7d",
}: Props) {
    const [period, setPeriod] = useState<Period>(defaultPeriod);
    const [hover, setHover] = useState<any>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const chartData = useMemo(() => {
        const range = getRange(period);

        const map: Record<string, any> = {};

        range.forEach((d) => {
            const key = formatKey(d, period);

            map[key] = {
                label:
                    period === "7d"
                        ? d.toLocaleDateString("en-US", { weekday: "short" })
                        : period === "30d"
                            ? d.getDate().toString()
                            : period === "12m"
                                ? d.toLocaleDateString("en-US", { month: "short" })
                                : d.getFullYear().toString(),
                approved: 0,
                pending: 0,
            };
        });

        creators.forEach((c) => {
            const raw = c.created_at;
            if (!raw) return;

            const date = raw?.toDate
                ? raw.toDate()
                : raw?.seconds
                    ? new Date(raw.seconds * 1000)
                    : new Date(raw);

            const key = formatKey(date, period);
            if (!map[key]) return;

            if (c.invitation_status === "approved") map[key].approved++;
            if (c.invitation_status === "pending") map[key].pending++;
        });

        return Object.values(map);
    }, [creators, period]);

    const graph = useMemo(() => {
        const w = 900;
        const h = 320;
        const p = 55;

        const max = Math.max(
            ...chartData.flatMap((d) => [d.approved, d.pending]),
            1
        );

        const stepX =
            (w - p * 2) / Math.max(chartData.length - 1, 1);

        const scaleY = (v: number) =>
            h - p - (v / max) * (h - p * 2);

        const approved = chartData.map((d, i) => ({
            x: p + i * stepX,
            y: scaleY(d.approved),
            value: d.approved,
            label: d.label,
        }));

        const pending = chartData.map((d, i) => ({
            x: p + i * stepX,
            y: scaleY(d.pending),
            value: d.pending,
            label: d.label,
        }));

        return {
            w,
            h,
            p,
            approved,
            pending,
        };
    }, [chartData]);

    const linePath = (pts: any[]) =>
        pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    const handleMove = (e: React.MouseEvent) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const idx = Math.round(
            ((x - graph.p) / (graph.w - graph.p * 2)) *
            (chartData.length - 1)
        );

        if (idx >= 0 && idx < chartData.length) {
            setHover({
                idx,
                x,
                ...chartData[idx],
            });
        }
    };

    return (
        <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
            {/* HEADER */}
            <div className="flex justify-between mb-4">
                <div>
                    <h3 className="text-white font-semibold">
                        Creator Growth
                    </h3>
                    <p className="text-xs text-gray-500">
                        Approved vs Pending
                    </p>
                </div>

                <div className="flex gap-2">
                    {["7d", "30d", "12m", "all"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p as Period)}
                            className={`px-3 py-1 text-xs rounded ${period === p
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400"
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* SVG CHART */}
            <svg
                ref={svgRef}
                viewBox={`0 0 ${graph.w} ${graph.h}`}
                className="w-full h-[340px]"
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
            >
                {/* GRID + Y AXIS */}
                {[0, 25, 50, 75, 100].map((v) => {
                    const y =
                        graph.h -
                        graph.p -
                        ((graph.h - graph.p * 2) * v) / 100;

                    return (
                        <g key={v}>
                            <line
                                x1={graph.p}
                                x2={graph.w - graph.p}
                                y1={y}
                                y2={y}
                                stroke="#1E2433"
                                strokeDasharray="4 4"
                            />

                            <text
                                x={graph.p - 10}
                                y={y + 4}
                                fontSize="10"
                                textAnchor="end"
                                fill="#6B7280"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* AXIS LINES */}
                <line
                    x1={graph.p}
                    y1={graph.p}
                    x2={graph.p}
                    y2={graph.h - graph.p}
                    stroke="#334155"
                />

                <line
                    x1={graph.p}
                    y1={graph.h - graph.p}
                    x2={graph.w - graph.p}
                    y2={graph.h - graph.p}
                    stroke="#334155"
                />

                {/* GHOST LINES */}
                <path
                    d={linePath(graph.approved)}
                    stroke="#3B82F6"
                    strokeOpacity="0.15"
                    fill="none"
                />
                <path
                    d={linePath(graph.pending)}
                    stroke="#F59E0B"
                    strokeOpacity="0.15"
                    fill="none"
                />

                {/* MAIN LINES */}
                <path
                    d={linePath(graph.approved)}
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    fill="none"
                />
                <path
                    d={linePath(graph.pending)}
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    fill="none"
                />

                {/* POINTS */}
                {graph.approved.map((p, i) => (
                    <circle
                        key={`a-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hover?.idx === i ? 6 : 3}
                        fill="#3B82F6"
                    />
                ))}

                {graph.pending.map((p, i) => (
                    <circle
                        key={`p-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hover?.idx === i ? 6 : 3}
                        fill="#F59E0B"
                    />
                ))}

                {/* HOVER LINE */}
                {hover && (
                    <line
                        x1={hover.x}
                        x2={hover.x}
                        y1={graph.p}
                        y2={graph.h - graph.p}
                        stroke="#64748b"
                        strokeDasharray="4 4"
                    />
                )}

                {/* X AXIS LABELS */}
                {chartData.map((d, i) => {
                    const x =
                        graph.p +
                        (i *
                            (graph.w - graph.p * 2)) /
                        Math.max(chartData.length - 1, 1);

                    const show =
                        period === "7d"
                            ? true
                            : period === "30d"
                                ? i % 3 === 0
                                : period === "12m"
                                    ? i % 2 === 0
                                    : i % 1 === 0;

                    if (!show) return null;

                    return (
                        <text
                            key={i}
                            x={x}
                            y={graph.h - graph.p + 20}
                            fontSize="10"
                            textAnchor="middle"
                            fill="#6B7280"
                        >
                            {d.label}
                        </text>
                    );
                })}
            </svg>

            {/* TOOLTIP */}
            {hover && (
                <div className="text-xs text-gray-300 mt-2">
                    <span className="text-white font-medium">
                        {hover.label}
                    </span>{" "}
                    | Approved: {hover.approved} | Pending:{" "}
                    {hover.pending}
                </div>
            )}
        </div>
    );
}

// "use client";

// import { useMemo, useState, useRef } from "react";

// type Period = "7d" | "30d" | "12m" | "all";

// interface Creator {
//     id: string;
//     created_at?: any;
//     invitation_status?:
//     | "notInvited"
//     | "pending"
//     | "approved"
//     | "rejected"
//     | "inactive"
//     | "blocked";
// }

// interface Props {
//     creators: Creator[];
//     defaultPeriod?: Period;
// }

// function formatKey(date: Date, period: Period) {
//     if (period === "7d" || period === "30d") {
//         return date.toISOString().split("T")[0];
//     }
//     if (period === "12m") {
//         return `${date.getFullYear()}-${date.getMonth()}`;
//     }
//     return `${date.getFullYear()}`;
// }

// function getRange(period: Period) {
//     const now = new Date();

//     if (period === "7d") {
//         return Array.from({ length: 7 }).map((_, i) => {
//             const d = new Date();
//             d.setDate(now.getDate() - (6 - i));
//             return d;
//         });
//     }

//     if (period === "30d") {
//         return Array.from({ length: 30 }).map((_, i) => {
//             const d = new Date();
//             d.setDate(now.getDate() - (29 - i));
//             return d;
//         });
//     }

//     if (period === "12m") {
//         return Array.from({ length: 12 }).map((_, i) => {
//             const d = new Date();
//             d.setMonth(now.getMonth() - (11 - i));
//             return d;
//         });
//     }

//     const start = 2026;
//     const end = now.getFullYear();

//     return Array.from({ length: end - start + 1 }).map(
//         (_, i) => new Date(start + i, 0, 1)
//     );
// }

// export default function CreatorGrowthChart({
//     creators,
//     defaultPeriod = "7d",
// }: Props) {
//     const [period, setPeriod] = useState<Period>(defaultPeriod);
//     const [hover, setHover] = useState<any>(null);
//     const svgRef = useRef<SVGSVGElement | null>(null);

//     const chartData = useMemo(() => {
//         const range = getRange(period);

//         const map: Record<string, any> = {};

//         range.forEach((d) => {
//             const key = formatKey(d, period);
//             map[key] = {
//                 label:
//                     period === "7d"
//                         ? d.toLocaleDateString("en-US", { weekday: "short" })
//                         : period === "30d"
//                             ? d.getDate().toString()
//                             : period === "12m"
//                                 ? d.toLocaleDateString("en-US", { month: "short" })
//                                 : d.getFullYear().toString(),
//                 approved: 0,
//                 pending: 0,
//             };
//         });

//         creators.forEach((c) => {
//             const raw = c.created_at;
//             if (!raw) return;

//             const date = raw?.toDate
//                 ? raw.toDate()
//                 : raw?.seconds
//                     ? new Date(raw.seconds * 1000)
//                     : new Date(raw);

//             const key = formatKey(date, period);
//             if (!map[key]) return;

//             if (c.invitation_status === "approved") map[key].approved++;
//             if (c.invitation_status === "pending") map[key].pending++;
//         });

//         return Object.values(map);
//     }, [creators, period]);

//     const graph = useMemo(() => {
//         const w = 900;
//         const h = 300;
//         const p = 50;

//         const maxA = Math.max(...chartData.map(d => d.approved), 1);
//         const maxP = Math.max(...chartData.map(d => d.pending), 1);

//         const stepX = (w - p * 2) / Math.max(chartData.length - 1, 1);

//         const scale = (val: number, max: number) =>
//             h - p - (val / max) * (h - p * 2);

//         const approved = chartData.map((d, i) => ({
//             x: p + i * stepX,
//             y: scale(d.approved, maxA),
//             value: d.approved,
//             label: d.label,
//         }));

//         const pending = chartData.map((d, i) => ({
//             x: p + i * stepX,
//             y: scale(d.pending, maxP),
//             value: d.pending,
//             label: d.label,
//         }));

//         return {
//             w,
//             h,
//             p,
//             approved,
//             pending,
//         };
//     }, [chartData]);

//     const path = (pts: any[]) =>
//         pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

//     const handleMove = (e: React.MouseEvent) => {
//         if (!svgRef.current) return;

//         const rect = svgRef.current.getBoundingClientRect();
//         const x = e.clientX - rect.left;

//         const idx = Math.round(
//             ((x - graph.p) / (graph.w - graph.p * 2)) *
//             (chartData.length - 1)
//         );

//         if (idx >= 0 && idx < chartData.length) {
//             setHover({
//                 x,
//                 idx,
//                 approved: chartData[idx].approved,
//                 pending: chartData[idx].pending,
//                 label: chartData[idx].label,
//             });
//         }
//     };

//     return (
//         <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
//             {/* HEADER */}
//             <div className="flex justify-between mb-4">
//                 <div>
//                     <h3 className="text-white font-semibold">
//                         Creator Growth
//                     </h3>
//                     <p className="text-xs text-gray-500">
//                         Approved vs Pending
//                     </p>
//                 </div>

//                 <div className="flex gap-2">
//                     {["7d", "30d", "12m", "all"].map((p) => (
//                         <button
//                             key={p}
//                             onClick={() => setPeriod(p as Period)}
//                             className={`px-3 py-1 text-xs rounded ${period === p
//                                     ? "bg-blue-600 text-white"
//                                     : "text-gray-400"
//                                 }`}
//                         >
//                             {p.toUpperCase()}
//                         </button>
//                     ))}
//                 </div>
//             </div>

//             {/* SVG */}
//             <svg
//                 ref={svgRef}
//                 viewBox={`0 0 ${graph.w} ${graph.h}`}
//                 className="w-full h-[320px]"
//                 onMouseMove={handleMove}
//                 onMouseLeave={() => setHover(null)}
//             >
//                 {/* GRID */}
//                 {[0, 25, 50, 75, 100].map((v) => {
//                     const y =
//                         graph.h -
//                         graph.p -
//                         ((graph.h - graph.p * 2) * v) / 100;

//                     return (
//                         <line
//                             key={v}
//                             x1={graph.p}
//                             x2={graph.w - graph.p}
//                             y1={y}
//                             y2={y}
//                             stroke="#1E2433"
//                             strokeDasharray="4 4"
//                         />
//                     );
//                 })}

//                 {/* AXIS */}
//                 <line
//                     x1={graph.p}
//                     y1={graph.p}
//                     x2={graph.p}
//                     y2={graph.h - graph.p}
//                     stroke="#334155"
//                 />
//                 <line
//                     x1={graph.p}
//                     y1={graph.h - graph.p}
//                     x2={graph.w - graph.p}
//                     y2={graph.h - graph.p}
//                     stroke="#334155"
//                 />

//                 {/* GHOST EMPTY LINES */}
//                 <path
//                     d={path(graph.approved)}
//                     stroke="#3B82F6"
//                     strokeOpacity="0.15"
//                     strokeWidth="2"
//                     fill="none"
//                 />
//                 <path
//                     d={path(graph.pending)}
//                     stroke="#F59E0B"
//                     strokeOpacity="0.15"
//                     strokeWidth="2"
//                     fill="none"
//                 />

//                 {/* MAIN LINES */}
//                 <path
//                     d={path(graph.approved)}
//                     stroke="#3B82F6"
//                     strokeWidth="2.5"
//                     fill="none"
//                 />
//                 <path
//                     d={path(graph.pending)}
//                     stroke="#F59E0B"
//                     strokeWidth="2.5"
//                     fill="none"
//                 />

//                 {/* DOTS */}
//                 {graph.approved.map((p, i) => (
//                     <circle
//                         key={i}
//                         cx={p.x}
//                         cy={p.y}
//                         r={hover?.idx === i ? 6 : 3}
//                         fill="#3B82F6"
//                     />
//                 ))}

//                 {graph.pending.map((p, i) => (
//                     <circle
//                         key={i}
//                         cx={p.x}
//                         cy={p.y}
//                         r={hover?.idx === i ? 6 : 3}
//                         fill="#F59E0B"
//                     />
//                 ))}

//                 {/* TOOLTIP LINE */}
//                 {hover && (
//                     <line
//                         x1={hover.x}
//                         x2={hover.x}
//                         y1={graph.p}
//                         y2={graph.h - graph.p}
//                         stroke="#64748b"
//                         strokeDasharray="4 4"
//                     />
//                 )}
//             </svg>

//             {/* TOOLTIP */}
//             {hover && (
//                 <div className="text-xs text-gray-300 mt-2">
//                     <span className="text-white font-medium">
//                         {hover.label}
//                     </span>
//                     {" | "}
//                     Approved: {hover.approved} | Pending: {hover.pending}
//                 </div>
//             )}
//         </div>
//     );
// }

// // "use client";

// // import { useMemo, useState } from "react";

// // type Period = "7d" | "30d" | "12m" | "all";

// // interface Creator {
// //     id: string;
// //     created_at?: any;
// //     invitation_status?:
// //     | "notInvited"
// //     | "pending"
// //     | "approved"
// //     | "rejected"
// //     | "inactive"
// //     | "blocked";
// // }

// // interface Props {
// //     creators: Creator[];
// //     defaultPeriod?: Period;
// // }

// // export default function CreatorGrowthChart({
// //     creators,
// //     defaultPeriod = "7d",
// // }: Props) {
// //     const [period, setPeriod] = useState<Period>(defaultPeriod);

// //     const chartData = useMemo(() => {
// //         const now = new Date();

// //         const grouped: Record<
// //             string,
// //             {
// //                 approved: number;
// //                 pending: number;
// //             }
// //         > = {};

// //         creators.forEach((creator) => {
// //             const rawDate = creator.created_at;

// //             if (!rawDate) return;

// //             const createdAt = rawDate?.toDate
// //                 ? rawDate.toDate()
// //                 : rawDate?.seconds
// //                     ? new Date(rawDate.seconds * 1000)
// //                     : new Date(rawDate);

// //             let key = "";

// //             switch (period) {
// //                 case "7d": {
// //                     const diff =
// //                         (now.getTime() - createdAt.getTime()) /
// //                         (1000 * 60 * 60 * 24);

// //                     if (diff > 7) return;

// //                     key = createdAt.toLocaleDateString("en-US", {
// //                         weekday: "short",
// //                     });

// //                     break;
// //                 }

// //                 case "30d": {
// //                     const diff =
// //                         (now.getTime() - createdAt.getTime()) /
// //                         (1000 * 60 * 60 * 24);

// //                     if (diff > 30) return;

// //                     key = createdAt.toLocaleDateString("en-US", {
// //                         month: "short",
// //                         day: "numeric",
// //                     });

// //                     break;
// //                 }

// //                 case "12m": {
// //                     const diffMonths =
// //                         (now.getFullYear() - createdAt.getFullYear()) * 12 +
// //                         (now.getMonth() - createdAt.getMonth());

// //                     if (diffMonths >= 12) return;

// //                     key = createdAt.toLocaleDateString("en-US", {
// //                         month: "short",
// //                     });

// //                     break;
// //                 }

// //                 case "all": {
// //                     key = createdAt.getFullYear().toString();
// //                     break;
// //                 }
// //             }

// //             if (!grouped[key]) {
// //                 grouped[key] = {
// //                     approved: 0,
// //                     pending: 0,
// //                 };
// //             }

// //             if (creator.invitation_status === "approved") {
// //                 grouped[key].approved++;
// //             }

// //             if (creator.invitation_status === "pending") {
// //                 grouped[key].pending++;
// //             }
// //         });

// //         return Object.entries(grouped).map(([label, values]) => ({
// //             label,
// //             approved: values.approved,
// //             pending: values.pending,
// //         }));
// //     }, [creators, period]);

// //     const graph = useMemo(() => {
// //         if (!chartData.length) return null;

// //         const width = 900;
// //         const height = 280;
// //         const padding = 40;

// //         const maxValue = Math.max(
// //             ...chartData.flatMap((item) => [
// //                 item.approved,
// //                 item.pending,
// //             ]),
// //             1
// //         );

// //         const createPoints = (values: number[]) =>
// //             values.map((value, index) => {
// //                 const x =
// //                     padding +
// //                     (index * (width - padding * 2)) /
// //                     Math.max(values.length - 1, 1);

// //                 const y =
// //                     height -
// //                     padding -
// //                     (value / maxValue) *
// //                     (height - padding * 2);

// //                 return { x, y };
// //             });

// //         const approvedPoints = createPoints(
// //             chartData.map((d) => d.approved)
// //         );

// //         const pendingPoints = createPoints(
// //             chartData.map((d) => d.pending)
// //         );

// //         const createPath = (
// //             points: { x: number; y: number }[]
// //         ) =>
// //             points
// //                 .map(
// //                     (point, index) =>
// //                         `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
// //                 )
// //                 .join(" ");

// //         const approvedPath = createPath(approvedPoints);
// //         const pendingPath = createPath(pendingPoints);

// //         const approvedArea = `
// //             ${approvedPath}
// //             L ${approvedPoints[approvedPoints.length - 1].x} ${height - padding}
// //             L ${approvedPoints[0].x} ${height - padding}
// //             Z
// //         `;

// //         return {
// //             width,
// //             height,
// //             padding,
// //             approvedPoints,
// //             pendingPoints,
// //             approvedPath,
// //             pendingPath,
// //             approvedArea,
// //         };
// //     }, [chartData]);

// //     return (
// //         <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
// //             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
// //                 <div>
// //                     <h3 className="text-white text-[16px] font-semibold">
// //                         Creator Growth
// //                     </h3>

// //                     <p className="text-[#6B7280] text-[12px] mt-1">
// //                         Approved vs Pending creator registrations
// //                     </p>
// //                 </div>

// //                 <div className="flex items-center gap-5 flex-wrap">
// //                     <div className="flex items-center gap-4 text-xs">
// //                         <div className="flex items-center gap-2">
// //                             <div className="w-3 h-3 rounded-full bg-blue-500" />
// //                             <span className="text-gray-300">
// //                                 Approved
// //                             </span>
// //                         </div>

// //                         <div className="flex items-center gap-2">
// //                             <div className="w-3 h-3 rounded-full bg-amber-500" />
// //                             <span className="text-gray-300">
// //                                 Pending
// //                             </span>
// //                         </div>
// //                     </div>

// //                     <div className="flex bg-[#0F172A] border border-[#1E2433] rounded-lg overflow-hidden">
// //                         {[
// //                             { label: "7D", value: "7d" },
// //                             { label: "30D", value: "30d" },
// //                             { label: "12M", value: "12m" },
// //                             { label: "ALL", value: "all" },
// //                         ].map((item) => (
// //                             <button
// //                                 key={item.value}
// //                                 onClick={() =>
// //                                     setPeriod(item.value as Period)
// //                                 }
// //                                 className={`px-3 py-2 text-[11px] font-medium transition-all ${period === item.value
// //                                         ? "bg-blue-600 text-white"
// //                                         : "text-[#6B7280] hover:text-white"
// //                                     }`}
// //                             >
// //                                 {item.label}
// //                             </button>
// //                         ))}
// //                     </div>
// //                 </div>
// //             </div>

// //             {!graph ? (
// //                 <div className="h-[300px] flex items-center justify-center text-[#6B7280]">
// //                     No data available
// //                 </div>
// //             ) : (
// //                 <>
// //                     <svg
// //                         viewBox={`0 0 ${graph.width} ${graph.height}`}
// //                         className="w-full h-[320px]"
// //                     >
// //                         <defs>
// //                             <linearGradient
// //                                 id="approvedGradient"
// //                                 x1="0"
// //                                 y1="0"
// //                                 x2="0"
// //                                 y2="1"
// //                             >
// //                                 <stop
// //                                     offset="0%"
// //                                     stopColor="#3B82F6"
// //                                     stopOpacity="0.3"
// //                                 />
// //                                 <stop
// //                                     offset="100%"
// //                                     stopColor="#3B82F6"
// //                                     stopOpacity="0"
// //                                 />
// //                             </linearGradient>
// //                         </defs>

// //                         {[0, 25, 50, 75, 100].map((value) => {
// //                             const y =
// //                                 graph.height -
// //                                 graph.padding -
// //                                 ((graph.height -
// //                                     graph.padding * 2) *
// //                                     value) /
// //                                 100;

// //                             return (
// //                                 <line
// //                                     key={value}
// //                                     x1={graph.padding}
// //                                     x2={
// //                                         graph.width -
// //                                         graph.padding
// //                                     }
// //                                     y1={y}
// //                                     y2={y}
// //                                     stroke="#1E2433"
// //                                     strokeDasharray="4 4"
// //                                 />
// //                             );
// //                         })}

// //                         <path
// //                             d={graph.approvedArea}
// //                             fill="url(#approvedGradient)"
// //                         />

// //                         <path
// //                             d={graph.approvedPath}
// //                             fill="none"
// //                             stroke="#3B82F6"
// //                             strokeWidth="3"
// //                             strokeLinecap="round"
// //                             strokeLinejoin="round"
// //                         />

// //                         <path
// //                             d={graph.pendingPath}
// //                             fill="none"
// //                             stroke="#F59E0B"
// //                             strokeWidth="3"
// //                             strokeLinecap="round"
// //                             strokeLinejoin="round"
// //                         />

// //                         {graph.approvedPoints.map(
// //                             (point, index) => (
// //                                 <circle
// //                                     key={`approved-${index}`}
// //                                     cx={point.x}
// //                                     cy={point.y}
// //                                     r="4"
// //                                     fill="#3B82F6"
// //                                 />
// //                             )
// //                         )}

// //                         {graph.pendingPoints.map(
// //                             (point, index) => (
// //                                 <circle
// //                                     key={`pending-${index}`}
// //                                     cx={point.x}
// //                                     cy={point.y}
// //                                     r="4"
// //                                     fill="#F59E0B"
// //                                 />
// //                             )
// //                         )}
// //                     </svg>

// //                     <div className="flex justify-between mt-3 px-2 overflow-hidden">
// //                         {chartData.map((item) => (
// //                             <span
// //                                 key={item.label}
// //                                 className="text-[10px] text-[#6B7280]"
// //                             >
// //                                 {item.label}
// //                             </span>
// //                         ))}
// //                     </div>
// //                 </>
// //             )}
// //         </div>
// //     );
// // }

// // "use client";

// // import { useMemo, useState } from "react";

// // type Period = "7d" | "30d" | "12m" | "all";

// // interface Creator {
// //     [x: string]: any;
// //     id: string;
// //     createdAt?: any;
// // }

// // interface Props {
// //     creators: Creator[];
// //     defaultPeriod?: Period;
// // }

// // export default function CreatorGrowthChart({
// //     creators,
// //     defaultPeriod = "7d",
// // }: Props) {
// //     const [period, setPeriod] = useState<Period>(defaultPeriod);
// //     const chartData = useMemo(() => {
// //         const now = new Date();
// //         const grouped: Record<string, number> = {};

// //         creators.forEach((creator) => {
// //             const rawDate = creator.created_at;

// //             if (!rawDate) {
// //                 console.log("No date found for creator", creator);
// //                 return;
// //             }

// //             const createdAt =
// //                 rawDate?.toDate
// //                     ? rawDate.toDate()
// //                     : rawDate?.seconds
// //                         ? new Date(rawDate.seconds * 1000)
// //                         : new Date(rawDate);

// //             switch (period) {
// //                 case "7d": {
// //                     const diff =
// //                         (now.getTime() - createdAt.getTime()) /
// //                         (1000 * 60 * 60 * 24);

// //                     if (diff <= 7) {
// //                         const key = createdAt.toLocaleDateString("en-US", {
// //                             weekday: "short",
// //                         });

// //                         grouped[key] = (grouped[key] || 0) + 1;
// //                     }

// //                     break;
// //                 }

// //                 case "30d": {
// //                     const diff =
// //                         (now.getTime() - createdAt.getTime()) /
// //                         (1000 * 60 * 60 * 24);

// //                     if (diff <= 30) {
// //                         const key = createdAt.toLocaleDateString("en-US", {
// //                             month: "short",
// //                             day: "numeric",
// //                         });

// //                         grouped[key] = (grouped[key] || 0) + 1;
// //                     }

// //                     break;
// //                 }

// //                 case "12m": {
// //                     const diffMonths =
// //                         (now.getFullYear() - createdAt.getFullYear()) * 12 +
// //                         (now.getMonth() - createdAt.getMonth());

// //                     if (diffMonths < 12) {
// //                         const key = createdAt.toLocaleDateString("en-US", {
// //                             month: "short",
// //                         });

// //                         grouped[key] = (grouped[key] || 0) + 1;
// //                     }

// //                     break;
// //                 }

// //                 case "all": {
// //                     const key = createdAt.getFullYear().toString();

// //                     grouped[key] = (grouped[key] || 0) + 1;

// //                     break;
// //                 }
// //             }
// //         });

// //         return Object.entries(grouped).map(([label, value]) => ({
// //             label,
// //             value,
// //         }));
// //     }, [creators, period]);

// //     const graph = useMemo(() => {
// //         if (!chartData.length) return null;

// //         const width = 900;
// //         const height = 260;
// //         const padding = 35;

// //         const maxValue = Math.max(
// //             ...chartData.map((item) => item.value),
// //             1
// //         );

// //         const points = chartData.map((item, index) => {
// //             const x =
// //                 padding +
// //                 (index * (width - padding * 2)) /
// //                 Math.max(chartData.length - 1, 1);

// //             const y =
// //                 height -
// //                 padding -
// //                 (item.value / maxValue) *
// //                 (height - padding * 2);

// //             return { x, y };
// //         });

// //         const linePath = points
// //             .map((point, index) =>
// //                 `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
// //             )
// //             .join(" ");

// //         const areaPath = `
// //             ${linePath}
// //             L ${points[points.length - 1].x} ${height - padding}
// //             L ${points[0].x} ${height - padding}
// //             Z
// //         `;

// //         return {
// //             points,
// //             linePath,
// //             areaPath,
// //             width,
// //             height,
// //             padding,
// //         };
// //     }, [chartData]);

// //     return (
// //         <div className="bg-[#131B2E] border border-[#1E2433] rounded-xl p-5">
// //             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
// //                 <div>
// //                     <h3 className="text-white text-[16px] font-semibold">
// //                         Creator Growth
// //                     </h3>

// //                     <p className="text-[#6B7280] text-[12px] mt-1">
// //                         Track creator registrations over time
// //                     </p>
// //                 </div>

// //                 <div className="flex bg-[#0F172A] border border-[#1E2433] rounded-lg overflow-hidden">
// //                     {[
// //                         { label: "7D", value: "7d" },
// //                         { label: "30D", value: "30d" },
// //                         { label: "12M", value: "12m" },
// //                         { label: "ALL", value: "all" },
// //                     ].map((item) => (
// //                         <button
// //                             key={item.value}
// //                             onClick={() =>
// //                                 setPeriod(item.value as Period)
// //                             }
// //                             className={`px-3 py-2 text-[11px] font-medium transition-all
// //                             ${period === item.value
// //                                     ? "bg-blue-600 text-white"
// //                                     : "text-[#6B7280] hover:text-white"
// //                                 }`}
// //                         >
// //                             {item.label}
// //                         </button>
// //                     ))}
// //                 </div>
// //             </div>

// //             {!graph ? (
// //                 <div className="h-[300px] flex items-center justify-center text-[#6B7280]">
// //                     No data available
// //                 </div>
// //             ) : (
// //                 <>
// //                     <svg
// //                         viewBox={`0 0 ${graph.width} ${graph.height}`}
// //                         className="w-full h-[300px]"
// //                     >
// //                         <defs>
// //                             <linearGradient
// //                                 id="creatorGrowthGradient"
// //                                 x1="0"
// //                                 y1="0"
// //                                 x2="0"
// //                                 y2="1"
// //                             >
// //                                 <stop
// //                                     offset="0%"
// //                                     stopColor="#2563EB"
// //                                     stopOpacity="0.35"
// //                                 />
// //                                 <stop
// //                                     offset="100%"
// //                                     stopColor="#2563EB"
// //                                     stopOpacity="0"
// //                                 />
// //                             </linearGradient>
// //                         </defs>

// //                         {[0, 25, 50, 75, 100].map((value) => {
// //                             const y =
// //                                 graph.height -
// //                                 graph.padding -
// //                                 ((graph.height -
// //                                     graph.padding * 2) *
// //                                     value) /
// //                                 100;

// //                             return (
// //                                 <line
// //                                     key={value}
// //                                     x1={graph.padding}
// //                                     x2={
// //                                         graph.width -
// //                                         graph.padding
// //                                     }
// //                                     y1={y}
// //                                     y2={y}
// //                                     stroke="#1E2433"
// //                                     strokeDasharray="4 4"
// //                                 />
// //                             );
// //                         })}

// //                         <path
// //                             d={graph.areaPath}
// //                             fill="url(#creatorGrowthGradient)"
// //                         />

// //                         <path
// //                             d={graph.linePath}
// //                             fill="none"
// //                             stroke="#3B82F6"
// //                             strokeWidth="3"
// //                             strokeLinecap="round"
// //                             strokeLinejoin="round"
// //                         />

// //                         {graph.points.map((point, index) => (
// //                             <circle
// //                                 key={index}
// //                                 cx={point.x}
// //                                 cy={point.y}
// //                                 r="4"
// //                                 fill="#3B82F6"
// //                             />
// //                         ))}
// //                     </svg>

// //                     <div className="flex justify-between mt-3 px-2 overflow-hidden">
// //                         {chartData.map((item) => (
// //                             <span
// //                                 key={item.label}
// //                                 className="text-[10px] text-[#6B7280]"
// //                             >
// //                                 {item.label}
// //                             </span>
// //                         ))}
// //                     </div>
// //                 </>
// //             )}
// //         </div>
// //     );
// // }