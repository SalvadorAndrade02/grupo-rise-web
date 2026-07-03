import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} from "@/lib/security";

const ADMIN_SESSION_COOKIE = "grupo_rise_admin_session";
const SESSION_DAYS = 7;

function getSessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  return expiresAt;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function hasAdminUsers() {
  const count = await prisma.adminUser.count({
    where: {
      active: true,
    },
  });

  return count > 0;
}

export async function authenticateAdmin(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: {
      email: cleanEmail,
    },
  });

  if (!admin || !admin.active) {
    return null;
  }

  const isValidPassword = verifyPassword(password, admin.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return admin;
}

export async function createAdminSession(adminUserId: number) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt();

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.adminSession.findUnique({
    where: {
      tokenHash,
    },
    include: {
      adminUser: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.adminSession.deleteMany({
      where: {
        tokenHash,
      },
    });

    return null;
  }

  if (!session.adminUser.active) {
    return null;
  }

  return {
    session,
    admin: session.adminUser,
  };
}

export async function requireAdmin() {
  const hasAdmins = await hasAdminUsers();

  if (!hasAdmins) {
    redirect("/admin-setup");
  }

  const adminSession = await getAdminSession();

  if (!adminSession) {
    redirect("/admin-login");
  }

  return adminSession.admin;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}