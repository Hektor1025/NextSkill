"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nie udało się uruchomić resetu hasła.");
        return;
      }

      setMessage(
        "Jeśli konto istnieje, wiadomość z linkiem do resetu została wysłana."
      );
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
          Reset hasła
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Podaj adres e-mail przypisany do konta. Jeśli konto istnieje,
          wyślemy link do ustawienia nowego hasła.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Adres e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
              placeholder="biuro@osrodek.pl"
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
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
          >
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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