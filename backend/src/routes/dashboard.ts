import { Hono } from "hono";
import { auth } from "../auth";
import { requireAuth } from "../middleware/auth-middleware";
import * as dashboardService from "../services/dashboard.service";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

const dashboardRouter = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /stats - Dashboard statistics
// ---------------------------------------------------------------------------

dashboardRouter.get("/stats", requireAuth, async (c) => {
  const stats = await dashboardService.getDashboardStats();
  return c.json({ data: stats });
});

export { dashboardRouter };
