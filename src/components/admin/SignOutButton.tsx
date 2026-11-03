"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        router.replace("/admin/login");
        router.refresh();
      }}
      className="btn -my-1.5 min-h-11 cursor-pointer px-1.5 font-mono text-[12px] uppercase tracking-[0.04em] text-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
