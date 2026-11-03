"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't sign in. Try again.");
        setPending(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="admin-password" className="label">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "admin-login-error" : undefined}
        className="field mt-1 block w-full border-0 border-b-2 border-rule-strong bg-transparent py-2 text-[17px]"
      />
      {error && (
        <p id="admin-login-error" role="alert" className="mt-3 text-[15px] text-pen">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !password}
        className="btn btn-ink mt-6 min-h-11 w-full cursor-pointer rounded-md px-5 font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Checking…" : "Enter the studio"}
      </button>
    </form>
  );
}
