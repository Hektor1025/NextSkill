"use client";

import React, { useEffect, useState } from "react";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    nip: "",
    address: "",
    contactPerson: "",
    phone: "",
    newPassword: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const initProfile = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const session = await sessionRes.json();

        if (session?.user?.email) {
          setUserEmail(session.user.email);
          fetchProfile(session.user.email);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Błąd sesji:", error);
        setIsLoading(false);
      }
    };

    initProfile();
  }, []);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          companyName: data.companyName || "",
          nip: data.nip || "",
          address: data.address || "",
          contactPerson: data.contactPerson || "",
          phone: data.phone || "",
          newPassword: "",
        });
      }
    } catch (error) {
      console.error("Błąd pobierania profilu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          ...formData,
        }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Dane profilu zostały pomyślnie zaktualizowane.",
        });
        setFormData({ ...formData, newPassword: "" });
      } else {
        setMessage({
          type: "error",
          text: "Wystąpił błąd podczas zapisywania.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Wystąpił błąd połączenia z serwerem.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
          <p className="text-lg font-semibold text-white">
            Ładowanie danych profilu...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa przygotowanie danych organizacji
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
          Organization profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Mój profil
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
          Aktualizuj dane ośrodka. Informacje te będą wykorzystywane do rozliczeń,
          dokumentów oraz obsługi procesu certyfikacji.
        </p>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                Account identity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Konto powiązane z organizacją
              </h2>
              <p className="mt-3 text-sm text-slate-400">{userEmail}</p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          {message.text && (
            <div
              className={`mb-6 rounded-[20px] border p-4 text-sm font-medium ${
                message.type === "success"
                  ? "border-emerald-300/15 bg-emerald-400/10 text-emerald-100"
                  : "border-red-400/15 bg-red-500/10 text-red-100"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Pełna nazwa firmy / ośrodka
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Numer NIP
              </label>
              <input
                type="text"
                name="nip"
                value={formData.nip}
                onChange={handleChange}
                required
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 font-mono text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Pełny adres
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>

            <div className="md:col-span-2 mt-2 border-t border-white/10 pt-6" />

            <div>
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Osoba kontaktowa
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="np. Jan Kowalski"
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Telefon kontaktowy
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+48..."
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>
          </div>

          <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white">
                  Bezpieczeństwo
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Jeśli chcesz zmienić hasło do konta, wpisz nowe poniżej. W przeciwnym
                  razie pozostaw pole puste.
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Nowe hasło
              </label>
              <input
                type="text"
                name="newPassword"
                placeholder="Wpisz nowe hasło..."
                value={formData.newPassword}
                onChange={handleChange}
                className="h-[58px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-white/10 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-[20px] border border-cyan-300/15 bg-cyan-400/10 px-8 py-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15 disabled:opacity-60"
            >
              {isSaving ? "Zapisywanie zmian..." : "Zapisz zmiany w profilu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}