import { and, count, desc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { desks, requests, type RequestRow } from "./schema";
import type { ExtractedItem } from "./classify";

export async function createDesk(input: {
  name: string;
  kind: string;
  managerName: string;
}) {
  const db = getDb();
  const slug = nanoid(8).toLowerCase();
  const managerKey = nanoid(16);
  const [desk] = await db
    .insert(desks)
    .values({
      slug,
      name: input.name.trim(),
      kind: input.kind,
      managerName: input.managerName.trim() || "Manager",
      managerKey,
    })
    .returning();
  return desk;
}

export async function getDeskBySlug(slug: string) {
  const db = getDb();
  const [desk] = await db.select().from(desks).where(eq(desks.slug, slug));
  return desk ?? null;
}

export async function listRequests(deskId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(requests)
    .where(eq(requests.deskId, deskId))
    .orderBy(desc(requests.createdAt));

  const unique = new Map<string, RequestRow>();
  for (const row of rows) {
    const key =
      row.source === "whatsapp" && row.sourceMessage
        ? `source:${row.sourceMessage}`
        : `request:${row.id}`;
    const existing = unique.get(key);
    if (!existing || row.createdAt.getTime() < existing.createdAt.getTime()) {
      unique.set(key, row);
    }
  }

  return [...unique.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function insertRequests(
  deskId: string,
  items: ExtractedItem[],
  source: string,
) {
  if (items.length === 0) return [];
  const db = getDb();

  let itemsToInsert = items;
  if (source === "whatsapp") {
    const [desk] = await db
      .select({ slug: desks.slug })
      .from(desks)
      .where(eq(desks.id, deskId));
    const isDemoDesk = desk?.slug === "hostel-demo";
    const sourceMessages = [
      ...new Set(
        items
          .map((item) => item.sourceMessage)
          .filter((message) => message.trim().length > 0),
      ),
    ];
    const existingRows =
      isDemoDesk
        ? await db
            .select({
              sourceMessage: requests.sourceMessage,
              body: requests.body,
              requesterName: requests.requesterName,
            })
            .from(requests)
            .where(
              and(
                eq(requests.deskId, deskId),
                eq(requests.source, "whatsapp"),
              ),
            )
        : sourceMessages.length > 0
        ? await db
            .select({
              sourceMessage: requests.sourceMessage,
              body: requests.body,
              requesterName: requests.requesterName,
            })
            .from(requests)
            .where(
              and(
                eq(requests.deskId, deskId),
                eq(requests.source, "whatsapp"),
                inArray(requests.sourceMessage, sourceMessages),
              ),
            )
        : [];
    const existingMessages = new Set(
      existingRows
        .map((row) => row.sourceMessage)
        .filter((message): message is string => message !== null),
    );
    const seenMessages = new Set<string>();
    const existingDemoContent = new Set(
      existingRows.map((row) => `${row.requesterName}\u0000${row.body}`),
    );
    const seenDemoContent = new Set<string>();
    itemsToInsert = items.filter((item) => {
      const message = item.sourceMessage;
      if (
        message.trim() &&
        (existingMessages.has(message) || seenMessages.has(message))
      ) {
        return false;
      }
      if (isDemoDesk) {
        const content = `${item.requesterName}\u0000${item.body}`;
        if (existingDemoContent.has(content) || seenDemoContent.has(content)) {
          return false;
        }
        seenDemoContent.add(content);
      }
      if (message.trim()) seenMessages.add(message);
      return true;
    });
  }

  if (itemsToInsert.length === 0) return [];

  return db
    .insert(requests)
    .values(
      itemsToInsert.map((item) => ({
        deskId,
        title: item.title,
        body: item.body,
        category: item.category,
        priority: item.priority,
        requesterName: item.requesterName,
        source,
        sourceMessage: item.sourceMessage,
        status: "open" as const,
      })),
    )
    .returning();
}

export async function updateRequest(
  deskId: string,
  id: string,
  patch: Partial<
    Pick<
      RequestRow,
      "status" | "assigneeName" | "closeNote" | "title" | "category" | "priority"
    >
  >,
) {
  const db = getDb();
  const closed =
    patch.status === "closed"
      ? { closedAt: new Date(), updatedAt: new Date() }
      : { updatedAt: new Date(), closedAt: patch.status ? null : undefined };
  const [row] = await db
    .update(requests)
    .set({ ...patch, ...closed })
    .where(and(eq(requests.id, id), eq(requests.deskId, deskId)))
    .returning();
  return row ?? null;
}

export async function publicStats() {
  const db = getDb();
  const demoDeskIds = db
    .select({ id: desks.id })
    .from(desks)
    .where(eq(desks.slug, "hostel-demo"));
  const [deskCount] = await db
    .select({ n: count() })
    .from(desks)
    .where(ne(desks.slug, "hostel-demo"));
  const [captured] = await db
    .select({ n: count() })
    .from(requests)
    .where(notInArray(requests.deskId, demoDeskIds));
  const [closed] = await db
    .select({ n: count() })
    .from(requests)
    .where(
      and(notInArray(requests.deskId, demoDeskIds), eq(requests.status, "closed")),
    );
  const [open] = await db
    .select({ n: count() })
    .from(requests)
    .where(
      and(notInArray(requests.deskId, demoDeskIds), eq(requests.status, "open")),
    );
  const [doing] = await db
    .select({ n: count() })
    .from(requests)
    .where(
      and(notInArray(requests.deskId, demoDeskIds), eq(requests.status, "doing")),
    );
  const avgRows = await db.execute(sql`
    select coalesce(
      round(avg(extract(epoch from (r.closed_at - r.created_at)) / 60)),
      0
    )::int as minutes
    from requests r
    inner join desks d on d.id = r.desk_id
    where r.closed_at is not null and d.slug <> 'hostel-demo'
  `);
  const avgRow = (Array.isArray(avgRows) ? avgRows[0] : avgRows.rows?.[0]) as
    | { minutes?: number }
    | undefined;
  return {
    desks: deskCount.n,
    captured: captured.n,
    closed: closed.n,
    open: open.n,
    doing: doing.n,
    avgMinutes: avgRow?.minutes ?? 0,
  };
}

export async function ensureDemoDesk() {
  const slug = "hostel-demo";
  const existing = await getDeskBySlug(slug);
  if (existing) {
    const items = await listRequests(existing.id);
    return { desk: existing, requests: items };
  }

  const db = getDb();
  const [desk] = await db
    .insert(desks)
    .values({
      slug,
      name: "Indiranagar demo hostel",
      kind: "hostel",
      managerName: "Night manager",
      managerKey: "demo-key-not-secret",
    })
    .returning();

  const now = Date.now();
  await db.insert(requests).values([
    {
      deskId: desk.id,
      title: "Move guest in 204 to 301 — quieter room",
      body: "hi can someone move the guest in 204 to 301? she wants a quieter room",
      category: "room_move",
      status: "closed",
      priority: "normal",
      requesterName: "Ananya",
      assigneeName: "Rahul",
      source: "whatsapp",
      sourceMessage: "[10:12, 24/11/2026] Ananya: hi can someone move the guest in 204 to 301?",
      closeNote: "Moved to 301. Guest confirmed.",
      closedAt: new Date(now - 36 * 60 * 1000),
      createdAt: new Date(now - 50 * 60 * 1000),
    },
    {
      deskId: desk.id,
      title: "Locker 12 not opening, passport inside",
      body: "locker 12 not opening after last night, guest stuck with passport inside",
      category: "locker",
      status: "doing",
      priority: "high",
      requesterName: "Rahul",
      assigneeName: "Maintenance",
      source: "whatsapp",
      sourceMessage: "[10:15, 24/11/2026] Rahul: locker 12 not opening…",
    },
    {
      deskId: desk.id,
      title: "KYC for Mr Sharma still not uploaded",
      body: "ID of Mr Sharma (check-in tonight) still not uploaded. Please do KYC before 6",
      category: "id_kyc",
      status: "open",
      priority: "high",
      requesterName: "Front desk",
      source: "whatsapp",
    },
    {
      deskId: desk.id,
      title: "Extra charge ₹400 laundry on bed 12B",
      body: "add extra charge of 400 for laundry on bed 12B",
      category: "extra_charge",
      status: "closed",
      priority: "normal",
      requesterName: "Karan",
      assigneeName: "Ananya",
      source: "whatsapp",
      closeNote: "Added on folio.",
      closedAt: new Date(now - 12 * 60 * 1000),
    },
    {
      deskId: desk.id,
      title: "Wi-Fi dead on 2nd floor",
      body: "wifi on 2nd floor dead since morning, 4 guests complaining",
      category: "maintenance",
      status: "open",
      priority: "high",
      requesterName: "Rahul",
      source: "whatsapp",
    },
  ]);

  const items = await listRequests(desk.id);
  return { desk, requests: items };
}
