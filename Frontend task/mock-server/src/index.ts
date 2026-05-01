import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import express from "express";
import cors from "cors";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Advantage = { title: string; description: string };
type Trip = {
  id: number;
  photoUrl: string;
  title: string;
  subtitle: string;
  countries: string[];
  days: number;
  co2kilograms: number;
  rating: number;
  description: string;
  advantages: Advantage[];
};

const tripsPath = resolve(__dirname, "../../trips.json");
const trips: Trip[] = JSON.parse(readFileSync(tripsPath, "utf-8"));

const SortValues = [
  "rating",
  "-rating",
  "days",
  "-days",
  "co2kilograms",
  "-co2kilograms",
  "title",
  "-title",
] as const;

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(SortValues).default("-rating"),
  country: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxDays: z.coerce.number().int().min(1).optional(),
});

type ListQuery = z.infer<typeof listQuerySchema>;

function filterFingerprint(q: ListQuery): string {
  const normalized = {
    sort: q.sort,
    country: [...q.country].sort(),
    minRating: q.minRating ?? null,
    maxDays: q.maxDays ?? null,
  };
  return createHash("sha1")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 12);
}

function encodeCursor(offset: number, fingerprint: string): string {
  return Buffer.from(JSON.stringify({ o: offset, f: fingerprint })).toString(
    "base64url",
  );
}

function decodeCursor(
  cursor: string,
): { offset: number; fingerprint: string } | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8"),
    );
    if (
      typeof parsed?.o === "number" &&
      Number.isInteger(parsed.o) &&
      parsed.o >= 0 &&
      typeof parsed?.f === "string"
    ) {
      return { offset: parsed.o, fingerprint: parsed.f };
    }
    return null;
  } catch {
    return null;
  }
}

function applyFilters(items: Trip[], q: ListQuery): Trip[] {
  let out = items;
  if (q.country.length > 0) {
    const wanted = new Set(q.country.map((c) => c.toLowerCase()));
    out = out.filter((t) =>
      t.countries.some((c) => wanted.has(c.toLowerCase())),
    );
  }
  if (q.minRating !== undefined) {
    out = out.filter((t) => t.rating >= q.minRating!);
  }
  if (q.maxDays !== undefined) {
    out = out.filter((t) => t.days <= q.maxDays!);
  }
  return out;
}

function applySort(items: Trip[], sort: ListQuery["sort"]): Trip[] {
  const desc = sort.startsWith("-");
  const key = (desc ? sort.slice(1) : sort) as
    | "rating"
    | "days"
    | "co2kilograms"
    | "title";
  const dir = desc ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return a.id - b.id;
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((_req, _res, next) => {
  setTimeout(next, 200 + Math.random() * 200);
});

app.get("/", (_req, res) => {
  res.json({
    name: "chooose-mock-server",
    endpoints: ["GET /trips", "GET /trips/:id"],
  });
});

app.get("/trips", (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_QUERY",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  }
  const q = parsed.data;
  const fingerprint = filterFingerprint(q);

  let offset = 0;
  if (q.cursor) {
    const decoded = decodeCursor(q.cursor);
    if (!decoded) {
      return res
        .status(400)
        .json({ code: "INVALID_CURSOR", message: "Cursor is malformed." });
    }
    if (decoded.fingerprint !== fingerprint) {
      return res.status(400).json({
        code: "INVALID_CURSOR",
        message:
          "Cursor was issued for a different sort/filter combination. Restart pagination from the first page.",
      });
    }
    offset = decoded.offset;
  }

  const filtered = applyFilters(trips, q);
  const sorted = applySort(filtered, q.sort);
  const slice = sorted.slice(offset, offset + q.limit);
  const newOffset = offset + slice.length;
  const hasNextPage = newOffset < sorted.length;

  const items = slice.map((t) => ({
    id: t.id,
    photoUrl: t.photoUrl,
    title: t.title,
    subtitle: t.subtitle,
    countries: t.countries,
    days: t.days,
    co2kilograms: t.co2kilograms,
    rating: t.rating,
  }));

  res.json({
    items,
    pageInfo: {
      nextCursor: hasNextPage ? encodeCursor(newOffset, fingerprint) : null,
      hasNextPage,
      limit: q.limit,
    },
    totalCount: sorted.length,
  });
});

app.get("/trips/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res
      .status(400)
      .json({ code: "INVALID_QUERY", message: "id must be an integer" });
  }
  const trip = trips.find((t) => t.id === id);
  if (!trip) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: `Trip ${id} not found` });
  }
  res.json(trip);
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
  console.log(`[mock-server] loaded ${trips.length} trips from ${tripsPath}`);
});
