"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

type LegalType = "terms-of-service" | "privacy-policy" | "creator-agreement";

const TYPE_MAP: Record<LegalType, string> = {
    "terms-of-service": "terms_of_service",
    "privacy-policy": "privacy_policy",
    "creator-agreement": "creator_agreement",
};

const TITLE_MAP: Record<LegalType, string> = {
    "terms-of-service": "Terms of Service",
    "privacy-policy": "Privacy Policy",
    "creator-agreement": "Creator Agreement",
};

export default function PublicLegalPage({ type }: { type: LegalType }) {
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState<"draft" | "published" | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [version, setVersion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const dbKey = TYPE_MAP[type];
    const title = TITLE_MAP[type];

    useEffect(() => {
        async function load() {
            try {
                const ref = doc(db, "legal_documents", dbKey);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setContent(data.content || "");
                    setStatus(data.status || "draft");
                    setVersion(data.version || null);
                    setUpdatedAt(data.updated_at?.toDate ? data.updated_at.toDate() : null);
                } else {
                    setContent(`<h2>${title}</h2><p>This document has not been published yet.</p>`);
                    setStatus("draft");
                }
            } catch {
                setContent("<p>Failed to load this document. Please try again later.</p>");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [dbKey, title]);

    return (
        <div className="min-h-screen bg-[#0D1117]">
            {/* Top Bar */}
            <header className="border-b border-[#1E2433] bg-[#0D1117]/90 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-white font-semibold text-[13px]">AXIO</span>
                        </Link>
                        <span className="text-[#374151]">/</span>
                        <span className="text-[#6B7280] text-[13px]">{title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === "draft" && (
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                DRAFT — NOT PUBLISHED
                            </span>
                        )}
                        {version && (
                            <span className="text-[11px] text-[#4B5563]">v{version}</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-5 py-12">
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-10 bg-[#131B2E] rounded-xl w-1/3 animate-pulse" />
                        <div className="h-4 bg-[#131B2E] rounded w-1/4 animate-pulse" />
                        <div className="mt-8 space-y-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-4 bg-[#131B2E] rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 pb-6 border-b border-[#1E2433]">
                            <h1 className="text-white text-[32px] font-bold">{title}</h1>
                            {updatedAt && (
                                <p className="text-[#4B5563] text-[13px] mt-2">
                                    Last updated:{" "}
                                    {updatedAt.toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        </div>

                        <div
                            className="legal-content"
                            dangerouslySetInnerHTML={{ __html: content ?? "" }}
                        />

                        <div className="mt-16 pt-6 border-t border-[#1E2433] flex items-center justify-between">
                            <p className="text-[#374151] text-[11px]">
                                © {new Date().getFullYear()} AXIO — CreatorPlatform V2
                            </p>
                            <div className="flex items-center gap-4">
                                {(["terms-of-service", "privacy-policy", "creator-agreement"] as LegalType[])
                                    .filter((t) => t !== type)
                                    .map((t) => (
                                        <Link
                                            key={t}
                                            href={`/legal/${t}`}
                                            className="text-[11px] text-[#4B5563] hover:text-white transition-colors"
                                        >
                                            {TITLE_MAP[t]}
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Typography for legal content */}
            <style>{`
                .legal-content { color: #D1D5DB; line-height: 1.8; font-size: 14px; }
                .legal-content h2 { color: #F9FAFB; font-size: 22px; font-weight: 700; margin: 32px 0 12px; }
                .legal-content h3 { color: #E5E7EB; font-size: 17px; font-weight: 600; margin: 24px 0 10px; }
                .legal-content p { margin: 12px 0; color: #9CA3AF; }
                .legal-content ul, .legal-content ol { padding-left: 28px; margin: 12px 0; color: #9CA3AF; }
                .legal-content li { margin: 6px 0; }
                .legal-content strong { color: #E5E7EB; }
                .legal-content a { color: #60A5FA; text-decoration: underline; }
            `}</style>
        </div>
    );
}
