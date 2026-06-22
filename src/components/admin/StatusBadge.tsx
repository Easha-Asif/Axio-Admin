import { InvitationStatus } from "@/modules/creators/services/creators.service";

const STATUS_MAP: Record<InvitationStatus, { label: string; dotColor: string; textColor: string; bg: string }> = {
    approved: { label: "Active", dotColor: "bg-emerald-400", textColor: "text-emerald-400", bg: "bg-emerald-400/10" },
    pending: { label: "Invited", dotColor: "bg-amber-400", textColor: "text-amber-400", bg: "bg-amber-400/10" },
    rejected: { label: "Rejected", dotColor: "bg-gray-400", textColor: "text-gray-400", bg: "bg-gray-400/10" },
    notInvited: { label: "Not Invited", dotColor: "bg-[#4B5563]", textColor: "text-[#6B7280]", bg: "bg-[#1E2433]" },
    blocked: { label: 'Blocked', dotColor: "bg-red-400", textColor: "text-red-400", bg: "bg-red-400/10" },
    inactive: { label: "Inactive", dotColor: "bg-gray-400", textColor: "text-gray-400", bg: "bg-gray-400/10" },
};



interface StatusBadgeProps {
    status: InvitationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_MAP[status] ?? STATUS_MAP["not_invited"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${config.bg} ${config.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
            {config.label}
        </span>
    );
}
