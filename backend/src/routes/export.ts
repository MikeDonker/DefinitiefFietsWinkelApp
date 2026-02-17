import { Hono } from "hono";
import { auth } from "../auth";
import { requireAuth } from "../middleware/auth-middleware";
import * as exportService from "../services/export.service";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

const exportRouter = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /bikes - Export all bikes as CSV
// ---------------------------------------------------------------------------

exportRouter.get("/bikes", requireAuth, async (c) => {
  const csv = await exportService.exportBikesCSV();

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="bikes-export.csv"');

  return c.body(csv);
});

// ---------------------------------------------------------------------------
// GET /work-orders - Export all work orders as CSV
// ---------------------------------------------------------------------------

exportRouter.get("/work-orders", requireAuth, async (c) => {
  const csv = await exportService.exportWorkOrdersCSV();

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="work-orders-export.csv"');

  return c.body(csv);
});

export { exportRouter };
