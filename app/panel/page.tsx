"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";

type RecentOrder = {
  id: string;
  status: string;
  createdAt: string;
  examTemplate: { title: string } | null;
};

type ClientStats = {
  totalOrders: number;
  readyCertificates: number;
  activeOrdersCount: number;
  recentOrders: RecentOrder[];
};

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const session = await getSession();
      // @ts-ignore
      const clientId = session?.user?.id;

      if (!clientId) return;

      const res = await fetch(`/api/client-stats?clientId=${clientId}`);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "NEW":
        return "1. Nowe zlecenie";
      case "CONFIRMED":
        return "2. Oczekuje na osoby";
      case "TEST_READY":
        return "3. Testy gotowe";
      case "SCANS_UPLOADED":
        return "Weryfikacja";
      case "COMPLETED":
        return "4. Zakończone";
      default:
        return "Nieznany status";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "border-yellow-300/15 bg-yellow-400/10 text-yellow-200";
      case "CONFIRMED":
        return "border-blue-300/15 bg-blue-400/10 text-blue-200";
      case "TEST_READY":
        return "border-indigo-300/15 bg-indigo-400/10 text-indigo-200";
      case "SCANS_UPLOADED":
        return "border-purple-300/15 bg-purple-400/10 text-purple-200";
      case "COMPLETED":
        return "border-emerald-300/15 bg-emerald-400/10 text-emerald-200";
      default:
        return "border-white/10 bg-white/[0.05] text-slate-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
          <p className="text-lg font-semibold text-white">
            Ładowanie Twojego pulpitu...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie danych ośrodka
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-8 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-cyan-400/10 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
              Client Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Witaj w panelu ośrodka
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-[15px]">
              Zarządzaj zleceniami, pobieraj arkusze egzaminacyjne i odbieraj
              gotowe certyfikaty dla swoich kursantów w jednym miejscu.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/panel/profile"
              className="inline-flex items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.05] px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Edytuj profil
            </Link>

            <Link
              href="/panel/new-order"
              className="inline-flex items-center justify-center rounded-[20px] border border-cyan-300/15 bg-cyan-400/10 px-8 py-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
            >
              + Nowe zlecenie
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-yellow-200/75">
              Zlecenia w toku
            </p>
            <p className="mt-5 text-5xl font-semibold text-white">
              {stats?.activeOrdersCount || 0}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Aktywne procesy oczekujące na dalszą obsługę.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-emerald-200/75">
              Gotowe certyfikaty
            </p>
            <p className="mt-5 text-5xl font-semibold text-emerald-200">
              {stats?.readyCertificates || 0}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Dokumenty gotowe do pobrania przez ośrodek.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/75">
              Zamówienia ogółem
            </p>
            <p className="mt-5 text-5xl font-semibold text-white">
              {stats?.totalOrders || 0}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Łączna liczba zamówień złożonych na platformie.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Recent orders
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Twoje najnowsze zlecenia
            </h2>
          </div>

          <Link
            href="/panel/history"
            className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            Przejdź do pełnej historii
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <tbody className="divide-y divide-white/8">
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="p-5">
                      <div>
                        <p className="font-semibold text-white">
                          {order.examTemplate?.title || "Usunięty pakiet"}
                        </p>
                        <p className="mt-1 text-xs uppercase text-slate-500">
                          ID: {order.id.split("-")[0]}
                        </p>
                      </div>
                    </td>

                    <td className="p-5 text-sm font-medium text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </td>

                    <td className="p-5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      <Link
                        href={`/panel/history/${order.id}`}
                        className="inline-flex items-center rounded-2xl border border-blue-300/15 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                      >
                        Zarządzaj
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-white">
              Nie masz jeszcze żadnych aktywnych zleceń
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Kliknij poniżej, aby złożyć pierwsze zamówienie.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/panel/new-order"
                className="inline-flex items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                Przejdź do nowego zlecenia
              </Link>

              <Link
                href="/panel/profile"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Uzupełnij profil ośrodka
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}