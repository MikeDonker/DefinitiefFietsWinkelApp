import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";
import { clearRoleCache } from "./middleware/auth-middleware";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
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
    "https://definitief-fiets-winkel-app.vercel.app",
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
      const anyCtx = ctx as any;
      // Only run on sign-up; all other paths pass through
      if (anyCtx.path !== "/sign-up/email") return { response: anyCtx.returned };

      const body = anyCtx.returned as { token?: string; user?: { id: string } } | undefined;
      const userId = body?.user?.id;
      if (!userId) return { response: anyCtx.returned };

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

      return { response: anyCtx.returned };
    },
  },
});
