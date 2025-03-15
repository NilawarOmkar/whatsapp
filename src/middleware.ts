import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const isAuthenticated = req.cookies.get("isAuthenticated")?.value === "true";
    const publicPaths = ["/", "/register"];

    if (publicPaths.includes(req.nextUrl.pathname)) {
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
