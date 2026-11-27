"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function validDeskCode(value: string) {
  try {
    const code = decodeURIComponent(value);
    return /^[a-z0-9_-]+$/i.test(code) ? code : null;
  } catch {
    return null;
  }
}

function getDeskCode(invite: string) {
  const value = invite.trim();
  const urls = value.match(/https?:\/\/[^\s]+/gi) ?? [];

  for (const candidate of urls) {
    try {
      const cleanUrl = candidate.replace(/[.,!?)}\]]+$/, "");
      const match = new URL(cleanUrl).pathname.match(/^\/d\/([^/]+)\/?$/);
      if (match) return validDeskCode(match[1]);
    } catch {
      continue;
    }
  }

  const pathMatch = value.match(/^\/?d\/([^/?#\s]+)\/?$/);
  if (pathMatch) return validDeskCode(pathMatch[1]);
  return validDeskCode(value);
}

export default function LoginPage() {
  const router = useRouter();
  const [deskCode, setDeskCode] = useState("");
  const [error, setError] = useState("");

  function openEmployeeDesk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getDeskCode(deskCode);
    if (!code) {
      setError("Enter a desk code or paste a valid manager invite.");
      return;
    }
    setError("");
    router.push(`/d/${encodeURIComponent(code)}?role=employee`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <Link href="/" className="text-sm text-muted">
        ← GroupDesk
      </Link>
      <h1 className="serif mt-6 text-4xl">Choose how to continue</h1>
      <p className="mt-3 text-muted">
        No account or password needed. Choose the role you want to use.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-line bg-card p-5">
          <h2 className="serif text-2xl">Manager</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">
            Create a desk and organize requests for your group.
          </p>
          <Link
            href="/new"
            className="mt-5 rounded-full bg-terracotta px-5 py-3 text-center text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            Continue as manager
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="serif text-2xl">Employee</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Paste the manager&apos;s WhatsApp invite or enter its desk code to
            view updates or add a request.
          </p>
          <form onSubmit={openEmployeeDesk} className="mt-5">
            <label htmlFor="desk-invite" className="block text-sm font-medium">
              Invite link or desk code
            </label>
            <textarea
              id="desk-invite"
              required
              rows={3}
              value={deskCode}
              onChange={(event) => {
                setDeskCode(event.target.value);
                setError("");
              }}
              placeholder="Paste the WhatsApp invite or enter a desk code"
              aria-invalid={Boolean(error)}
              className="mt-1 w-full resize-y rounded-xl border border-line bg-paper px-3 py-3"
            />
            {error ? (
              <p role="alert" className="mt-2 text-sm text-terracotta">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-3 w-full rounded-full border border-ink px-5 py-3 text-sm font-semibold"
            >
              Continue as employee
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
