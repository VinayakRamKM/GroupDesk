"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openDemo() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok || !data.slug) {
        throw new Error(data.error || "Could not open the demo.");
      }
      router.push(`/d/${data.slug}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the demo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-10 sm:py-16">
      <p className="text-3xl tracking-wide text-terracotta">GROUPDESK</p>
      <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight sm:text-6xl">
        The WhatsApp group is not a task list.
        <span className="text-terracotta"> Close the loop.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        Hostel managers get buried: move this guest, a locker won&apos;t open, ID
        isn&apos;t uploaded, add an extra charge. GroupDesk pulls those requests
        out of the chat, puts them on a board, and tracks them until they are
        actually done.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-white hover:bg-terracotta-dark"
        >
          Choose your role
        </Link>
        <button
          type="button"
          onClick={openDemo}
          disabled={busy}
          className="rounded-full border border-ink px-5 py-3 text-sm font-semibold"
        >
          {busy ? "Opening…" : "Try the hostel demo"}
        </button>
        <Link
          href="/proof"
          className="rounded-full border border-line px-5 py-3 text-sm font-semibold"
        >
          Live numbers
        </Link>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-terracotta">
          {error}
        </p>
      ) : null}

      <ol className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: "Drop the chat",
            d: "Paste a WhatsApp thread (or share from the app). Noise is dropped. Real asks become tasks.",
          },
          {
            n: "2",
            t: "Put a name on it",
            d: "Assign whoever is on shift. Tap Doing so nobody asks the same thing three times.",
          },
          {
            n: "3",
            t: "Close it",
            d: "One tap. Optional WhatsApp ping: “Done — guest moved to 301.” The group can see the loop closed.",
          },
        ].map((step) => (
          <li
            key={step.n}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <p className="text-xs font-semibold text-terracotta">{step.n}</p>
            <h2 className="serif mt-2 text-2xl">{step.t}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.d}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-2xl border border-line bg-card p-6">
        <h2 className="serif text-2xl">How a real group uses this in 10 minutes</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Create a desk. Copy the member link into the existing WhatsApp group.</li>
          <li>
            Export or copy a slice of the chat (WhatsApp → ⋮ → More → Export chat
            → Without media) and paste it.
          </li>
          <li>Uncheck anything that isn&apos;t a request. Create the rest.</li>
          <li>Work the board during the shift. Close as you go. Volume is the point.</li>
        </ol>
      </section>
    </main>
  );
}
