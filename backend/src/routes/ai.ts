import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { requireAuth } from "../middleware/auth-middleware";
import { prisma } from "../prisma";
import {
  isAIEnabled,
  smartSearch,
  recognizeBikeFromPhoto,
  parseInvoice,
  getAISignals,
} from "../services/aiService";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

const aiRouter = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /status - Check if AI is enabled
// ---------------------------------------------------------------------------

aiRouter.get("/status", requireAuth, async (c) => {
  return c.json({
    data: {
      enabled: isAIEnabled(),
      features: {
        smartSearch: isAIEnabled(),
        photoRecognition: isAIEnabled(),
        invoiceParser: isAIEnabled(),
        signals: true, // signals work without AI
      },
    },
  });
});

// ---------------------------------------------------------------------------
// POST /smart-search - Natural language search
// ---------------------------------------------------------------------------

const smartSearchSchema = z.object({
  query: z.string().min(1).max(500),
});

aiRouter.post(
  "/smart-search",
  requireAuth,
  zValidator("json", smartSearchSchema),
  async (c) => {
    const { query } = c.req.valid("json");

    const brands = await prisma.brand.findMany({ select: { name: true } });
    const brandNames = brands.map((b) => b.name);

    const result = await smartSearch(query, brandNames);

    // Apply the filters to actually search bikes
    const where: Record<string, unknown> = {};

    if (result.filters.status) {
      where.status = result.filters.status;
    }

    if (result.filters.brand) {
      where.brand = {
        name: { contains: result.filters.brand },
      };
    }

    if (result.filters.color) {
      where.color = { contains: result.filters.color };
    }

    if (result.filters.year) {
      where.year = result.filters.year;
    }

    if (result.filters.size) {
      where.size = result.filters.size;
    }

    if (result.filters.minPrice || result.filters.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (result.filters.minPrice) {
        priceFilter.gte = result.filters.minPrice;
      }
      if (result.filters.maxPrice) {
        priceFilter.lte = result.filters.maxPrice;
      }
      where.sellingPrice = priceFilter;
    }

    const bikes = await prisma.bike.findMany({
      where,
      include: { brand: true, model: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return c.json({
      data: {
        bikes,
        filters: result.filters,
        explanation: result.explanation,
        total: bikes.length,
      },
    });
  }
);

// ---------------------------------------------------------------------------
// POST /recognize-photo - Photo recognition
// ---------------------------------------------------------------------------

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_SIZE_BYTES * 4 / 3); // ~26.7MB as base64

const photoSchema = z.object({
  image: z
    .string()
    .min(1)
    .max(MAX_BASE64_LENGTH, `Afbeelding is te groot. Maximum is 20MB.`),
});

aiRouter.post(
  "/recognize-photo",
  requireAuth,
  zValidator("json", photoSchema),
  async (c) => {
    const { image } = c.req.valid("json");

    const brands = await prisma.brand.findMany({ select: { name: true } });
    const brandNames = brands.map((b) => b.name);

    const result = await recognizeBikeFromPhoto(image, brandNames);

    return c.json({ data: result });
  }
);

// ---------------------------------------------------------------------------
// POST /parse-invoice - Invoice/PDF parser
// ---------------------------------------------------------------------------

const invoiceSchema = z.object({
  text: z.string().min(1).max(10000),
});

aiRouter.post(
  "/parse-invoice",
  requireAuth,
  zValidator("json", invoiceSchema),
  async (c) => {
    const { text } = c.req.valid("json");
    const result = await parseInvoice(text);
    return c.json({ data: result });
  }
);

// ---------------------------------------------------------------------------
// GET /signals - AI signals (duplicate frames, price outliers, etc.)
// ---------------------------------------------------------------------------

aiRouter.get("/signals", requireAuth, async (c) => {
  const signals = await getAISignals();
  return c.json({ data: signals });
});

export { aiRouter };
