import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  await clearAdminSession();

  return NextResponse.redirect(new URL("/admin-login", request.url), {
    status: 303,
  });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/admin", request.url), {
    status: 303,
  });
}