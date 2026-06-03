import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    limit,
    Timestamp,
    deleteDoc,
} from "firebase/firestore";

export interface Invitation {
    id: string;
    userRef: string;       // user doc id in "user" collection
    email: string;         // denormalised for easy lookup
    otp: string;
    token: string;
    expiry: Timestamp;
    created_at: Timestamp;
    updated_at: Timestamp;
}

// ── helpers ────────────────────────────────────────────────────────────────

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 48 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
}

function expiryTimestamp(hours = 48): Timestamp {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return Timestamp.fromDate(d);
}

// ── service ────────────────────────────────────────────────────────────────

export const invitationService = {

    /**
     * Upsert an invitation record for a user.
     * If a record already exists for this userId, refresh OTP / token / expiry.
     * Returns the fresh OTP and token (needed by the API route to send the email).
     */
    async upsertInvitation(
        userId: string,
        email: string,
    ): Promise<{ otp: string; token: string }> {
        const otp = generateOTP();
        const token = generateToken();
        const expiry = expiryTimestamp(48);

        const invRef = collection(db, "invitations");
        const existingQ = query(invRef, where("userRef", "==", userId), limit(1));
        const existingSnap = await getDocs(existingQ);

        if (!existingSnap.empty) {
            // Update existing record
            await updateDoc(existingSnap.docs[0].ref, {
                otp,
                token,
                expiry,
                updated_at: serverTimestamp(),
            });
        } else {
            // Create new record
            await addDoc(invRef, {
                userRef: userId,
                email,
                otp,
                token,
                expiry,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });
        }

        return { otp, token };
    },

    /**
     * Verify an OTP for a given userId.
     * Returns true if the OTP matches and hasn't expired.
     */
    async verifyOTP(userId: string, otp: string): Promise<boolean> {
        const invRef = collection(db, "invitations");
        const q = query(invRef, where("userRef", "==", userId), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) return false;

        const data = snap.docs[0].data();
        const now = new Date();
        const expiry: Date = data.expiry?.toDate?.() ?? new Date(0);

        return data.otp === otp && expiry > now;
    },

    /**
     * Verify a token (used by creator-invitation page link).
     * Returns the userId if valid, null otherwise.
     */
    async verifyToken(token: string): Promise<string | null> {
        const invRef = collection(db, "invitations");
        const q = query(invRef, where("token", "==", token), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) return null;

        const data = snap.docs[0].data();
        const now = new Date();
        const expiry: Date = data.expiry?.toDate?.() ?? new Date(0);

        if (expiry < now) return null;

        return data.userRef as string;
    },

    async removeInvitationsByUserId(userId: string): Promise<void> {
        try {
            const invRef = collection(db, "invitations");

            const q = query(
                invRef,
                where("userRef", "==", userId)
            );

            const snap = await getDocs(q);

            if (snap.empty) return;

            await Promise.all(
                snap.docs.map((d) => deleteDoc(d.ref))
            );
        } catch (e) {
            console.error("Failed to remove invitations:", e);
            throw e;
        }
    },
};
