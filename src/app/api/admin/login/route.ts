import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/admin-auth";
import { createSessionToken, hashSessionToken } from "@/lib/security";

const ADMIN_SESSION_COOKIE = "grupo_rise_admin_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function getSessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + SESSION_MAX_AGE);

  return expiresAt;
}

function shouldUseSecureCookies() {
  if (process.env.ADMIN_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.ADMIN_COOKIE_SECURE === "false") {
    return false;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = getTextValue(formData, "email");
  const password = getTextValue(formData, "password");

  if (!email || !password) {
    return redirectTo(
      request,
      `/admin-login?error=${encodeURIComponent(
        "Ingresa correo y contraseña."
      )}`
    );
  }

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    return redirectTo(
      request,
      `/admin-login?error=${encodeURIComponent(
        "Correo o contraseña incorrectos."
      )}`
    );
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt();

  await prisma.adminSession.create({
    data: {
      adminUserId: admin.id,
      tokenHash,
      expiresAt,
    },
  });

  const response = redirectTo(request, "/admin");

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}