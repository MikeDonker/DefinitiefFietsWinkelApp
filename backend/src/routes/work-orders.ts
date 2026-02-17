import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../auth";
import {
  requireAuth,
  requirePermission,
} from "../middleware/auth-middleware";
import {
  listWorkOrdersSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
} from "../types";
import * as workOrderService from "../services/work-order.service";
import { ServiceError } from "../services/work-order.service";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

const workOrdersRouter = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// GET / - List work orders
// ---------------------------------------------------------------------------

workOrdersRouter.get(
  "/",
  requireAuth,
  zValidator("query", listWorkOrdersSchema),
  async (c) => {
    const params = c.req.valid("query");
    const { workOrders, total } = await workOrderService.listWorkOrders(params);
    return c.json({ data: workOrders, meta: { total, page: params.page, limit: params.limit } });
  }
);

// ---------------------------------------------------------------------------
// GET /:id - Get single work order
// ---------------------------------------------------------------------------

workOrdersRouter.get("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json(
      { error: { message: "Invalid work order ID", code: "INVALID_ID" } },
      400
    );
  }

  try {
    const workOrder = await workOrderService.getWorkOrder(id);
    return c.json({ data: workOrder });
  } catch (e) {
    if (e instanceof ServiceError) {
      return c.json(
        { error: { message: e.message, code: e.code } },
        e.status as 400 | 404 | 409 | 422
      );
    }
    throw e;
  }
});

// ---------------------------------------------------------------------------
// POST / - Create work order
// ---------------------------------------------------------------------------

workOrdersRouter.post(
  "/",
  requireAuth,
  requirePermission("workorders:create"),
  zValidator("json", createWorkOrderSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    try {
      const workOrder = await workOrderService.createWorkOrder(body, user.id);
      return c.json({ data: workOrder }, 201);
    } catch (e) {
      if (e instanceof ServiceError) {
        return c.json(
          { error: { message: e.message, code: e.code } },
          e.status as 400 | 404 | 409 | 422
        );
      }
      throw e;
    }
  }
);

// ---------------------------------------------------------------------------
// PATCH /:id - Update work order
// ---------------------------------------------------------------------------

workOrdersRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("workorders:update"),
  zValidator("json", updateWorkOrderSchema),
  async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json(
        { error: { message: "Invalid work order ID", code: "INVALID_ID" } },
        400
      );
    }

    const body = c.req.valid("json");
    const user = c.get("user");

    try {
      const updatedOrder = await workOrderService.updateWorkOrder(id, body, user.id);
      return c.json({ data: updatedOrder });
    } catch (e) {
      if (e instanceof ServiceError) {
        return c.json(
          { error: { message: e.message, code: e.code } },
          e.status as 400 | 404 | 409 | 422
        );
      }
      throw e;
    }
  }
);

export { workOrdersRouter };
