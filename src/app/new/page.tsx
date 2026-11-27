"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DESK_KINDS } from "@/lib/constants";

export default function NewDeskPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [kind, setKind] = useState("hostel");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind, managerName }),
      });
      const data = (await res.json()) as {
        slug?: string;
        managerKey?: string;
        error?: string;
      };
      if (!res.ok || !data.slug || !data.managerKey) {
        setError(data.error || "Could not create desk.");
        return;
      }
      localStorage.setItem(
        "groupdesk:last",
        JSON.stringify({ slug: data.slug, managerKey: data.managerKey }),
      );
      router.push(`/d/${data.slug}?k=${data.managerKey}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create desk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
      <Link href="/" className="text-sm text-muted">
        ← GroupDesk
      </Link>
      <h1 className="serif mt-6 text-4xl">Open a desk</h1>
      <p className="mt-3 text-muted">
        No accounts. You get a link for the group and a manager key for this
        browser.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Desk name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Indiranagar hostel night shift"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Your name
          <input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Vishal / night manager"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Kind of group
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3"
          >
            {DESK_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white"
        >
          {busy ? "Opening…" : "Create desk"}
        </button>
      </form>
    </main>
  );
}
