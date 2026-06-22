"use client";

import { useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
// import { useSettings } from "@/modules/settings/useSettings";
// import LegalEditorModal from "./components/LegalEditorModal";
import toast from "react-hot-toast";
import { useSettings } from "@/modules/settings/useSettings";
import LegalEditorModal from "./components/LegalEditorModal";
import { LegalDocuments } from "@/modules/settings/services/settings.service";
import { LegalRow } from "./components/LegalDocumentRow";
import { SectionCard } from "./components/SessionCard";
import { Toggle } from "./components/Toggle";
import { AuditEntry } from "./components/AuditEntry";



type LegalType = keyof LegalDocuments;

// ── Icons ──────────────────────────────────────────────────────────────────

const IconRevenue = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const IconShield = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconServer = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
);

const IconClock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);


// ── Main Page ──────────────────────────────────────────────────────────────

const LEGAL_META: { type: LegalType; label: string; subtitle: string }[] = [
    { type: "terms_of_service", label: "Terms of Service", subtitle: "User agreement and platform usage terms" },
    { type: "privacy_policy", label: "Privacy Policy", subtitle: "Data collection and privacy practices" },
    { type: "creator_agreement", label: "Creator Agreement", subtitle: "Creator-specific terms and revenue policies" },
];

export default function SettingsPage() {
    const {
        settings,
        settingsLoading,
        settingsSaving,
        settingsError,
        isDirty,
        updateSetting,
        saveSettings,
        legalDocs,
        legalLoading,
        legalSaving,
        loadLegalDoc,
        saveLegalDoc,
        auditLog,
        auditLoading,
    } = useSettings();

    const [editingDoc, setEditingDoc] = useState<LegalType | null>(null);

    const handleOpenEditor = useCallback(async (type: LegalType) => {
        setEditingDoc(type);
        if (!legalDocs[type]) {
            await loadLegalDoc(type);
        }
    }, [legalDocs, loadLegalDoc]);

    const handleSave = async () => {
        const ok = await saveSettings();
        if (ok) toast.success("Settings saved successfully");
        else toast.error("Failed to save settings");
    };

    return (
        <AdminLayout title="Global Platform Settings">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-white text-[22px] font-bold">Global Platform Settings</h2>
                    <p className="text-[#6B7280] text-[13px] mt-0.5">
                        Configure mission-critical financial parameters, legal documentation, and global metadata.
                        Changes here affect all users across the platform.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || settingsSaving}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isDirty
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                        : "bg-[#131B2E] border border-[#1E2433] text-[#4B5563] cursor-not-allowed"
                        }`}
                >
                    {settingsSaving ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {settingsError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px]">
                    {settingsError}
                </div>
            )}

            {/* Two-column grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
                {/* Left Column */}
                <div className="space-y-5">
                    {/* ── Revenue & Payouts ── */}
                    <SectionCard
                        title="Revenue & Payouts"
                        badge="ACTIVE"
                        badgeColor="bg-emerald-500/10 text-emerald-400"
                        icon={<IconRevenue />}
                        iconColor="bg-blue-600/20 text-blue-400"
                        action={
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                                HIGH IMPACT
                            </span>
                        }
                    >
                        {settingsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-14 bg-[#1E2433] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Platform Fee */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest mb-2">
                                            Platform Fee Percentage
                                        </label>
                                        <div className="flex items-center gap-0">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={settings.platform_fee_percentage}
                                                onChange={(e) =>
                                                    updateSetting("platform_fee_percentage", parseFloat(e.target.value) || 0)
                                                }
                                                className="flex-1 bg-[#0D1117] border border-[#1E2433] border-r-0 rounded-l-xl px-4 py-3 text-white text-[14px] font-semibold outline-none focus:border-blue-600/60 transition-colors"
                                            />
                                            <span className="bg-[#0D1117] border border-[#1E2433] rounded-r-xl px-3 py-3 text-[#4B5563] text-[13px] font-medium">
                                                %
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#374151] mt-1.5">
                                            Default fee applied to all monetized content transactions.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest mb-2">
                                            Default Payout Frequency
                                        </label>
                                        <select
                                            value={settings.default_payout_frequency}
                                            onChange={(e) =>
                                                updateSetting("default_payout_frequency", e.target.value as "bi-weekly" | "monthly")
                                            }
                                            className="w-full bg-[#0D1117] border border-[#1E2433] rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-blue-600/60 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="bi-weekly">Bi-weekly (1st &amp; 15th)</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Min Payout */}
                                <div>
                                    <label className="block text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest mb-2">
                                        Minimum Payout Threshold
                                    </label>
                                    <div className="flex items-center gap-0">
                                        <span className="bg-[#0D1117] border border-[#1E2433] border-r-0 rounded-l-xl px-3 py-3 text-[#4B5563] text-[13px] font-medium">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={settings.min_payout_val}
                                            onChange={(e) =>
                                                updateSetting("min_payout_val", parseFloat(e.target.value) || 0)
                                            }
                                            className="flex-1 bg-[#0D1117] border border-[#1E2433] border-l-0 rounded-r-xl px-4 py-3 text-white text-[14px] font-semibold outline-none focus:border-blue-600/60 transition-colors"
                                        />
                                    </div>
                                    <p className="text-[11px] text-[#374151] mt-1.5">
                                        Minimum wallet balance required for payout requests.
                                    </p>
                                </div>

                                {/* Instant Payouts Toggle */}
                                <div className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl border border-[#1E2433]">
                                    <div>
                                        <p className="text-white text-[13px] font-medium">Enable Instant Payouts (Stripe)</p>
                                        <p className="text-[11px] text-[#4B5563] mt-0.5">
                                            Standard fees apply. Note: 1.5% surcharge per transaction will be deducted.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={settings.enable_instant_payouts}
                                        onChange={(v) => updateSetting("enable_instant_payouts", v)}
                                    />
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Legal & Compliance ── */}
                    <SectionCard
                        title="Legal & Compliance"
                        icon={<IconShield />}
                        iconColor="bg-purple-600/20 text-purple-400"
                        action={
                            <a
                                href="/legal/terms-of-service"
                                target="_blank"
                                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                                Manage All
                            </a>
                        }
                    >
                        <div>
                            {LEGAL_META.map(({ type, label, subtitle }) => (
                                <LegalRow
                                    key={type}
                                    label={label}
                                    subtitle={subtitle}
                                    type={type}
                                    status={legalDocs[type]?.status}
                                    onPreview={() => window.open(`/legal/${type.replace(/_/g, "-")}`, "_blank")}
                                    onEdit={handleOpenEditor}
                                />
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                    {/* ── System Meta ── */}
                    <SectionCard
                        title="System Meta"
                        icon={<IconServer />}
                        iconColor="bg-emerald-600/20 text-emerald-400"
                        action={
                            <button className="w-6 h-6 rounded-lg bg-[#0D1117] border border-[#1E2433] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                            </button>
                        }
                    >
                        <div className="space-y-3">
                            {[
                                { label: "Region", value: "Global (Multi-AZ)", dot: null },
                                { label: "Currency", value: "USD ($)", dot: null },
                                {
                                    label: "API Status", value: "Healthy", dot: (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                                    )
                                },
                                { label: "Platform Name", value: "CreatorPlatform V2", dot: null },
                            ].map(({ label, value, dot }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-[#4B5563] text-[12px]">{label}</span>
                                    <span className="text-white text-[12px] font-medium flex items-center">
                                        {dot}{value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* ── Recent Changes ── */}
                    <SectionCard
                        title="Recent Changes"
                        icon={<IconClock />}
                        iconColor="bg-amber-600/20 text-amber-400"
                        action={
                            <button className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                                View Full Audit Log →
                            </button>
                        }
                    >
                        {auditLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-[#0D1117] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : auditLog.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-[#4B5563] text-[12px]">No changes recorded yet.</p>
                                <p className="text-[#374151] text-[11px] mt-1">Changes will appear here after saving.</p>
                            </div>
                        ) : (
                            <div>
                                {auditLog.map((entry) => (
                                    <AuditEntry key={entry.id} entry={entry} />
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>

            {/* Legal Editor Modal */}
            {editingDoc && (
                <LegalEditorModal
                    type={editingDoc}
                    document={legalDocs[editingDoc] ?? null}
                    loading={legalLoading[editingDoc] ?? false}
                    saving={legalSaving[editingDoc] ?? false}
                    onClose={() => setEditingDoc(null)}
                    onSave={async (content, status) => {
                        const ok = await saveLegalDoc(editingDoc, content, status);
                        if (ok) {
                            toast.success(status === "published" ? "Document published!" : "Draft saved!");
                            if (status === "published") setEditingDoc(null);
                        } else {
                            toast.error("Failed to save document");
                        }
                    }}
                />
            )}
        </AdminLayout>
    );
}
