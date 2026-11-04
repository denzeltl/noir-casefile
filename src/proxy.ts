import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, n8nSecretMatches, verifySessionToken } from "@/lib/admin-session";

/** Gate the Ad Studio: admin pages redirect to login, admin APIs get 401. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }
  if (await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.next();
  }
  // n8n (Telegram "Create ad" button) may start runs with the shared secret.
  if (pathname.startsWith("/api/ads/") && (await n8nSecretMatches(request.headers.get("x-n8n-secret")))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  if (pathname !== "/admin") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/ads/:path*"],
};
