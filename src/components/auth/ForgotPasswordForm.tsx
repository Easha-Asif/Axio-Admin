"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import AuthHeader from "../AuthHeader";
import AppButton from "../AppButton";


export default function ForgotPasswordForm() {

    const router = useRouter();

    const { handleForgotPassword, loading, error } = useAuth();

    const [email, setEmail] = useState("");

    const onForgotPassword = async () => {
        // We don't pass 'e' here because AppButton is a custom component
        await handleForgotPassword(email);
    };

    return (
        <div className="min-h-screen bg-[#141433] flex flex-col items-center justify-center p-6">



            <AuthHeader />

            <div className="relative flex flex-col items-center justify-center">


                <div className="w-full max-w-md bg-[#1b1b3a] border border-[#2a2a2a] rounded-2xl pt-10 shadow-2xl">
                    <div className="text-center mx-[54px] mb-[33px]">
                        <h1 className="text-white text-[30px] font-semibold mb-[6px]">Forgot Password</h1>
                        <p className="text-sm text-gray-400">
                            Enter your email address below and we'll send you a secure link to reset your account password.
                        </p>
                    </div>



                    <div className="space-y-5">

                        {/* Email Field */}
                        <div className="mx-10">
                            <label className="block text-xs font-medium text-gray-400 mb-2">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </span>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full bg-[#25254d] border border-[#333] rounded-lg py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>



                        {/* Sign In Button */}
                        <div className="mx-10 my-6">
                            <AppButton
                                onClick={onForgotPassword} // Clean and direct
                                disabled={(!email || loading)}
                                cursor={(email) ? "pointer" : "not-allowed"}
                            >
                                {loading ? "Sending link..." : "Send reset link"}
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}