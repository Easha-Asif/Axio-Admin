"use client";

import AdminLayout from "@/components/admin/AdminLayout";


export default function SubscriptionPage() {
    return (
        <AdminLayout title="Content">
            <div className="min-h-full flex items-center justify-center bg-[#0e0e0e]">
                <div className="text-center">
                    <h1 className="text-[28px] font-bold text-white">
                        Subscription
                    </h1>
                    <p className="text-[12px] text-gray-500 mt-2">
                        No data available yet
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
