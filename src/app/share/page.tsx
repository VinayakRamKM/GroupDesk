"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, Suspense, useEffect, useState } from "react";

function ShareInner() {
  const params = useSearchParams();
  const router = useRouter();
  const text = params.get("text") || "";
  const [slug, setSlug] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("groupdesk:last");
      if (saved) {
        const parsed = JSON.parse(saved) as { slug?: string };
        if (parsed.slug) {
          startTransition(() => setSlug(parsed.slug!));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  function go() {
    if (!slug) return;
    sessionStorage.setItem("groupdesk:paste", text);
    router.push(`/d/${slug}?paste=1`);
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
      <h1 className="serif text-3xl">Shared from chat</h1>
      <p className="mt-3 text-sm text-muted">
        Send this snippet into a desk. On Android, install GroupDesk to Home
        Screen to share straight from WhatsApp.
      </p>
      <textarea
        readOnly
        value={text}
        className="mt-4 h-40 w-full rounded-xl border border-line bg-card p-3 text-sm"
      />
      <label className="mt-4 block text-sm font-medium">
        Desk code
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="hostel-demo"
          className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3"
        />
      </label>
      <button
        type="button"
        onClick={go}
        disabled={!slug}
        className="mt-4 w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Open desk with this paste
      </button>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<main className="p-8">Loading…</main>}>
      <ShareInner />
    </Suspense>
  );
}
