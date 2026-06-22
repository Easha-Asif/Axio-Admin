
import { useState } from "react";
import { Creator, InvitationStatus } from "@/modules/creators/services/creators.service";
import { useRouter } from "next/navigation";

// Action menu for each row
export default function ActionMenu({
    creator,
    onUpdate,
    onResend,
}: {
    creator: Creator;
    onUpdate: (id: string, status: InvitationStatus) => void;
    onResend: (email: string) => void;
}) {
    const [open, setOpen] = useState(false);
    // "notInvited" | "pending" | "approved" | "rejected" | "inactive" | "blocked"
    const actions: { label: string; status?: InvitationStatus; danger?: boolean }[] = [];

    if (['inactive', 'blocked'].includes(creator.invitation_status)) {
        actions.push({ label: "Activate", status: "approved", });
    } else if (creator.invitation_status == "pending") {
        actions.push({ label: "Block", status: "blocked" });
    }
    if (["rejected", "pending"].includes(creator.invitation_status)) {
        actions.push({ label: "Resend Invite", status: null, danger: false });
    }

    if (["approved", "pending"].includes(creator.invitation_status)) {
        actions.push({ label: "Deactivate", status: "inactive", danger: true });
    }

    return (
        <div className="absolute">
            <button
                onClick={() => setOpen(!open)}
                className="text-[#4B5563] hover:text-white transition-colors p-1 rounded"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-7 z-20 w-36 bg-[#131B2E] border border-[#1E2433] rounded-xl shadow-2xl overflow-hidden">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => {
                                    if (action.status) {
                                        onUpdate(creator.id, action.status);
                                    } else {
                                        onResend(creator.email);
                                    }
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-[12px] font-medium transition-colors hover:bg-[#1E2433]
                                    ${action.danger ? "text-red-400 hover:text-red-300" : "text-[#9CA3AF] hover:text-white"}`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}