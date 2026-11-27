import Link from "next/link";
import { Suspense } from "react";
import { publicStats } from "@/lib/queries";

async function LiveNumbers() {
  const stats = await publicStats();
  const cards = [
    { label: "Real group desks", value: stats.desks },
    { label: "Requests captured", value: stats.captured },
    { label: "Closed", value: stats.closed },
    { label: "Still open", value: stats.open },
    { label: "In progress", value: stats.doing },
    { label: "Avg minutes to close", value: stats.avgMinutes },
  ];

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-line bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="serif mt-2 text-4xl">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        The hostel demo is excluded from these totals. Only requests on real
        group desks count toward the sprint numbers.
      </p>
    </>
  );
}

export default function ProofPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <Link href="/" className="text-sm text-muted">
        ← GroupDesk
      </Link>
      <h1 className="serif mt-6 text-4xl">Live numbers</h1>
      <p className="mt-3 text-muted">
        This is the sprint scoreboard: real requests that went through GroupDesk
        and got closed. More is better.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading live numbers…</p>}>
        <LiveNumbers />
      </Suspense>
    </main>
  );
}
