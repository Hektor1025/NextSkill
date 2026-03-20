"use client";

import React, { useState, useEffect } from "react";
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
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">Wysłano zapotrzebowanie</span>;
      case 'TEST_READY':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">Testy do pobrania</span>;
      case 'SCANS_UPLOADED':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">Weryfikacja skanów</span>;
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Certyfikaty gotowe</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Nieznany status</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moje Certyfikaty i Zlecenia</h1>
          <p className="text-gray-500 mt-1">Historia wszystkich Twoich zamówień na platformie</p>
        </div>
        <Link 
          href="/panel/new-order"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center"
        >
          + Nowe Zlecenie
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Ładowanie Twoich zleceń...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-200 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Brak historii zleceń</h3>
            <p className="text-gray-500 mb-6">Nie masz jeszcze żadnych aktywnych zamówień na egzaminy.</p>
            <Link 
              href="/panel/new-order"
              className="inline-block bg-blue-50 text-blue-600 font-bold py-2 px-6 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Rozpocznij pierwsze zlecenie
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-5 font-semibold">Rodzaj egzaminu</th>
                  <th className="p-5 font-semibold">Data zlecenia</th>
                  <th className="p-5 font-semibold">Status postępu</th>
                  <th className="p-5 font-semibold text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5">
                      <p className="font-bold text-slate-800">
                        {order.examTemplate?.title || "Usunięty pakiet egzaminacyjny"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">ID: {order.id.split('-')[0]}</p>
                    </td>
                    <td className="p-5 text-slate-600 text-sm font-medium">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 text-right">
                      {/* OŻYWIONY PRZYCISK ZARZĄDZAJ */}
                      <Link 
                        href={`/panel/history/${order.id}`}
                        className="inline-block text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
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