"use client";

import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  createdAt: string;
  examTemplate: {
    title: string;
  } | null;
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const session = await getSession();
      // @ts-ignore
      const clientId = session?.user?.id;

      if (!clientId) return;

      const res = await fetch(`/api/client-orders?clientId=${clientId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Błąd pobierania historii:", error);
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return (
          <span className="inline-flex rounded-full border border-yellow-300/15 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Wysłano zapotrzebowanie
          </span>
        );
      case "TEST_READY":
        return (
          <span className="inline-flex rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
            Testy do pobrania
          </span>
        );
      case "SCANS_UPLOADED":
        return (
          <span className="inline-flex rounded-full border border-purple-300/15 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
            Weryfikacja skanów
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Certyfikaty gotowe
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
            Nieznany status
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
            Ładowanie Twoich zleceń...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie historii zamówień
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Orders & Certificates
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Moje certyfikaty i zlecenia
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Historia wszystkich Twoich zamówień na platformie wraz ze statusem
            realizacji i dostępem do dalszych działań.
          </p>
        </div>

        <Link
          href="/panel/new-order"
          className="inline-flex items-center justify-center rounded-[20px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
        >
          + Nowe zlecenie
        </Link>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        {orders.length === 0 ? (
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
                  strokeWidth="1.8"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-white">
              Brak historii zleceń
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Nie masz jeszcze żadnych aktywnych zamówień na egzaminy.
            </p>

            <div className="mt-6">
              <Link
                href="/panel/new-order"
                className="inline-flex items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                Rozpocznij pierwsze zlecenie
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03] text-left text-sm text-slate-500">
                  <th className="p-5 font-medium">Rodzaj egzaminu</th>
                  <th className="p-5 font-medium">Data zlecenia</th>
                  <th className="p-5 font-medium">Status postępu</th>
                  <th className="p-5 font-medium text-right">Akcje</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/8">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="p-5">
                      <div>
                        <p className="font-semibold text-white">
                          {order.examTemplate?.title ||
                            "Usunięty pakiet egzaminacyjny"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          ID: {order.id.split("-")[0]}
                        </p>
                      </div>
                    </td>

                    <td className="p-5 text-sm font-medium text-slate-400">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="p-5">{getStatusBadge(order.status)}</td>

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
        )}
      </div>
    </div>
  );
}