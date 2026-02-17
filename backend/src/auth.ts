import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";
import { clearRoleCache } from "./middleware/auth-middleware";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  hooks: {
    after: async (ctx) => {
      // Only run on sign-up; all other paths pass through
      if (ctx.path !== "/sign-up/email") return { response: ctx.returned };

      const body = ctx.returned as { token?: string; user?: { id: string } } | undefined;
      const userId = body?.user?.id;
      if (!userId) return { response: ctx.returned };

      // Assign default "medewerker" role to new users
      try {
        const role = await prisma.role.findUnique({ where: { name: "medewerker" } });
        if (role) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId, roleId: role.id } },
            create: { userId, roleId: role.id },
            update: {},
          });
          clearRoleCache(userId);
        }
      } catch (e) {
        console.error("[Auth] Failed to assign default role:", e);
      }

      return { response: ctx.returned };
    },
  },
});
