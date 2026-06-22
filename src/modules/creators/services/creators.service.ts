import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    DocumentSnapshot,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { invitationService } from "./invitation.service";

export type InvitationStatus =
    | "notInvited"
    | "pending"
    | "approved"
    | "rejected"
    | "inactive"
    | "blocked";

export type UserType = "creator" | "visitor" | "admin";

export interface Category {
    id: string;
    label: string;
    value?: string;
}

export interface Creator {
    id: string;
    email: string;
    name: string;
    handle: string;
    bio: string;
    profile_url: string;
    instagram_handle?: string;
    facebook_handle?: string;
    linkedin_handle?: string;
    created_at: any;
    updated_at: any;
    selected_subscription_plan?: string;
    type: UserType;
    invitation_status: InvitationStatus;
    categories: Category[];
}

export interface MonetizationTier {
    label: string;
    value: string;
    revShare: number;
}

export const MONETIZATION_TIERS: MonetizationTier[] = [
    {
        label: "Standard Partner (15% rev-share)",
        value: "standard_partner",
        revShare: 15,
    },
    {
        label: "Premium Creator (25% rev-share)",
        value: "premium_creator",
        revShare: 25,
    },
    {
        label: "Enterprise Content (40% rev-share)",
        value: "enterprise_content",
        revShare: 40,
    },
];

export interface PaginatedCreators {
    creators: Creator[];
    lastDoc: DocumentSnapshot | null;
    total: number;
}

// ── helpers ────────────────────────────────────────────────────────────────

async function hydrateCategories(creators: Creator[]): Promise<Creator[]> {
    try {
        const categoryIds = Array.from(
            new Set(
                creators.flatMap((creator: any) => creator.categories || [])
            )
        );

        if (categoryIds.length === 0) return creators;

        const categoryMap = new Map<string, Category>();

        await Promise.all(
            categoryIds.map(async (categoryId: any) => {
                try {
                    const categoryRef = doc(db, "categories", categoryId);
                    const categorySnap = await getDoc(categoryRef);

                    if (categorySnap.exists()) {
                        categoryMap.set(categoryId, {
                            id: categorySnap.id,
                            ...(categorySnap.data() as Omit<Category, "id">),
                        });
                    }
                } catch (e) {
                    console.log("Failed loading category:", categoryId, e);
                }
            })
        );

        return creators.map((creator: any) => ({
            ...creator,
            categories: (creator.categories || [])
                .map((categoryId: string) => categoryMap.get(categoryId))
                .filter(Boolean),
        }));
    } catch (e) {
        console.error("Category hydration error:", e);
        return creators;
    }
}

/**
 * Call the internal API route to send the invitation email via Resend.
 * This runs in the browser so it hits the Next.js API route at /api/invite/send.
 */
async function sendInvitationEmail(
    email: string,
    otp: string,
    token: string,
    personalMessage: string
): Promise<void> {
    const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, token, personalMessage }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invitation email");
    }
}

// ── service ────────────────────────────────────────────────────────────────

export const creatorsService = {
    showError(msg: string) {
        toast.error(msg);
        throw new Error(msg);
    },

    async getCreators(
        pageSize = 5,
        lastDocument: DocumentSnapshot | null = null
    ): Promise<PaginatedCreators> {
        try {
            const usersRef = collection(db, "user");

            const countQuery = query(
                usersRef,
                where("type", "==", "creator")
            );

            const countSnap = await getCountFromServer(countQuery);
            const total = countSnap.data().count;

            let q = query(
                usersRef,
                where("type", "==", "creator"),
                orderBy("created_at", "desc"),
                limit(pageSize)
            );

            if (lastDocument) {
                q = query(
                    usersRef,
                    where("type", "==", "creator"),
                    orderBy("created_at", "desc"),
                    startAfter(lastDocument),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);

            let creators: Creator[] = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Creator, "id">),
            }));

            creators = await hydrateCategories(creators);

            return {
                creators,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
                total,
            };
        } catch (e: any) {
            this.showError(e.message || "Failed to fetch creators");
            return { creators: [], lastDoc: null, total: 0 };
        }
    },

    async getCreatorById(id: string): Promise<Creator | null> {
        try {
            const docRef = doc(db, "user", id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) return null;

            const creator: Creator = {
                id: docSnap.id,
                ...(docSnap.data() as Omit<Creator, "id">),
            };

            const hydrated = await hydrateCategories([creator]);
            return hydrated[0];
        } catch (e: any) {
            this.showError(e.message || "Failed to fetch creator");
            return null;
        }
    },

    async inviteCreator(
        email: string,
        personalMessage: string = "Hi there! We'd love to have you on the platform."
    ): Promise<void> {
        const normalizedEmail = email.trim().toLowerCase();
        let newlyCreatedUserId: string | null = null;

        try {
            let userId: string;

            const usersRef = collection(db, "user");
            const existingSnap = await getDocs(
                query(usersRef, where("email", "==", normalizedEmail), limit(1))
            );

            if (!existingSnap.empty) {
                const existingStatus = existingSnap.docs[0].data().invitation_status as InvitationStatus;

                // Approved and active creators cannot be re-invited.
                if (existingStatus === "approved") {
                    throw new Error("This creator is already approved on the platform.");
                    // this.showError("This creator is already approved on the platform.");
                    // return;
                }

                // Pending creators already have an invite in flight.
                if (existingStatus === "pending") {
                    throw new Error("An invitation has already been sent to this email. Use Resend to issue a new code.");
                    // this.showError("An invitation has already been sent to this email. Use Resend to issue a new code.");
                    // return;
                }

                // All other statuses (rejected, inactive, blocked, notInvited) → re-invite allowed.
                await updateDoc(existingSnap.docs[0].ref, {
                    invitation_status: "pending",
                    updated_at: serverTimestamp(),
                });

                userId = existingSnap.docs[0].id;
            } else {
                // Brand-new creator — create the user doc.
                const newDoc = await addDoc(collection(db, "user"), {
                    email: normalizedEmail,
                    name: "",
                    handle: "",
                    bio: "",
                    profile_url: "",
                    type: "creator",
                    invitation_status: "pending",
                    categories: [],
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                });
                userId = newDoc.id;
                newlyCreatedUserId = newDoc.id; // remember for rollback
            }

            // ── 2. Upsert invitation record (OTP + token) ──────────────────
            // invitationService.upsertInvitation writes to the "invitations"
            // collection itself — do NOT addDoc again here.
            const { otp, token } = await invitationService.upsertInvitation(
                userId,
                normalizedEmail
            );

            // ── 3. Send the email ──────────────────────────────────────────
            await sendInvitationEmail(normalizedEmail, otp, token, personalMessage);

            toast.success(`Invitation sent to ${normalizedEmail}`);
        } catch (e: any) {
            // Roll back the user doc only if we created it in this call.
            // Never delete a pre-existing user doc.
            if (newlyCreatedUserId) {
                try {
                    await deleteDoc(doc(db, "user", newlyCreatedUserId));
                } catch (rollbackErr) {
                    throw new Error(`Rollback failed for user doc: ${rollbackErr}`);
                    // console.error(`Rollback failed for user doc: ${rollbackErr}`);
                    // this.showError(`Rollback failed for user doc: ${rollbackErr}`);
                    // return;
                }

                try {
                    await invitationService.removeInvitationsByUserId(newlyCreatedUserId);
                } catch (rollbackErr) {
                    throw new Error(`Rollback failed for invitation doc: ${rollbackErr}`);
                    // console.error(`Rollback failed for invitation doc: ${rollbackErr}`);
                    // this.showError(`Rollback failed for invitation doc: ${rollbackErr}`);
                    // return;
                }
            }

            // Re-throw known user-facing errors directly; wrap unknown ones.
            // this.showError(e.message || "Failed to send invitation");
            throw new Error(e.message || "Failed to send invitation");
            // return;
        }
    },

    async resendInvite(email: string): Promise<any> {
        try {
            const normalizedEmail = email.trim().toLowerCase();

            // Find the user doc
            const usersRef = collection(db, "user");
            const q = query(
                usersRef,
                where("email", "==", normalizedEmail),
                limit(1)
            );
            const snap = await getDocs(q);

            if (snap.empty) {
                this.showError("Creator not found.");
            }

            const userId = snap.docs[0].id;

            // Ensure user is still pending (or re-invite rejected)
            await updateDoc(snap.docs[0].ref, {
                invitation_status: "pending",
                updated_at: serverTimestamp(),
            });

            // Refresh OTP + token
            const { otp, token } = await invitationService.upsertInvitation(
                userId,
                normalizedEmail
            );

            // Resend email
            await sendInvitationEmail(
                normalizedEmail,
                otp,
                token,
                "We noticed you haven't accepted our invitation yet. We'd still love to have you on the platform!"
            );

            toast.success(`Invitation resent to ${normalizedEmail}`);

            return { id: userId, status: "pending" };
        } catch (e: any) {
            this.showError(e.message || "Failed to resend invitation");

            return null;
        }
    },

    async updateCreatorStatus(
        creatorId: string,
        status: InvitationStatus
    ): Promise<void> {
        try {
            const docRef = doc(db, "user", creatorId);

            await updateDoc(docRef, {
                invitation_status: status,
                updated_at: serverTimestamp(),
            });

            toast.success(`Creator status updated to ${status}`);
        } catch (e: any) {
            this.showError(e.message || "Failed to update status");
        }
    },

    async getDashboardStats(): Promise<{
        totalCreators: number;
        totalViewers: number;
        totalRevenue: number;
        pendingApprovals: number;
    }> {
        try {
            const usersRef = collection(db, "user");

            const [creatorsSnap, viewersSnap, pendingSnap] = await Promise.all([
                getCountFromServer(
                    query(usersRef, where("type", "==", "creator"))
                ),
                getCountFromServer(
                    query(usersRef, where("type", "==", "visitor"))
                ),
                getCountFromServer(
                    query(
                        usersRef,
                        where("invitation_status", "==", "pending")
                    )
                ),
            ]);

            const paymentsRef = collection(db, "payments");
            const completedPaymentsSnap = await getDocs(
                query(paymentsRef, where("status", "==", "paid"))
            );

            let totalRevenue = 0;
            completedPaymentsSnap.forEach((d) => {
                totalRevenue += d.data().amount || 0;
            });

            return {
                totalCreators: creatorsSnap.data().count,
                totalViewers: viewersSnap.data().count,
                totalRevenue,
                pendingApprovals: pendingSnap.data().count,
            };
        } catch (e: any) {
            console.error("Stats fetch error:", e);
            return {
                totalCreators: 0,
                totalViewers: 0,
                totalRevenue: 0,
                pendingApprovals: 0,
            };
        }
    },

    async getRecentCreatorSignups(count = 5): Promise<Creator[]> {
        try {
            const usersRef = collection(db, "user");
            const q = query(
                usersRef,
                where("type", "==", "creator"),
                orderBy("created_at", "desc"),
                limit(count)
            );
            const snap = await getDocs(q);
            let creators: Creator[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Creator, "id">),
            }));
            creators = await hydrateCategories(creators);
            return creators;
        } catch (e: any) {
            console.error("Recent signups error:", e);
            return [];
        }
    },

    async getRecentInvitations(count = 5): Promise<Creator[]> {
        try {
            const usersRef = collection(db, "user");
            const q = query(
                usersRef,
                where("type", "==", "creator"),
                where("invitation_status", "in", [
                    "pending",
                    "approved",
                    "rejected",
                ]),
                orderBy("updated_at", "desc"),
                limit(count)
            );
            const snap = await getDocs(q);
            let creators: Creator[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Creator, "id">),
            }));
            creators = await hydrateCategories(creators);
            return creators;
        } catch (e: any) {
            console.error("Recent invitations error:", e);
            return [];
        }
    },
};