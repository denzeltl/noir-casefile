import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="grid flex-1 place-items-center px-4 py-16">
      <div className="sheet w-full max-w-[420px] px-6 py-8 sm:px-8">
        <p className="label">Ad Studio · Staff only</p>
        <h1 className="display mt-2 text-[40px]">Show your badge</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          The register lists every case players have opened. Enter the admin password to go in.
        </p>
        <Suspense fallback={<LoginForm next="/admin" />}>
          <LoginWithTarget searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginWithTarget({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only ever bounce back inside the admin.
  return <LoginForm next={next?.startsWith("/admin") ? next : "/admin"} />;
}
