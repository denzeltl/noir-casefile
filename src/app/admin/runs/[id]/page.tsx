import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminRun, type AdminRun } from "@/lib/admin-data";
import RunDesk from "@/components/admin/RunDesk";
import SignOutButton from "@/components/admin/SignOutButton";

export default function RunPage({ params }: PageProps<"/admin/runs/[id]">) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-rule-strong bg-paper px-[clamp(16px,4vw,48px)] py-3">
        <Link href="/admin" className="link-draw label -my-1.5 inline-flex min-h-11 items-center text-ink">
          ← Case register
        </Link>
        <div className="flex items-center gap-4">
          <p className="text-[22px] tracking-[-0.02em] max-sm:hidden">Ad Studio</p>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-[clamp(16px,4vw,48px)] pb-16 pt-8 sm:pt-12">
        <Suspense fallback={<RunSkeleton />}>
          <Run params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Run({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  let run: AdminRun | null;
  try {
    run = await getAdminRun(id);
  } catch (err) {
    return (
      <div role="alert" className="sheet px-6 py-8">
        <p className="label text-pen">This run wouldn&apos;t open</p>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed [overflow-wrap:anywhere]">
          {err instanceof Error ? err.message : String(err)}
        </p>
      </div>
    );
  }
  if (!run) notFound();
  return <RunDesk run={run} />;
}

function RunSkeleton() {
  return (
    <div aria-busy="true" aria-label="Opening the run">
      <div className="h-3 w-40 rounded-sm bg-rule" />
      <div className="mt-4 h-10 w-2/3 rounded-sm bg-rule" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[76px] rounded-sm border border-rule-strong bg-paper" />
          ))}
        </div>
        <div className="sheet h-[420px]" />
      </div>
    </div>
  );
}
