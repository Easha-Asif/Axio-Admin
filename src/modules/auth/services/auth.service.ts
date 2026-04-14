import { auth, db } from "@/lib/firebase"; // Your firebase config file
import { validateEmail } from "@/lib/validator";
import { FirebaseError } from "firebase/app";
import {
    signInWithEmailAndPassword,
    signOut,
    getIdToken,
    GoogleAuthProvider,
    signInWithPopup,
    deleteUser,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp, deleteDoc, setDoc, query, where, limit, getDocs } from "firebase/firestore";
import { toast } from "react-hot-toast";

export const authService = {
    showError(msg: string) {
        toast.error(msg);
        throw new Error(msg);
    },

    async login(credentials: any) {
        try {
            const { email, password } = credentials;
            const userEmail = email.trim().toLowerCase();
            // 1. Firebase Auth Sign In
            const userCredential = await signInWithEmailAndPassword(
                auth,
                userEmail,
                password.trim()
            );

            const firebaseUser = userCredential.user;

            if (!firebaseUser) this.showError("Login failed");
            console.log(firebaseUser.uid);

            // 2. Validate User in Firestore (Equivalent to __validateUserForLogin)
            const userDocRef = doc(db, "user", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            console.log(userDoc);

            if (!userDoc.exists()) {
                await signOut(auth);
                this.showError("User profile not found. Contact support.");
            }

            const userData = userDoc.data();

            // 3. Role & Status Validation
            if (userData.type !== "admin") {
                this.showError("Only creator can login to this panel");
            }

            // 4. Create Session Record (Equivalent to sessionTable logic)
            await addDoc(collection(db, "sessions"), {
                uid: firebaseUser.uid,
                ip: "admin_web_client",
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
                role: userData.type,
            });

            // 5. Token Handling
            // Web handles persistence automatically, but you can force refresh here
            await getIdToken(firebaseUser, true);
            toast.success("Admin login successful");
            return userData;
        } catch (e) {
            let friendlyMessage = "An unexpected error occurred.";

            // Handle Firebase Specific Errors
            if (e instanceof FirebaseError) {
                switch (e.code) {
                    case 'auth/invalid-email':
                        friendlyMessage = "Invalid email provided";
                        break;
                    case 'auth/invalid-credential':
                        friendlyMessage = "Invalid email or password.";
                        break;
                    case 'auth/user-disabled':
                        friendlyMessage = "This account has been disabled.";
                        break;
                    case 'auth/too-many-requests':
                        friendlyMessage = "Too many failed attempts. Please try again later.";
                        break;
                    case 'auth/network-request-failed':
                        friendlyMessage = "Network error. Check your internet connection.";
                        break;
                    case 'permission-denied':
                        friendlyMessage = "Firestore Permission Denied. Check your security rules.";
                        break;
                    default:
                        friendlyMessage = e.message; // Fallback to Firebase's own message
                }
                // console.error("Login Error Code:", e.code || "N/A", e);

                // Trigger the UI feedback
                this.showError(friendlyMessage);
            }
            throw Error(friendlyMessage);

        }
    },

    async logout() {
        await signOut(auth);
    },
}