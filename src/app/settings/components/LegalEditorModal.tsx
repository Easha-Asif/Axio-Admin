"use client";

import { useState, useEffect, useRef } from "react";
import { LegalDocument, LegalDocuments } from "@/modules/settings/services/settings.service";

type LegalType = keyof LegalDocuments;

const LABELS: Record<LegalType, string> = {
    terms_of_service: "Terms of Service",
    privacy_policy: "Privacy Policy",
    creator_agreement: "Creator Agreement",
};

interface Props {
    type: LegalType;
    document: LegalDocument | null;
    loading: boolean;
    saving: boolean;
    onClose: () => void;
    onSave: (content: string, status: "draft" | "published") => Promise<void>;
}

// ── Toolbar Button ─────────────────────────────────────────────────────────

function ToolbarBtn({
    title,
    onClick,
    active,
    children,
}: {
    title: string;
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className={`w-7 h-7 rounded flex items-center justify-center text-[11px] transition-colors ${active
                ? "bg-blue-600 text-white"
                : "text-[#9CA3AF] hover:text-white hover:bg-[#1E2433]"
                }`}
        >
            {children}
        </button>
    );
}

export default function LegalEditorModal({ type, document, loading, saving, onClose, onSave }: Props) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Populate editor when document loads
    useEffect(() => {
        if (editorRef.current && document?.content !== undefined) {
            editorRef.current.innerHTML = document.content;
            setIsDirty(false);
        }
    }, [document?.content]);

    const exec = (command: string, value?: string) => {
        document && editorRef.current?.focus();
        window.document.execCommand(command, false, value);
        setIsDirty(true);
    };

    const isActive = (command: string) => {
        try { return window.document.queryCommandState(command); } catch { return false; }
    };

    const getContent = () => editorRef.current?.innerHTML ?? "";

    const handleSave = async (status: "draft" | "published") => {
        await onSave(getContent(), status);
        setIsDirty(false);
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-[#0D1117] border border-[#1E2433] rounded-2xl flex flex-col max-h-[90vh] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2433] flex-shrink-0">
                    <div>
                        <h2 className="text-white text-[15px] font-semibold">{LABELS[type]}</h2>
                        <p className="text-[#4B5563] text-[11px] mt-0.5">
                            {document?.status === "published" ? (
                                <span className="text-emerald-400">● Published · v{document.version}</span>
                            ) : (
                                <span className="text-amber-400">● Draft{document?.version ? ` · v${document.version}` : ""}</span>
                            )}
                            {document?.updated_at?.toDate && (
                                <span className="text-[#374151] ml-2">
                                    Last updated {document.updated_at.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-[#131B2E] border border-[#1E2433] flex items-center justify-center text-[#6B7280] hover:text-white transition-colors"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#1E2433] bg-[#131B2E] flex-shrink-0 flex-wrap">
                    <ToolbarBtn title="Bold" onClick={() => exec("bold")} active={isActive("bold")}>
                        <strong>B</strong>
                    </ToolbarBtn>
                    <ToolbarBtn title="Italic" onClick={() => exec("italic")} active={isActive("italic")}>
                        <em>I</em>
                    </ToolbarBtn>
                    <ToolbarBtn title="Underline" onClick={() => exec("underline")} active={isActive("underline")}>
                        <u>U</u>
                    </ToolbarBtn>
                    <div className="w-px h-4 bg-[#1E2433] mx-1" />
                    <ToolbarBtn title="Heading 1" onClick={() => exec("formatBlock", "h2")}>
                        H1
                    </ToolbarBtn>
                    <ToolbarBtn title="Heading 2" onClick={() => exec("formatBlock", "h3")}>
                        H2
                    </ToolbarBtn>
                    <ToolbarBtn title="Paragraph" onClick={() => exec("formatBlock", "p")}>
                        P
                    </ToolbarBtn>
                    <div className="w-px h-4 bg-[#1E2433] mx-1" />
                    <ToolbarBtn title="Bullet List" onClick={() => exec("insertUnorderedList")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </ToolbarBtn>
                    <ToolbarBtn title="Numbered List" onClick={() => exec("insertOrderedList")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
                    </ToolbarBtn>
                    <div className="w-px h-4 bg-[#1E2433] mx-1" />
                    <ToolbarBtn title="Align Left" onClick={() => exec("justifyLeft")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
                    </ToolbarBtn>
                    <ToolbarBtn title="Justify" onClick={() => exec("justifyFull")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></svg>
                    </ToolbarBtn>
                    <div className="w-px h-4 bg-[#1E2433] mx-1" />
                    <ToolbarBtn title="Remove Formatting" onClick={() => exec("removeFormat")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /><line x1="3" y1="21" x2="21" y2="3" /></svg>
                    </ToolbarBtn>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <span className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={() => setIsDirty(true)}
                            className="min-h-[400px] p-6 text-[#D1D5DB] text-[13px] leading-relaxed outline-none prose-dark"
                            style={{
                                lineHeight: "1.75",
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E2433] bg-[#131B2E] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <a
                            href={`/legal/${type.replace(/_/g, "-")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] text-[#6B7280] hover:text-white transition-colors"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            View Live Page
                        </a>
                        {isDirty && (
                            <span className="text-[10px] text-amber-400/70">● Unsaved changes</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[#1E2433] text-[#6B7280] text-[12px] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSave("draft")}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl border border-[#1E2433] text-white text-[12px] hover:bg-[#1E2433] transition-colors"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSave("published")}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold transition-colors"
                        >
                            {saving ? (
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            Publish
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Styles */}
            <style>{`
                [contenteditable] h2 { color: #f9fafb; font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
                [contenteditable] h3 { color: #e5e7eb; font-size: 16px; font-weight: 600; margin: 16px 0 8px; }
                [contenteditable] p  { color: #d1d5db; margin: 8px 0; }
                [contenteditable] ul, [contenteditable] ol { color: #d1d5db; padding-left: 24px; margin: 8px 0; }
                [contenteditable] li { margin: 4px 0; }
                [contenteditable] strong { color: #f9fafb; }
                [contenteditable]:focus { outline: none; }
            `}</style>
        </div>
    );
}
