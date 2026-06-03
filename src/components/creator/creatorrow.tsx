"use client";

import { Creator, creatorsService, InvitationStatus } from "@/modules/creators/services/creators.service";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionMenu from "./actionbar";

function formatDate(ts: any): string {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

interface CreatorRowProps {
    creator: Creator;
    onStatusUpdated?: (
        creatorId: string,
        status: InvitationStatus
    ) => void;
}

export default function CreatorRow({
    creator,
    onStatusUpdated,
}: CreatorRowProps) {

    const resendInvite = async (email: string) => {
        const response = await creatorsService.resendInvite(email);
        if (response)  onStatusUpdated?.(response.id, response.status);
    }

    const updateStatus = async (creatorId: string, status: InvitationStatus) => {
        await creatorsService.updateCreatorStatus(creatorId, status);
        onStatusUpdated?.(creatorId, status);
    }

    return (
        <tr className="border-b border-[#1E2433] last:border-b-0 hover:bg-[#1A2235]/40 transition-colors">
            {/* Creator info */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 overflow-hidden">
                        {creator.profile_url ? (
                            <img
                                src={creator.profile_url}
                                alt={creator.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (creator.name || creator.email || "?")
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-white text-[13px] font-medium">
                                {creator.name || creator.handle || "Unnamed Creator"}
                            </p>

                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#4B5563"
                                strokeWidth="2"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>

                        <p className="text-[#4B5563] text-[11px]">
                            {creator.email}
                        </p>
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="px-5 py-4">
                <StatusBadge status={creator.invitation_status as InvitationStatus} />
            </td>

            {/* Join date */}
            <td className="px-5 py-4 text-[#9CA3AF] text-[13px]">
                {formatDate(creator.created_at)}
            </td>

            {/* Action */}
            <td className="px-5 py-4">
                <ActionMenu creator={creator} onUpdate={updateStatus} onResend={resendInvite} />
            </td>
        </tr>
    );
}