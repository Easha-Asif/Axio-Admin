import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            email,
            otp,
            token,
            personalMessage,
        } = body;

        const inviteUrl =
            `${process.env.NEXT_PUBLIC_APP_URL}?token=${token}`;

        await resend.emails.send({
            from: "AXIO <onboarding@resend.dev>",
            to: email,
            subject: "You're invited to AXIO",
            html: `
                <div style="font-family: Arial; padding: 24px;">
                    <h2>You have been invited to AXIO</h2>

                    <p>${personalMessage}</p>

                    <p>Your OTP:</p>

                    <h1>${otp}</h1>

                    <a href="${inviteUrl}">
                        Accept Invitation
                    </a>
                </div>
            `,
        });

        return NextResponse.json({ success: true, });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}