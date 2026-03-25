"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  email: string;
  createdAt: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (error) {
      console.error("Błąd pobierania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Wystąpił błąd");
        return;
      }

      setEmail("");
      setPassword("");
      setShowForm(false);
      fetchClients();
    } catch (error) {
      setError("Błąd połączenia z serwerem");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Client Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Baza klientów
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Zarządzaj ośrodkami zarejestrowanymi na platformie, twórz nowe konta
            i przechodź do szczegółów organizacji.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
        >
          {showForm ? "Anuluj dodawanie" : "+ Dodaj klienta ręcznie"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                Manual Create
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Utwórz konto dla nowego klienta
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
              Nowy ośrodek
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-100">Wystąpił błąd</p>
              <p className="mt-1 text-sm text-red-100/85">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Adres e-mail klienta
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[60px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="klient@domena.pl"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Hasło tymczasowe
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[60px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Wpisz hasło..."
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
              >
                Utwórz konto
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Registered organizations
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Zarejestrowane ośrodki
            </h2>
          </div>

          <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200">
            Łącznie: {clients.length}
          </span>
        </div>

        {isLoading ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">
              Ładowanie bazy klientów...
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Trwa pobieranie danych z systemu
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <svg
                className="h-10 w-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>

            <p className="text-lg font-medium text-white">
              Brak klientów w systemie
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Dodaj pierwszego klienta, aby rozpocząć pracę z bazą organizacji.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-white/8 text-left text-sm text-slate-500">
                  <th className="p-5 font-medium">Adres e-mail</th>
                  <th className="p-5 font-medium">Data rejestracji</th>
                  <th className="p-5 font-medium text-right">Akcje</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/8">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/20 to-blue-500/20 text-sm font-bold uppercase text-white">
                          {client.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {client.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Konto organizacji
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-sm text-slate-400">
                      {formatDate(client.createdAt)}
                    </td>

                    <td className="p-5 text-right">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="inline-flex items-center rounded-2xl border border-blue-300/15 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                      >
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}