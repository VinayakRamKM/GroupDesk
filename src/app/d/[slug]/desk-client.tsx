"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ExtractedItem } from "@/lib/classify";
import { CATEGORIES, SAMPLE_WHATSAPP } from "@/lib/constants";

type RequestItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  priority: string;
  requesterName: string;
  assigneeName: string | null;
  source: string;
  sourceMessage: string | null;
  closeNote: string | null;
  closedAt: string | null;
  createdAt: string;
};

type DeskPayload = {
  desk: { slug: string; name: string; kind: string; managerName: string };
  requests: RequestItem[];
};

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return body?.error || fallback;
}

const COLUMNS = [
  { id: "open", label: "Open" },
  { id: "doing", label: "Doing" },
  { id: "closed", label: "Closed" },
] as const;

function categoryMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

function DeskInner({ slug }: { slug: string }) {
  const search = useSearchParams();
  const role = search.get("role");
  const isEmployee = role === "employee" || role === "customer";
  const [data, setData] = useState<DeskPayload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [extracted, setExtracted] = useState<ExtractedItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    requesterName: "",
    category: "other",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/desks/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        setError(await responseError(res, "Could not load this desk."));
        return;
      }
      setData((await res.json()) as DeskPayload);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load this desk.",
      );
    }
  }, [slug]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (search.get("paste") === "1") {
      const stored = sessionStorage.getItem("groupdesk:paste");
      if (stored) {
        startTransition(() => {
          setPaste(stored);
          setPasteOpen(true);
        });
        sessionStorage.removeItem("groupdesk:paste");
      }
    }
  }, [search]);

  const counts = useMemo(() => {
    const list = data?.requests ?? [];
    return {
      open: list.filter((r) => r.status === "open").length,
      doing: list.filter((r) => r.status === "doing").length,
      closed: list.filter((r) => r.status === "closed").length,
    };
  }, [data]);

  const memberUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/d/${slug}?role=employee`
      : `/d/${slug}?role=employee`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `Need something done? Don't bury it in the group.\n\nLog it here and we'll close it:\n${memberUrl}`,
      );
      setCopied("WhatsApp invite copied");
      setTimeout(() => setCopied(""), 2000);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not copy the invite.",
      );
    }
  }

  async function ingest() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/desks/${slug}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paste }),
      });
      if (!res.ok) {
        setError(await responseError(res, "Could not parse chat."));
        return;
      }
      const json = (await res.json()) as { items?: ExtractedItem[] };
      setExtracted(json.items || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not parse chat.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmExtracted() {
    if (!extracted) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/desks/${slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: extracted, source: "whatsapp" }),
      });
      if (!res.ok) {
        setError(await responseError(res, "Could not create tasks."));
        return;
      }
      const result = (await res.json()) as {
        created?: unknown[];
        duplicatesSkipped?: number;
      };
      if (result.duplicatesSkipped) {
        setNotice(
          result.created?.length
            ? `Added ${result.created.length} new requests; skipped ${result.duplicatesSkipped} duplicates.`
            : "This chat was already imported; duplicate requests were skipped.",
        );
      }
      setExtracted(null);
      setPaste("");
      setPasteOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create tasks.");
    } finally {
      setBusy(false);
    }
  }

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/desks/${slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "form" }),
      });
      if (!res.ok) {
        setError(await responseError(res, "Could not add the request."));
        return;
      }
      setForm({ title: "", requesterName: "", category: "other" });
      setAddOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add the request.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError("");
    try {
      const res = await fetch(`/api/desks/${slug}/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await responseError(res, "Could not update the request."));
        return;
      }
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update the request.",
      );
    }
  }

  function whatsappDone(item: RequestItem) {
    const text = encodeURIComponent(
      `Done ✅ ${item.title}${item.closeNote ? ` — ${item.closeNote}` : ""}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <p>{error}</p>
        <Link href="/" className="mt-4 inline-block text-terracotta">
          Home
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-muted">Loading desk…</main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs uppercase tracking-wide text-terracotta">
            GroupDesk
          </Link>
          <h1 className="serif mt-1 text-3xl sm:text-4xl">{data.desk.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {isEmployee ? "Employee view · " : ""}
            {data.desk.managerName} · {counts.open} open · {counts.doing} doing
            {" · "}
            {counts.closed} closed
          </p>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-terracotta">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-2 text-sm text-teal">
              {notice}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEmployee ? (
            <>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full border border-ink px-4 py-2 text-sm font-semibold"
              >
                {copied || "Copy WhatsApp invite"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasteOpen(true);
                  setExtracted(null);
                }}
                className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
              >
                Paste chat
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold"
          >
            + Request
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.id} className="min-h-40">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {col.label}
            </h2>
            <div className="space-y-3">
              {data.requests
                .filter((r) => r.status === col.id)
                .map((item) => {
                  const cat = categoryMeta(item.category);
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-line bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-5">
                          {item.title}
                        </p>
                        {item.priority === "high" ? (
                          <span className="shrink-0 rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-terracotta">
                            High
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        {cat.emoji} {cat.label} · {item.requesterName}
                        {item.assigneeName ? ` → ${item.assigneeName}` : ""}
                      </p>
                      {item.closeNote ? (
                        <p className="mt-2 text-xs text-teal">{item.closeNote}</p>
                      ) : null}
                      {!isEmployee ? (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.status !== "doing" &&
                            item.status !== "closed" ? (
                              <button
                                type="button"
                                className="rounded-full border border-doing px-3 py-1 text-xs font-semibold text-doing"
                                onClick={() =>
                                  patch(item.id, { status: "doing" })
                                }
                              >
                                Doing
                              </button>
                            ) : null}
                            {item.status !== "closed" ? (
                              <button
                                type="button"
                                className="rounded-full bg-teal px-3 py-1 text-xs font-semibold text-white"
                                onClick={() =>
                                  patch(item.id, { status: "closed" })
                                }
                              >
                                Close
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-full border border-line px-3 py-1 text-xs"
                                onClick={() => whatsappDone(item)}
                              >
                                Ping WhatsApp
                              </button>
                            )}
                          </div>
                          {item.status !== "closed" ? (
                            <form
                              className="mt-2 flex gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const name = assigneeDraft[item.id]?.trim();
                                if (!name) return;
                                void patch(item.id, { assigneeName: name });
                              }}
                            >
                              <input
                                value={
                                  assigneeDraft[item.id] ??
                                  item.assigneeName ??
                                  ""
                                }
                                onChange={(e) =>
                                  setAssigneeDraft((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                placeholder="Assign (name)"
                                className="w-full rounded-lg border border-line px-2 py-1 text-xs"
                              />
                              <button
                                type="submit"
                                className="rounded-lg border border-line px-2 text-xs"
                              >
                                Set
                              </button>
                            </form>
                          ) : null}
                        </>
                      ) : null}
                    </article>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      {pasteOpen ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-paper p-5">
            <h2 className="serif text-2xl">Paste WhatsApp</h2>
            <p className="mt-1 text-sm text-muted">
              Copy a slice of the group, or use a chat export without media.
              Chatter is dropped. Uncheck anything that isn&apos;t work.
            </p>
            {extracted ? (
              <div className="mt-4 space-y-2">
                {extracted.length === 0 ? (
                  <p className="text-sm">No requests found in that paste.</p>
                ) : (
                  extracted.map((item, i) => (
                    <label
                      key={`${item.title}-${i}`}
                      className="flex gap-3 rounded-xl border border-line bg-card p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={item.keep}
                        onChange={(e) => {
                          const next = [...extracted];
                          next[i] = { ...item, keep: e.target.checked };
                          setExtracted(next);
                        }}
                      />
                      <span>
                        <span className="font-semibold">{item.title}</span>
                        <span className="mt-1 block text-xs text-muted">
                          {item.requesterName} · {categoryMeta(item.category).label}
                        </span>
                      </span>
                    </label>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setExtracted(null)}
                    className="rounded-full border border-line px-4 py-2 text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy || !extracted.some((i) => i.keep)}
                    onClick={() => void confirmExtracted()}
                    className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
                  >
                    {busy
                      ? "Creating…"
                      : `Create ${extracted.filter((i) => i.keep).length} tasks`}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="Paste the group here…"
                  className="mt-4 h-48 w-full rounded-xl border border-line bg-card p-3 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPaste(SAMPLE_WHATSAPP)}
                    className="text-xs font-semibold text-terracotta"
                  >
                    Load sample hostel chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasteOpen(false)}
                    className="ml-auto rounded-full border border-line px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy || !paste.trim()}
                    onClick={() => void ingest()}
                    className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
                  >
                    {busy ? "Reading…" : "Extract tasks"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            onSubmit={addRequest}
            className="w-full max-w-md rounded-2xl bg-paper p-5"
          >
            <h2 className="serif text-2xl">New request</h2>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to happen?"
              className="mt-4 w-full rounded-xl border border-line bg-card px-3 py-3"
            />
            <input
              value={form.requesterName}
              onChange={(e) =>
                setForm({ ...form, requesterName: e.target.value })
              }
              placeholder={isEmployee ? "Your name" : "Who asked?"}
              className="mt-3 w-full rounded-xl border border-line bg-card px-3 py-3"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-3 w-full rounded-xl border border-line bg-card px-3 py-3"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 rounded-full border border-line py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-full bg-terracotta py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

export default function DeskClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<main className="p-8 text-muted">Loading desk…</main>}>
      <DeskInner slug={slug} />
    </Suspense>
  );
}
