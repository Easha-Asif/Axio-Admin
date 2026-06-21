"use client";

import { useState, useEffect, useCallback } from "react";
import {
    settingsService,
    GlobalSettings,
    LegalDocument,
    LegalDocuments,
    AuditLogEntry,
} from "./services/settings.service";

export function useSettings() {
    const [settings, setSettings] = useState<GlobalSettings>({
        min_payout_val: 100,
        platform_fee_percentage: 15.0,
        default_payout_frequency: "bi-weekly",
        enable_instant_payouts: false,
    });
    const [originalSettings, setOriginalSettings] = useState<GlobalSettings>(settings);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    const [legalDocs, setLegalDocs] = useState<Partial<LegalDocuments>>({});
    const [legalLoading, setLegalLoading] = useState<Record<string, boolean>>({});
    const [legalSaving, setLegalSaving] = useState<Record<string, boolean>>({});

    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(true);

    // Load settings on mount
    const loadSettings = useCallback(async () => {
        setSettingsLoading(true);
        setSettingsError(null);
        const data = await settingsService.getGlobalSettings();
        setSettings(data);
        setOriginalSettings(data);
        setSettingsLoading(false);
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Load audit log on mount
    const loadAuditLog = useCallback(async () => {
        setAuditLoading(true);
        const entries = await settingsService.getRecentAuditLog(8);
        setAuditLog(entries);
        setAuditLoading(false);
    }, []);

    useEffect(() => {
        loadAuditLog();
    }, [loadAuditLog]);

    const saveSettings = useCallback(async (): Promise<boolean> => {
        setSettingsSaving(true);
        setSettingsError(null);
        try {
            await settingsService.saveGlobalSettings(settings, originalSettings);
            setOriginalSettings(settings);
            await loadAuditLog();
            return true;
        } catch (e: any) {
            setSettingsError(e.message || "Failed to save settings");
            return false;
        } finally {
            setSettingsSaving(false);
        }
    }, [settings, originalSettings, loadAuditLog]);

    const updateSetting = useCallback(<K extends keyof GlobalSettings>(
        key: K,
        value: GlobalSettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Load a legal document
    const loadLegalDoc = useCallback(async (type: keyof LegalDocuments) => {
        setLegalLoading((p) => ({ ...p, [type]: true }));
        const doc = await settingsService.getLegalDocument(type);
        setLegalDocs((p) => ({ ...p, [type]: doc }));
        setLegalLoading((p) => ({ ...p, [type]: false }));
    }, []);

    // Save a legal document
    const saveLegalDoc = useCallback(async (
        type: keyof LegalDocuments,
        content: string,
        status: "draft" | "published"
    ): Promise<boolean> => {
        setLegalSaving((p) => ({ ...p, [type]: true }));
        try {
            await settingsService.saveLegalDocument(type, content, status);
            setLegalDocs((p) => ({
                ...p,
                [type]: { ...(p[type] as LegalDocument), content, status },
            }));
            await loadAuditLog();
            return true;
        } catch (e) {
            return false;
        } finally {
            setLegalSaving((p) => ({ ...p, [type]: false }));
        }
    }, [loadAuditLog]);

    const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    return {
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
        loadAuditLog,
    };
}
