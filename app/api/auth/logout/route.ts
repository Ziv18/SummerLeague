import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
