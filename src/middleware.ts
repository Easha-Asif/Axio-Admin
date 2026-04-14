import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const { pathname } = req.nextUrl;

    const publicRoutes = ["/login", "/signup", "/otp", "/premium-access", "/subscription-required", "/forgot-password"];

    // 1. If the user is on a public route, let them through
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // 2. If no token and not a public route, redirect to login
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

// CRITICAL: This config prevents middleware from running on static files
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};