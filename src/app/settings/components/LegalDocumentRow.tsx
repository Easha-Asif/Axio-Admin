import { LegalDocuments } from "@/modules/settings/services/settings.service";
// ── Legal Document Row ─────────────────────────────────────────────────────
const IconDoc = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);

const IconExternalLink = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);


type LegalType = keyof LegalDocuments;

export function LegalRow({
    label,
    subtitle,
    type,
    status,
    onEdit,
}: {
    label: string;
    subtitle: string;
    type: LegalType;
    status?: "draft" | "published";
    onPreview: (type: LegalType) => void;
    onEdit: (type: LegalType) => void;
}) {
    const isDraft = !status || status === "draft";

    return (
        <div className="flex items-center justify-between py-3.5 border-b border-[#1E2433] last:border-b-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D1117] border border-[#1E2433] flex items-center justify-center text-[#4B5563]">
                    <IconDoc />
                </div>
                <div>
                    <p className="text-white text-[13px] font-medium">{label}</p>
                    <p className="text-[#4B5563] text-[11px]">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={`/legal/${type.replace(/_/g, "-")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E2433] text-[#6B7280] text-[11px] hover:text-white hover:border-[#374151] transition-colors"
                >
                    <IconExternalLink />
                    Preview
                </a>
                {isDraft ? (
                    <button
                        onClick={() => onEdit(type)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
                    >
                        Edit
                    </button>
                ) : (
                    <button
                        onClick={() => onEdit(type)}
                        className="px-3 py-1.5 rounded-lg border border-[#1E2433] text-[#9CA3AF] hover:text-white text-[11px] transition-colors"
                    >
                        Edit
                    </button>
                )}
                {isDraft && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                        DRAFT
                    </span>
                )}
            </div>
        </div>
    );
}