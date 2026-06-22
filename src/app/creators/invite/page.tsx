"use client";

import { useMemo, useState } from "react";
import { validateEmail } from "@/lib/validator";
import {
    Creator,
    creatorsService,
    MONETIZATION_TIERS,
} from "@/modules/creators/services/creators.service";
import AppButton from "@/components/AppButton";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "react-hot-toast";
import CreatorRow from "@/components/creator/creatorrow";


export default function InviteCreatorScreen() {
    const [email, setEmail] = useState("");
    const [tier, setTier] = useState(MONETIZATION_TIERS[0].value);

    const [message, setMessage] = useState(
        "Hi there! We'd love to have you on the platform."
    );

    const [loading, setLoading] = useState(false);
    const [loadingInvites, setLoadingInvites] = useState(true);

    const [errors, setErrors] = useState<{
        email?: string;
        tier?: string;
        message?: string;
    }>({});

    const [invitations, setInvitations] = useState<Creator[]>([]);

    const selectedTier = useMemo(
        () =>
            MONETIZATION_TIERS.find((t) => t.value === tier),
        [tier]
    );

    const validate = () => {
        const errs: {
            email?: string;
            tier?: string;
            message?: string;
        } = {};

        const trimmedEmail = email.trim();

        const emailErr = validateEmail(trimmedEmail);

        if (emailErr) {
            errs.email = emailErr;
        }

        if (!tier) {
            errs.tier = "Please select a monetization tier.";
        }

        if (message.length > 500) {
            errs.message =
                "Personal message cannot exceed 500 characters.";
        }

        setErrors(errs);

        return Object.keys(errs).length === 0;
    };

    const resetForm = () => {
        setEmail("");
        setTier(MONETIZATION_TIERS[0].value);

        setMessage(
            "Hi there! We'd love to have you on the platform."
        );

        setErrors({});
    };

    const loadRecentInvitations = async () => {
        try {
            setLoadingInvites(true);

            const data =
                await creatorsService.getRecentInvitations(5);

            setInvitations(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load invitations");
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            await creatorsService.inviteCreator(email, message);
            resetForm();
            await loadRecentInvitations();
        } catch (e: any) {
            toast.error(e?.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };


    useMemo(() => {
        loadRecentInvitations();
    }, []);

    return (
        <AdminLayout title="Invite Creator">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-white text-[22px] font-bold">
                            Invite Creator
                        </h2>

                        <p className="text-[#6B7280] text-[13px] mt-0.5">
                            Onboard new creators to the monetization
                            pipeline.
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">
                            {/* Left */}
                            <div className="bg-[#0F2557] border-r border-[#1E293B] p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                                    <svg
                                        width="40"
                                        height="40"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#3B82F6"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />

                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>

                                <h2 className="text-xl font-semibold mb-2">
                                    Send Invitation
                                </h2>

                                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-[240px]">
                                    Growth awaits your new talent
                                    partners.
                                </p>
                            </div>

                            {/* Right */}
                            <div className="p-8 lg:p-10">
                                <div className="space-y-6">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.18em] mb-3">
                                            Creator Email Address
                                        </label>

                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />

                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                            </span>

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. creative.director@example.com"
                                                className={`w-full h-[56px] bg-[#111827] border rounded-2xl pl-12 pr-4 text-white text-sm placeholder-[#475569] outline-none transition-colors
                                                ${errors.email
                                                        ? "border-red-500"
                                                        : "border-[#1E293B] focus:border-blue-500"
                                                    }`}
                                            />
                                        </div>

                                        {errors.email && (
                                            <p className="text-red-400 text-xs mt-2">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Tier */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.18em] mb-3">
                                            Monetization Tier
                                        </label>

                                        <select
                                            value={tier}
                                            onChange={(e) =>
                                                setTier(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full h-[56px] bg-[#111827] border border-[#1E293B] rounded-2xl px-4 text-white text-sm outline-none focus:border-blue-500 appearance-none"
                                        >
                                            {MONETIZATION_TIERS.map(
                                                (t) => (
                                                    <option
                                                        key={t.value}
                                                        value={t.value}
                                                    >
                                                        {t.label}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {errors.tier && (
                                            <p className="text-red-400 text-xs mt-2">
                                                {errors.tier}
                                            </p>
                                        )}

                                        {selectedTier && (
                                            <p className="text-xs text-[#64748B] mt-2">
                                                Revenue Share:{" "}
                                                <span className="text-white">
                                                    {
                                                        selectedTier.revShare
                                                    }
                                                    %
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.18em] mb-3">
                                            Personal Message
                                        </label>

                                        <textarea
                                            value={message}
                                            onChange={(e) =>
                                                setMessage(
                                                    e.target.value
                                                )
                                            }
                                            rows={5}
                                            maxLength={500}
                                            placeholder="Write a message..."
                                            className={`w-full bg-[#111827] border rounded-2xl px-4 py-4 text-white text-sm placeholder-[#475569] outline-none resize-none
                                            ${errors.message
                                                    ? "border-red-500"
                                                    : "border-[#1E293B] focus:border-blue-500"
                                                }`}
                                        />

                                        <div className="flex items-center justify-between mt-2">
                                            {errors.message ? (
                                                <p className="text-red-400 text-xs">
                                                    {errors.message}
                                                </p>
                                            ) : (
                                                <div />
                                            )}

                                            <p className="text-xs text-[#64748B]">
                                                {message.length}/500
                                            </p>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <AppButton
                                        onClick={handleSubmit}
                                        loading={loading}
                                        disabled={!email || loading}
                                        loadingText="Sending Invitation..."
                                        className="!h-[56px] !rounded-2xl !text-sm !font-semibold"
                                    >
                                        Send Invitation
                                    </AppButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invitations */}
                    <div className="mt-8 bg-[#0F172A] border border-[#1E293B] rounded-3xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
                            <h3 className="text-lg font-semibold">
                                Recent Invitations
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {["Creator", "Status", "Join Date", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#4B5563] uppercase tracking-widest">
                                        {h}
                                    </th>
                                ))}


                                <tbody>
                                    {loadingInvites ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-[#1E293B]/60">
                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-40 rounded bg-[#1E293B] animate-pulse" />
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-32 rounded bg-[#1E293B] animate-pulse" />
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="h-6 w-20 rounded-full bg-[#1E293B] animate-pulse" />
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="h-4 w-16 ml-auto rounded bg-[#1E293B] animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : invitations.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-[#64748B]"
                                            >
                                                No invitations found
                                            </td>
                                        </tr>
                                    ) : (
                                        invitations.map((creator) => (
                                            <CreatorRow key={creator.id} creator={creator} />
                                        ))

                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
