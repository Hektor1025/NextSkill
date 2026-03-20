"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type Order = {
  id: string;
  status: string;
  createdAt: string;
  client: {
    email: string;
  };
  examTemplate: {
    title: string;
  } | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin-orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Błąd pobierania:", error);
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
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 shadow-sm">Nowe zlecenie</span>;
      case 'TEST_READY':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">Testy wgrane</span>;
      case 'SCANS_UPLOADED':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 shadow-sm">Szykowanie certyfikatów</span>;
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200 shadow-sm">Zakończone</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Nieznany status</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Zlecenia i Egzaminy</h1>
        <p className="text-gray-500 mt-1">Zarządzaj wszystkimi zamówieniami od ośrodków szkoleniowych</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Pobieranie bazy zleceń z serwera...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-200 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pusto!</h3>
            <p className="text-gray-500 mb-6">Klienci nie złożyli jeszcze żadnych zamówień na egzaminy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-5 font-semibold">ID / Egzamin</th>
                  <th className="p-5 font-semibold">Klient (Ośrodek)</th>
                  <th className="p-5 font-semibold">Data wpłynięcia</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-gray-900">
                        {order.examTemplate?.title || "Usunięty pakiet"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 uppercase">ID: {order.id.split('-')[0]}</p>
                    </td>
                    <td className="p-5 text-gray-700 font-medium">
                      {order.client.email}
                    </td>
                    <td className="p-5 text-gray-500 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 text-right">
                      {/* Zmiana na Link, który przeniesie nas do dynamicznej strony zlecenia */}
                      <Link 
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-block text-white text-sm font-bold bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-colors shadow-sm transform hover:-translate-y-0.5"
                      >
                        Obsłuż
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