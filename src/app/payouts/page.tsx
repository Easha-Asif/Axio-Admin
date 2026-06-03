"use client";

import AdminLayout from "@/components/admin/AdminLayout";


export default function PayoutPage() {
    return (
        <AdminLayout title="Content">
            <div className="min-h-full flex items-center justify-center bg-[#0e0e0e]">
                <div className="text-center">
                    <h1 className="text-[28px] font-bold text-white">
                        Payout
                    </h1>
                    <p className="text-[12px] text-gray-500 mt-2">
                        No data available yet
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
