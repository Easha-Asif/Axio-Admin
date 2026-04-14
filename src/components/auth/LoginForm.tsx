"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import AuthHeader from "../AuthHeader";
import AppButton from "../AppButton";
import Divider from "../Divider";


export default function LoginForm() {
    const { login, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        login(email, password);
    };

    return (
        <div className="min-w-screen min-h-screen bg-[#141433] flex flex-col items-center justify-center p-6">

            <AuthHeader />

            <div className="mb-[24px] inline-block px-4 py-[6px] rounded-full bg-white text-[10px] font-medium uppercase tracking-[1px] text-[#3C83F6]">
                Admin Access Only
            </div>

            <div className="text-center mx-[54px] mb-[33px]">
                <h1 className="text-white text-[30px] font-semibold mb-[6px]">Secure Admin Portal</h1>
                <p className="text-sm text-gray-400">
                    Enter your credentials to access the management suite.
                </p>
            </div>

            <div className="relative flex flex-col items-center justify-center mb-[40px]">


                <div className="w-full min-w-[440px] bg-[#1b1b3a] border border-[#2a2a2a] rounded-2xl py-10 shadow-2xl space-y-5 mx-auto">

                    {/* Email Field */}
                    <div className="mx-10">
                        <label className="block text-xs font-medium text-gray-400 mb-2">Email Address</label>

                        <input
                            type="email"
                            placeholder="name@company.com"
                            className="w-full bg-[#25254d] border border-[#333] rounded-lg py-3 px-4 text-white placeholder-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
                            onChange={(e) => setEmail(e.target.value)}
                        />

                    </div>

                    {/* Password Field */}
                    <div className="mx-10">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-medium text-gray-400">Password</label>
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-[#25254d] border border-[#333] rounded-lg py-3 px-4 text-white placeholder-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <div className="mx-10 mt-6">
                        <AppButton
                            onClick={handleLogin}
                            disabled={(!email || !password || loading)}
                            cursor={(email && password || loading) ? "pointer" : "not-allowed"}
                        >
                            {loading ? "Singing in..." : "Sign In to Dashboard"}
                        </AppButton>
                    </div>

                    <div className="mx-10 mt-6 flex justify-between items-center">
                        <button className="text-xs text-blue-500 hover:underline">Forgot password?</button>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="font-medium">System Status:</div>
                            <div className="text-green-500 tracking-wider">Operational</div>
                        </div>
                    </div>


                </div>

                {/* Footer Info */}


                {/* Bottom Links */}
                {/* <div className="mt-auto py-6 flex justify-center gap-6 text-[11px] text-gray-500 uppercase tracking-widest">
                    <a href="#" className="hover:text-white">Terms of Service</a>
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Security</a>
                </div> */}
            </div>

            {/* --- FOOTER START --- */}
            <footer className="absolute bottom-8 w-full flex justify-center px-10">
                <div className="flex flex-col justify-between items-center w-full text-[11px] text-gray-500 uppercase tracking-widest">
                    <Divider color="white" opacity={0.1} />
                    <div className="mt-6">
                        © 2024 CreatorPlatform Inc. Administrative Terminal v2.4.0. All access is logged and monitored.
                    </div>
                </div>
            </footer>
            {/* --- FOOTER END --- */}
        </div >
    );
}