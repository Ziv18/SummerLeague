import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "hoops_session";

interface MiddlewarePayload {
  role?: string;
  team_id?: number | null;
}

async function verify(token: string, secret: string): Promise<MiddlewarePayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as MiddlewarePayload;
  } catch {
    return null;
  }
}

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verify(token, process.env.JWT_SECRET as string) : null;

  const isCreator = !!payload && payload.role === "creator";
  const isAdmin = !!payload && payload.role === "admin";

  if (path.startsWith("/creator")) {
    if (!isCreator) return toLogin(req);
  } else if (path.startsWith("/admin")) {
    if (!isAdmin && !isCreator) return toLogin(req);
  } else if (path.startsWith("/manager")) {
    const isManager = !!payload && payload.role === "manager" && payload.team_id != null;
    if (!isManager && !isAdmin) return toLogin(req);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/manager/:path*", "/creator/:path*"] };
