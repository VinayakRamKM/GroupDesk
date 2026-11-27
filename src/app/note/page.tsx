import Link from "next/link";

export default function NotePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <Link href="/" className="text-sm text-muted">
        ← GroupDesk
      </Link>
      <h1 className="serif mt-6 text-4xl">How I thought about it</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-ink">
        <p>
          A hostel WhatsApp group fails as an ops system for one reason: requests
          and chatter share the same timeline. The last message wins. Nothing is
          owned. Nothing is closed. Vishal&apos;s brief is not “build a chatbot” —
          it is “prove that real work can leave the group and come back done.”
        </p>
        <p>
          Official WhatsApp APIs will not clear in 72 hours for a student sprint,
          and unofficial clients are a ToS trap. So GroupDesk meets the group
          where it already is: paste an export, share a message, or tap a link
          from the group. The desk is the system of record. WhatsApp stays the
          hallway.
        </p>
        <p>
          Extraction is conservative on purpose. Greetings, “ok”, stickers, and
          media placeholders are dropped. Room moves, lockers, KYC, extra
          charges, and maintenance are classified so a night manager can scan
          instead of read. Closing is one tap, because volume is the judging
          metric — friction after capture is how tools die.
        </p>
        <p>
          The number that matters is closed requests on a real group, not demo
          cards. Drop the desk link in a college club, PG, family shop, or intern
          team today. Paste yesterday&apos;s chat. Close what you finish. The
          proof page is the scoreboard for Friday.
        </p>
      </div>
    </main>
  );
}
