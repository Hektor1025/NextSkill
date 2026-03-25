"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type RecentOrder = {
  id: string;
  status: string;
  createdAt: string;
  client: { email: string };
  examTemplate: { title: string } | null;
};

type DashboardStats = {
  clientsCount: number;
  newOrdersCount: number;
  certificatesCount: number;
  recentOrders: RecentOrder[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Błąd pobierania statystyk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return (
          <span className="inline-flex rounded-full border border-yellow-300/15 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            1. Nowe
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
            2. Osoby
          </span>
        );
      case "TEST_READY":
        return (
          <span className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            3. Testy
          </span>
        );
      case "SCANS_UPLOADED":
        return (
          <span className="inline-flex rounded-full border border-purple-300/15 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
            Skany wgrane
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            4. Gotowe
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
            Nieznany
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
          <p className="text-lg font-semibold text-white">
            Wczytywanie statystyk platformy...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie danych administracyjnych
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Executive Overview
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Witaj na swoim pulpicie
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Oto aktualne podsumowanie najważniejszych danych i aktywności na
            platformie administratora.
          </p>
        </div>

        <div className="inline-flex self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
          Panel premium
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-yellow-200/75">
              Nowe zlecenia
            </p>
            <div className="mt-5 flex items-end gap-3">
              <p className="text-5xl font-semibold text-white">
                {stats?.newOrdersCount || 0}
              </p>
              {stats?.newOrdersCount ? (
                <span className="mb-1 rounded-full border border-yellow-300/15 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                  Wymaga uwagi
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Nowe procesy oczekujące na obsługę administratora.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-emerald-200/75">
              Wydane certyfikaty
            </p>
            <p className="mt-5 text-5xl font-semibold text-white">
              {stats?.certificatesCount || 0}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Łączna liczba zakończonych i wydanych certyfikatów.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/75">
              Zarejestrowane ośrodki
            </p>
            <p className="mt-5 text-5xl font-semibold text-white">
              {stats?.clientsCount || 0}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Aktywne organizacje korzystające z platformy.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Ostatnia aktywność
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Najnowsze zlecenia w systemie
            </h3>
          </div>

          <Link
            href="/dashboard/orders"
            className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            Zobacz wszystkie
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <tbody className="divide-y divide-white/8">
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="p-5 sm:p-6">
                      <p className="font-semibold text-white">
                        {order.examTemplate?.title || "Usunięty pakiet"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.client.email}
                      </p>
                    </td>

                    <td className="p-5 sm:p-6 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="p-5 sm:p-6">{getStatusBadge(order.status)}</td>

                    <td className="p-5 text-right sm:p-6">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
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
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">
              Brak nowych zdarzeń do wyświetlenia
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Gdy pojawią się nowe zlecenia, zobaczysz je właśnie tutaj.
            </p>
          </div>
        )}
      </div>
    </>
  );
}