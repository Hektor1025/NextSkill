"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  createdAt: string;
  client: { email: string; companyName?: string };
  examTemplate: { title: string } | null;
  participants?: { id: string }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Błąd pobierania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const shortId = orderId.split("-")[0].toUpperCase();

    if (
      !window.confirm(
        `UWAGA! Czy na pewno chcesz całkowicie usunąć zlecenie #${shortId} z systemu?\n\nSpowoduje to bezpowrotne skasowanie listy kursantów i plików przypisanych do tego zlecenia.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Zlecenie zostało pomyślnie usunięte.");
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Wystąpił błąd podczas usuwania.");
      }
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Wystąpił błąd połączenia z serwerem.");
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
            2. Potwierdzone
          </span>
        );
      case "TEST_READY":
        return (
          <span className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            3. Testy gotowe
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
            4. Zakończone
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Order Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Zarządzanie zleceniami
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Przeglądaj, kontroluj i obsługuj wszystkie zamówienia przesłane przez
            ośrodki szkoleniowe w ramach platformy.
          </p>
        </div>

        <div className="inline-flex self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
          Łącznie: {orders.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        {isLoading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-white">Ładowanie zleceń...</p>
            <p className="mt-2 text-sm text-slate-400">
              Trwa pobieranie danych z systemu
            </p>
          </div>
        ) : orders.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Brak zleceń</h3>
            <p className="mt-2 text-sm text-slate-400">
              Klienci nie złożyli jeszcze żadnych zamówień na egzaminy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="p-5 font-medium">ID</th>
                  <th className="p-5 font-medium">Ośrodek</th>
                  <th className="p-5 font-medium">Szkolenie</th>
                  <th className="p-5 font-medium">Data</th>
                  <th className="p-5 font-medium text-center">Status</th>
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
                      <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-xs font-bold text-slate-300">
                        #{order.id.split("-")[0].toUpperCase()}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/20 to-blue-500/20 text-sm font-bold uppercase text-white">
                          {(order.client?.companyName || order.client.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-white">
                            {order.client?.companyName || "Brak nazwy"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.client.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <p className="max-w-[280px] truncate font-semibold text-slate-200">
                        {order.examTemplate?.title || "Usunięte z bazy"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.participants?.length || 0} kursantów
                      </p>
                    </td>

                    <td className="p-5 text-sm text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                    </td>

                    <td className="p-5 text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                        >
                          Zarządzaj
                        </Link>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                        >
                          Usuń
                        </button>
                      </div>
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