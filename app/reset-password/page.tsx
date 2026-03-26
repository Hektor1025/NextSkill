"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nie udało się zmienić hasła.");
        return;
      }

      setMessage("Hasło zostało zmienione. Za chwilę wrócisz do logowania.");

      window.setTimeout(() => {
        router.push("/");
      }, 2200);
    } catch (error) {
      console.error(error);
      setError("Wystąpił błąd komunikacji z serwerem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl">
        <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
          Security
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Ustaw nowe hasło
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Nowe hasło powinno mieć co najmniej 12 znaków oraz zawierać małą
          literę, wielką literę, cyfrę i znak specjalny.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Nowe hasło
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Powtórz nowe hasło
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
            />
          </div>

          {message && (
            <div className="rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-[18px] border border-rose-300/15 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !token}
            className="inline-flex w-full items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
          >
            {isLoading ? "Zapisywanie..." : "Zmień hasło"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/8 pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-cyan-200 transition hover:text-white"
          >
            ← Wróć do logowania
          </Link>
        </div>
      </div>
    </div>
  );
}