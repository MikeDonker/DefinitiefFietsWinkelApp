import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../auth";
import {
  requireAuth,
  requirePermission,
} from "../middleware/auth-middleware";
import {
  listBikesSchema,
  createBikeSchema,
  updateBikeSchema,
  modelsQuerySchema,
} from "../types";
import * as bikeService from "../services/bike.service";
import { ServiceError } from "../services/bike.service";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

const bikesRouter = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// GET / - List bikes
// ---------------------------------------------------------------------------

bikesRouter.get(
  "/",
  requireAuth,
  requirePermission("bikes:read"),
  zValidator("query", listBikesSchema),
  async (c) => {
    const params = c.req.valid("query");
    const { bikes, total } = await bikeService.listBikes(params);
    return c.json({ data: bikes, meta: { total, page: params.page, limit: params.limit } });
  }
);

// ---------------------------------------------------------------------------
// GET /brands - List all brands (MUST be before /:id route)
// ---------------------------------------------------------------------------

bikesRouter.get("/brands", requireAuth, async (c) => {
  const brands = await bikeService.listBrands();
  return c.json({ data: brands });
});

// ---------------------------------------------------------------------------
// GET /models - List models (optionally filtered by brandId)
// (MUST be before /:id route)
// ---------------------------------------------------------------------------

bikesRouter.get(
  "/models",
  requireAuth,
  zValidator("query", modelsQuerySchema),
  async (c) => {
    const { brandId } = c.req.valid("query");
    const models = await bikeService.listModels(brandId);
    return c.json({ data: models });
  }
);

// ---------------------------------------------------------------------------
// GET /:id - Get single bike
// ---------------------------------------------------------------------------

bikesRouter.get(
  "/:id",
  requireAuth,
  requirePermission("bikes:read"),
  async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json(
        { error: { message: "Invalid bike ID", code: "INVALID_ID" } },
        400
      );
    }

    try {
      const bike = await bikeService.getBike(id);
      return c.json({ data: bike });
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
// POST / - Create bike
// ---------------------------------------------------------------------------

bikesRouter.post(
  "/",
  requireAuth,
  requirePermission("bikes:create"),
  zValidator("json", createBikeSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    try {
      const bike = await bikeService.createBike(body, user.id);
      return c.json({ data: bike }, 201);
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
// PATCH /:id - Update bike
// ---------------------------------------------------------------------------

bikesRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("bikes:update"),
  zValidator("json", updateBikeSchema),
  async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json(
        { error: { message: "Invalid bike ID", code: "INVALID_ID" } },
        400
      );
    }

    const body = c.req.valid("json");
    const user = c.get("user");

    try {
      const updatedBike = await bikeService.updateBike(id, body, user.id);
      return c.json({ data: updatedBike });
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
// POST /:id/checkout - Checkout (sell) a bike
// ---------------------------------------------------------------------------

bikesRouter.post(
  "/:id/checkout",
  requireAuth,
  requirePermission("bikes:update"),
  async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json(
        { error: { message: "Invalid bike ID", code: "INVALID_ID" } },
        400
      );
    }

    const user = c.get("user");

    try {
      const updatedBike = await bikeService.checkoutBike(id, user.id);
      return c.json({ data: updatedBike });
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

export { bikesRouter };
