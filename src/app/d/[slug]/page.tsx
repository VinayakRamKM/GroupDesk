import { Suspense } from "react";
import DeskClient from "./desk-client";

export default function DeskPage({
  params,
}: PageProps<"/d/[slug]">) {
  return (
    <Suspense fallback={<main className="p-8 text-muted">Loading desk…</main>}>
      {params.then(({ slug }) => (
        <DeskClient slug={slug} />
      ))}
    </Suspense>
  );
}
