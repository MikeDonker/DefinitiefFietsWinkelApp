import type { Context, Next } from "hono";
import { auth } from "../auth";
import { prisma } from "../prisma";

// In-memory cache for roles and permissions (TTL: 5 minutes)
interface RoleCacheEntry {
  roles: string[];
  permissions: Set<string>;
  expiresAt: number;
}

const roleCache = new Map<string, RoleCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 1_000;

// Active cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of roleCache) {
    if (entry.expiresAt < now) roleCache.delete(userId);
  }
}, 10 * 60 * 1000);

export function clearRoleCache(userId?: string): void {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}

async function getCachedRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: Set<string> }> {
  const now = Date.now();
  const cached = roleCache.get(userId);

  if (cached && cached.expiresAt > now) {
    return { roles: cached.roles, permissions: cached.permissions };
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const roles: string[] = [];
  const permissions = new Set<string>();

  for (const ur of userRoles) {
    roles.push(ur.role.name);
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.name);
    }
  }

  // Evict oldest if cache is full
  if (roleCache.size >= CACHE_MAX_SIZE) {
    const firstKey = roleCache.keys().next().value;
    if (firstKey) roleCache.delete(firstKey);
  }
  roleCache.set(userId, {
    roles,
    permissions,
    expiresAt: now + CACHE_TTL_MS,
  });

  return { roles, permissions };
}

type AuthEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

/**
 * Middleware that requires a valid session.
 * Relies on the global /api/* middleware having already populated user/session.
 * Returns 401 if no valid session is found.
 */
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
  const user = c.get("user");
  const session = c.get("session");

  if (!user || !session) {
    return c.json(
      { error: { message: "Authentication required", code: "UNAUTHORIZED" } },
      401
    );
  }

  await next();
}

/**
 * Factory middleware that checks if the authenticated user has one of the specified roles.
 * Must be used after requireAuth.
 * Returns 403 if the user does not have one of the required roles.
 */
export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: { message: "Authentication required", code: "UNAUTHORIZED" } },
        401
      );
    }

    const cached = await getCachedRolesAndPermissions(user.id);
    const hasRole = roles.some((role) => cached.roles.includes(role));

    if (!hasRole) {
      return c.json(
        {
          error: {
            message: "Insufficient permissions",
            code: "FORBIDDEN",
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Factory middleware that checks if the authenticated user has ALL of the specified permissions
 * via their roles. Must be used after requireAuth.
 * Returns 403 if the user lacks any of the required permissions.
 */
export function requirePermission(...permissions: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: { message: "Authentication required", code: "UNAUTHORIZED" } },
        401
      );
    }

    const cached = await getCachedRolesAndPermissions(user.id);
    const hasAllPermissions = permissions.every((p) => cached.permissions.has(p));

    if (!hasAllPermissions) {
      return c.json(
        {
          error: {
            message: "Insufficient permissions",
            code: "FORBIDDEN",
          },
        },
        403
      );
    }

    await next();
  };
}
