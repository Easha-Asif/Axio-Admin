import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { token } = await req.json();
    // console.log("FROM API/SESISON token = ", token);

    const res = NextResponse.json({ success: true });

    res.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res;
}