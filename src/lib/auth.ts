// src/lib/auth.ts
import { prisma } from "@/lib/prisma";

/**
 * Extrae la cookie "session" de un Request
 */
function extractSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const parsed = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...v] = c.trim().split("=");
      return [key, v.join("=")];
    })
  );

  return parsed["session"] ?? null;
}

/**
 * Obtiene la sesión del usuario autenticado
 */
export async function getServerSession(req: Request) {
  const sessionToken = extractSessionToken(req);
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session) return null;

  return {
    user: {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

/**
 * Devuelve SOLO el usuario logeado
 */
export async function getUserFromSession(req: Request) {
  const session = await getServerSession(req);
  return session?.user ?? null;
}

/**
 * Crea la sesión durante el login
 */
export async function createSession(userId: number) {
  const token = crypto.randomUUID();

  await prisma.session.create({
    data: {
      token,
      userId,
      createdAt: new Date(),
    },
  });

  return token;
}

/**
 * Elimina una sesión (logout)
 */
export async function deleteSession(token: string) {
  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch (err) {
    console.error("Error deleting session:", err);
  }
}

/**
 * Middleware: requiere usuario autenticado
 */
export async function requireAuth(req: Request) {
  const user = await getUserFromSession(req);
  return user ?? null;
}

/**
 * Middleware: requiere ADMIN o SUPERADMIN
 */
export async function requireAdmin(req: Request) {
  const user = await getUserFromSession(req);
  if (!user) return null;

  return user.role === "ADMIN" || user.role === "SUPERADMIN"
    ? user
    : null;
}


