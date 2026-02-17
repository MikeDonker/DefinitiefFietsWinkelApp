import OpenAI from "openai";
import { env } from "../env";
import { prisma } from "../prisma";

// ---------------------------------------------------------------------------
// Feature flag check
// ---------------------------------------------------------------------------

export function isAIEnabled(): boolean {
  return env.FEATURE_AI === "true" && !!env.OPENAI_API_KEY;
}

// ---------------------------------------------------------------------------
// Lazy singleton OpenAI client
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ---------------------------------------------------------------------------
// Interface types
// ---------------------------------------------------------------------------

export interface SmartSearchResult {
  filters: {
    status?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    year?: number;
    size?: string;
  };
  explanation: string;
}

export interface PhotoRecognitionResult {
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  size?: string;
  type?: string;
  confidence: number;
  notes?: string;
}

export interface InvoiceParseResult {
  items: Array<{
    description: string;
    frameNumber?: string;
    brand?: string;
    model?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  supplier?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  notes?: string;
}

export interface AISignal {
  type: "duplicate_frame" | "price_outlier" | "negative_stock";
  severity: "warning" | "critical";
  message: string;
  details: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Smart Search - natural language to filters
// ---------------------------------------------------------------------------

export async function smartSearch(
  query: string,
  availableBrands: string[]
): Promise<SmartSearchResult> {
  if (!isAIEnabled()) {
    return {
      filters: {},
      explanation: "AI is uitgeschakeld. Gebruik de standaard zoekfunctie.",
    };
  }

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Je bent een assistent voor een fietswinkel. Vertaal zoekopdrachten naar filters.
Beschikbare merken: ${availableBrands.join(", ")}
Beschikbare statussen: IN_STOCK, IN_SERVICE, RESERVED, SOLD, SCRAPPED
Beschikbare maten: XS, S, M, L, XL

Reageer in JSON formaat:
{
  "filters": {
    "status": "optioneel - een van de statussen",
    "brand": "optioneel - merknaam",
    "minPrice": "optioneel - minimumprijs als getal",
    "maxPrice": "optioneel - maximumprijs als getal",
    "color": "optioneel - kleur",
    "year": "optioneel - jaar als getal",
    "size": "optioneel - maat"
  },
  "explanation": "Korte uitleg van wat je hebt gevonden in de query"
}

Wees slim: "goedkope fietsen" = maxPrice: 500, "dure fietsen" = minPrice: 1000
"rode trek" = color: "Rood", brand: "Trek"
"alles op voorraad" = status: "IN_STOCK"
"verkochte fietsen dit jaar" = status: "SOLD", year: huidige jaar`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  try {
    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      filters?: SmartSearchResult["filters"];
      explanation?: string;
    };
    return {
      filters: parsed.filters ?? {},
      explanation: parsed.explanation ?? "Zoekopdracht verwerkt",
    };
  } catch {
    return {
      filters: {},
      explanation: "Kon de zoekopdracht niet verwerken",
    };
  }
}

// ---------------------------------------------------------------------------
// Photo Recognition - identify bike from image
// ---------------------------------------------------------------------------

export async function recognizeBikeFromPhoto(
  imageBase64: string,
  availableBrands: string[]
): Promise<PhotoRecognitionResult> {
  if (!isAIEnabled()) {
    return {
      confidence: 0,
      notes: "AI is uitgeschakeld",
    };
  }

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Je bent een fietsexpert. Analyseer de foto en identificeer de fiets.
Beschikbare merken in het systeem: ${availableBrands.join(", ")}

Reageer in JSON:
{
  "brand": "merknaam als je het herkent (uit beschikbare merken als mogelijk)",
  "model": "modelnaam als je het herkent",
  "color": "kleur van de fiets",
  "year": "geschat bouwjaar als je dat kunt inschatten (getal)",
  "size": "geschatte maat (XS/S/M/L/XL)",
  "type": "type fiets (stadsfiets, racefiets, MTB, e-bike, etc.)",
  "confidence": 0.0 tot 1.0,
  "notes": "eventuele opmerkingen"
}

Wees eerlijk over je zekerheid. Als je iets niet zeker weet, laat het veld weg.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: "text" as const,
            text: "Analyseer deze fiets en geef de details.",
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  try {
    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      brand?: string;
      model?: string;
      color?: string;
      year?: string | number;
      size?: string;
      type?: string;
      confidence?: number;
      notes?: string;
    };
    return {
      brand: parsed.brand,
      model: parsed.model,
      color: parsed.color,
      year: parsed.year ? Number(parsed.year) : undefined,
      size: parsed.size,
      type: parsed.type,
      confidence: parsed.confidence ?? 0,
      notes: parsed.notes,
    };
  } catch {
    return { confidence: 0, notes: "Kon de foto niet analyseren" };
  }
}

// ---------------------------------------------------------------------------
// Invoice Parser - extract structured data from invoice text
// ---------------------------------------------------------------------------

export async function parseInvoice(
  text: string
): Promise<InvoiceParseResult> {
  if (!isAIEnabled()) {
    return {
      items: [],
      notes: "AI is uitgeschakeld",
    };
  }

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Je bent een factuurparser voor een fietswinkel. Analyseer de factuurtekst en extract de informatie.

Reageer in JSON:
{
  "items": [
    {
      "description": "omschrijving",
      "frameNumber": "framenummer als vermeld",
      "brand": "merk als vermeld",
      "model": "model als vermeld",
      "quantity": 1,
      "unitPrice": 0.00,
      "totalPrice": 0.00
    }
  ],
  "supplier": "leverancier naam",
  "invoiceNumber": "factuurnummer",
  "invoiceDate": "factuurdatum (YYYY-MM-DD)",
  "totalAmount": 0.00,
  "notes": "eventuele opmerkingen"
}

Extract zoveel mogelijk informatie. Prijzen zijn in EUR. Als iets niet zeker is, laat het veld weg.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  try {
    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      items?: Array<{
        description?: string;
        frameNumber?: string;
        brand?: string;
        model?: string;
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
      }>;
      supplier?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      totalAmount?: number;
      notes?: string;
    };
    return {
      items: (parsed.items ?? []).map((item) => ({
        description: item.description ?? "",
        frameNumber: item.frameNumber,
        brand: item.brand,
        model: item.model,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        totalPrice: item.totalPrice ?? 0,
      })),
      supplier: parsed.supplier,
      invoiceNumber: parsed.invoiceNumber,
      invoiceDate: parsed.invoiceDate,
      totalAmount: parsed.totalAmount,
      notes: parsed.notes,
    };
  } catch {
    return { items: [], notes: "Kon de factuur niet analyseren" };
  }
}

// ---------------------------------------------------------------------------
// AI Signals - rule-based data quality checks (no AI API needed)
// ---------------------------------------------------------------------------

export async function getAISignals(): Promise<AISignal[]> {
  const signals: AISignal[] = [];

  // 1. Duplicate frame numbers
  const allBikes = await prisma.bike.findMany({
    select: { id: true, frameNumber: true, status: true },
  });

  const frameMap = new Map<string, number[]>();
  for (const bike of allBikes) {
    const existing = frameMap.get(bike.frameNumber) ?? [];
    existing.push(bike.id);
    frameMap.set(bike.frameNumber, existing);
  }

  for (const [frameNumber, ids] of frameMap) {
    if (ids.length > 1) {
      signals.push({
        type: "duplicate_frame",
        severity: "critical",
        message: `Dubbel framenummer gevonden: ${frameNumber}`,
        details: { frameNumber, bikeIds: ids },
      });
    }
  }

  // 2. Price outliers (MAD-based detection)
  const bikesWithPrices = await prisma.bike.findMany({
    where: {
      sellingPrice: { not: null },
      status: { in: ["IN_STOCK", "RESERVED"] },
    },
    select: {
      id: true,
      frameNumber: true,
      sellingPrice: true,
      purchasePrice: true,
      brandId: true,
    },
    orderBy: { sellingPrice: "asc" },
  });

  if (bikesWithPrices.length >= 3) {
    const prices = bikesWithPrices
      .map((b) => b.sellingPrice!)
      .filter((p) => p > 0);

    if (prices.length >= 3) {
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sortedPrices.length / 2);
      const median = sortedPrices.length % 2 === 0
        ? (sortedPrices[mid - 1]! + sortedPrices[mid]!) / 2
        : sortedPrices[mid]!;

      const deviations = sortedPrices.map((p) => Math.abs(p - median)).sort((a, b) => a - b);
      const madMid = Math.floor(deviations.length / 2);
      const madValue = deviations.length % 2 === 0
        ? (deviations[madMid - 1]! + deviations[madMid]!) / 2
        : deviations[madMid]!;
      const mad = madValue ?? 0;
      const threshold = mad * 3;

      for (const bike of bikesWithPrices) {
        if (
          bike.sellingPrice &&
          Math.abs(bike.sellingPrice - median) > threshold &&
          threshold > 0
        ) {
          signals.push({
            type: "price_outlier",
            severity: "warning",
            message: `Prijsafwijking: Fiets ${bike.frameNumber} (\u20AC${bike.sellingPrice.toFixed(2)}) wijkt sterk af van mediaan (\u20AC${median.toFixed(2)})`,
            details: {
              bikeId: bike.id,
              frameNumber: bike.frameNumber,
              price: bike.sellingPrice,
              median,
            },
          });
        }
      }
    }
  }

  // 3. Negative stock warning (purchase price > selling price = potential loss)
  const potentialLossBikes = await prisma.bike.findMany({
    where: {
      status: "IN_STOCK",
      purchasePrice: { not: null },
      sellingPrice: { not: null },
    },
    include: { brand: true, model: true },
  });

  for (const bike of potentialLossBikes) {
    if (
      bike.purchasePrice &&
      bike.sellingPrice &&
      bike.purchasePrice > bike.sellingPrice
    ) {
      signals.push({
        type: "negative_stock",
        severity: "warning",
        message: `Mogelijke verliespost: ${bike.brand.name} ${bike.model.name} (Frame: ${bike.frameNumber}) - Inkoop \u20AC${bike.purchasePrice.toFixed(2)} > Verkoop \u20AC${bike.sellingPrice.toFixed(2)}`,
        details: {
          bikeId: bike.id,
          frameNumber: bike.frameNumber,
          purchasePrice: bike.purchasePrice,
          sellingPrice: bike.sellingPrice,
          loss: bike.purchasePrice - bike.sellingPrice,
        },
      });
    }
  }

  return signals;
}
