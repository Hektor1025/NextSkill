"use client";

import React, { useState, useEffect } from "react";
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
    const shortId = orderId.split('-')[0].toUpperCase();
    if (!window.confirm(`UWAGA! Czy na pewno chcesz całkowicie usunąć zlecenie #${shortId} z systemu?\n\nSpowoduje to bezpowrotne skasowanie listy kursantów i plików przypisanych do tego zlecenia.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "DELETE"
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
      case 'NEW': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">1. Nowe (Oczekuje)</span>;
      case 'CONFIRMED': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">2. Potwierdzone (Wpisywanie)</span>;
      case 'TEST_READY': return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200">3. Testy gotowe</span>;
      case 'SCANS_UPLOADED': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">Weryfikacja skanów</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">4. Zakończone</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Zarządzanie Zleceniami</h1>
        <p className="text-gray-500 mt-1">Przeglądaj, aktualizuj statusy i sprawdzaj egzaminy przesłane przez Ośrodki.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Ładowanie zleceń...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Brak zleceń</h3>
            <p className="text-gray-500">Klienci nie złożyli jeszcze żadnych zamówień na egzaminy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Ośrodek (Klient)</th>
                  <th className="p-4 font-semibold">Szkolenie</th>
                  <th className="p-4 font-semibold">Data</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        #{order.id.split('-')[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{order.client?.companyName || "Brak nazwy"}</p>
                      <p className="text-xs text-gray-500">{order.client.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800 line-clamp-1 max-w-[250px]">
                        {order.examTemplate?.title || "Usunięte z bazy"}
                      </p>
                      {/* ZABEZPIECZENIE: używamy znaku zapytania przed .length */}
                      <p className="text-xs text-gray-500">{order.participants?.length || 0} kursantów</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link 
                          href={`/dashboard/orders/${order.id}`}
                          className="bg-white border border-gray-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 font-bold py-1.5 px-3 rounded-lg text-sm transition-colors shadow-sm inline-block"
                        >
                          Zarządzaj
                        </Link>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-white border border-gray-300 text-red-600 hover:border-red-400 hover:bg-red-50 font-bold py-1.5 px-3 rounded-lg text-sm transition-colors shadow-sm inline-block"
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