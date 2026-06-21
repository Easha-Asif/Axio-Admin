import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
} from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────

export type PayoutFrequency = "bi-weekly" | "monthly";

export interface GlobalSettings {
    min_payout_val: number;
    platform_fee_percentage: number;
    default_payout_frequency: PayoutFrequency;
    enable_instant_payouts: boolean;
}

export interface LegalDocument {
    content: string; // HTML string
    updated_at: any;
    updated_by?: string;
    version?: string;
    status: "draft" | "published";
}

export interface LegalDocuments {
    terms_of_service: LegalDocument;
    privacy_policy: LegalDocument;
    creator_agreement: LegalDocument;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    field: string;
    old_value: string;
    new_value: string;
    changed_at: any;
    changed_by?: string;
}

const SETTINGS_DOC = "global_settings";
const SETTINGS_COLLECTION = "settings";
const LEGAL_COLLECTION = "legal_documents";
const AUDIT_COLLECTION = "settings_audit_log";

// ── Service ────────────────────────────────────────────────────────────────

export const settingsService = {
    async getGlobalSettings(): Promise<GlobalSettings> {
        try {
            const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                return snap.data() as GlobalSettings;
            }
            // Return defaults if not set yet
            return {
                min_payout_val: 100,
                platform_fee_percentage: 15.0,
                default_payout_frequency: "bi-weekly",
                enable_instant_payouts: false,
            };
        } catch (e) {
            console.error("getGlobalSettings error:", e);
            return {
                min_payout_val: 100,
                platform_fee_percentage: 15.0,
                default_payout_frequency: "bi-weekly",
                enable_instant_payouts: false,
            };
        }
    },

    async saveGlobalSettings(
        settings: GlobalSettings,
        oldSettings: GlobalSettings
    ): Promise<void> {
        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        await setDoc(ref, settings, { merge: true });

        // Write audit log entries for changed fields
        const fields: (keyof GlobalSettings)[] = [
            "min_payout_val",
            "platform_fee_percentage",
            "default_payout_frequency",
            "enable_instant_payouts",
        ];

        for (const field of fields) {
            if (settings[field] !== oldSettings[field]) {
                await addDoc(collection(db, AUDIT_COLLECTION), {
                    action: "updated",
                    field,
                    old_value: String(oldSettings[field]),
                    new_value: String(settings[field]),
                    changed_at: serverTimestamp(),
                });
            }
        }
    },

    async getLegalDocument(type: keyof LegalDocuments): Promise<LegalDocument> {
        try {
            const ref = doc(db, LEGAL_COLLECTION, type);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                return snap.data() as LegalDocument;
            }
            return {
                content: getDefaultContent(type),
                updated_at: null,
                status: "draft",
                version: "1.0",
            };
        } catch (e) {
            console.error(`getLegalDocument(${type}) error:`, e);
            return {
                content: getDefaultContent(type),
                updated_at: null,
                status: "draft",
                version: "1.0",
            };
        }
    },

    async saveLegalDocument(
        type: keyof LegalDocuments,
        content: string,
        status: "draft" | "published"
    ): Promise<void> {
        const ref = doc(db, LEGAL_COLLECTION, type);
        const existing = await getDoc(ref);
        const currentVersion = existing.exists()
            ? existing.data().version || "1.0"
            : "1.0";

        // Bump version on publish
        let newVersion = currentVersion;
        if (status === "published") {
            const [major, minor] = currentVersion.split(".").map(Number);
            newVersion = `${major}.${minor + 1}`;
        }

        await setDoc(ref, {
            content,
            updated_at: serverTimestamp(),
            status,
            version: newVersion,
        });

        // Audit
        await addDoc(collection(db, AUDIT_COLLECTION), {
            action: status === "published" ? "published" : "saved as draft",
            field: type,
            old_value: currentVersion,
            new_value: newVersion,
            changed_at: serverTimestamp(),
        });
    },

    async getRecentAuditLog(count = 5): Promise<AuditLogEntry[]> {
        try {
            const q = query(
                collection(db, AUDIT_COLLECTION),
                orderBy("changed_at", "desc"),
                limit(count)
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
        } catch (e) {
            console.error("getRecentAuditLog error:", e);
            return [];
        }
    },
};

function getDefaultContent(type: keyof LegalDocuments): string {
    const titles: Record<keyof LegalDocuments, string> = {
        terms_of_service: "Terms of Service",
        privacy_policy: "Privacy Policy",
        creator_agreement: "Creator Agreement",
    };
    return `<h2>${titles[type]}</h2>\n<p>Start writing your ${titles[type].toLowerCase()} here. Use the editor above to format and update this content. Changes are saved as drafts until you publish them.</p>`;
}
