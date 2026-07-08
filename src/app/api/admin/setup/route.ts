import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashSessionToken } from "@/lib/security";
import { hashPassword } from "@/lib/security";

const ADMIN_SESSION_COOKIE = "grupo_rise_admin_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
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

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: path,
    },
  });
}

export async function POST(request: Request) {
  const alreadyHasAdmins = await prisma.adminUser.count({
    where: {
      active: true,
    },
  });

  if (alreadyHasAdmins > 0) {
    return redirectTo("/admin-login");
  }

  const formData = await request.formData();

  const name = getTextValue(formData, "name");
  const email = getTextValue(formData, "email").toLowerCase();
  const password = getTextValue(formData, "password");
  const confirmPassword = getTextValue(formData, "confirmPassword");

  if (!name || !email || !password || !confirmPassword) {
    return redirectTo(
      `/admin-setup?error=${encodeURIComponent("Todos los campos son obligatorios")}`
    );
  }

  if (!email.includes("@")) {
    return redirectTo(
      `/admin-setup?error=${encodeURIComponent("Ingrese un correo valido")}`
    );
  }

  if (password !== confirmPassword) {
    return redirectTo(
      `/admin-setup?error=${encodeURIComponent("Las contraseñas no coinciden")}`
    );
  }

  if (!isStrongPassword(password)) {
    return redirectTo(
      `/admin-setup?error=${encodeURIComponent("La contraseña debe de ser mas larga")}`
    );
  }

  const admin = await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      active: true,
    },
  });

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

  const response = redirectTo("/admin");

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}