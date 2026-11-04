import { Suspense } from "react";
import { connection } from "next/server";
import { listAdminCases, type AdminCaseRow } from "@/lib/admin-data";
import CaseRegister from "@/components/admin/CaseRegister";
import SignOutButton from "@/components/admin/SignOutButton";

export default function AdminPage() {
  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-rule-strong bg-paper px-[clamp(16px,4vw,48px)] py-3">
        <p className="text-[22px] tracking-[-0.02em]">Ad Studio</p>
        <SignOutButton />
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-[clamp(16px,4vw,48px)] pb-16 pt-8 sm:pt-12">
        <p className="label">Case register</p>
        <h1 className="display mt-2 text-[40px]">Every case a player opened</h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">
          Tick the cases worth a trailer and create their ads. Only the spoiler-free brief is shown
          here or sent to the ad pipeline.
        </p>

        <div className="mt-8">
          <Suspense fallback={<RegisterSkeleton />}>
            <Register />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Register() {
  await connection();
  let cases: AdminCaseRow[] | null;
  try {
    cases = await listAdminCases();
  } catch (err) {
    return (
      <Notice title="The register wouldn't open">
        Supabase returned: {err instanceof Error ? err.message : String(err)}. Check the keys in
        .env.local and that supabase/schema.sql has been run.
      </Notice>
    );
  }
  if (cases === null) {
    return (
      <Notice title="No database connected">
        Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart the server.
      </Notice>
    );
  }
  return <CaseRegister cases={cases} />;
}

function RegisterSkeleton() {
  return (
    <div aria-busy="true" aria-label="Opening the register">
      <div className="h-11 w-72 max-w-full rounded-t-md bg-rule" />
      <div className="sheet">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 border-b border-rule px-4 py-5 last:border-b-0">
            <div className="size-[18px] shrink-0 rounded-sm bg-rule" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded-sm bg-rule" />
              <div className="h-3 w-1/2 rounded-sm bg-rule/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="sheet px-6 py-8">
      <p className="label text-pen">{title}</p>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed [overflow-wrap:anywhere]">
        {children}
      </p>
    </div>
  );
}
