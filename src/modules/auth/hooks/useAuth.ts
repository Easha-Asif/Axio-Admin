import { useState } from "react";
import { authService } from "../services/auth.service";
import { useRouter } from "next/navigation";

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    /**
     * Standard Email/Password Login
     * Replicates the logic from OnboardingProvider.login
     */
    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            // Validations (Mirroring FieldValidators)
            if (!email || !password) {
                throw new Error("Email and password are required.");
            }

            const userData = await authService.login({ email, password });

            console.log(userData);

            // If we reach here, validation passed and session is created
            // Note: Service already handles blocking viewers and pending creators
            router.push("/dashboard");
            router.refresh();
            return true;
        } catch (err: any) {
            // Map Firebase errors to human-readable strings like _setError
            const message = err.code === 'auth/invalid-credential'
                ? "Invalid email or password."
                : err.message;

            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };
    /**
     * Logout
     * Replicates OnboardingProvider.logout
     */
    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            router.push("/login");
            router.refresh();
        } catch (err: any) {
            console.error("Logout failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (email: string) => {
        setError(null);
        setLoading(true);
        try {
            const success = await authService.forgotPassword(email);
            if (success === "success") {
                router.push("/login");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        login,
        logout,
        handleForgotPassword,
        loading,
        error,
    };
};