"use client";

import React, { useState, useEffect } from "react";
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
    switch(status) {
      case 'NEW': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">1. Nowe</span>;
      case 'CONFIRMED': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">2. Osoby</span>;
      case 'TEST_READY': return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">3. Testy</span>;
      case 'SCANS_UPLOADED': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">Skany wgrane</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">4. Gotowe</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">Nieznany</span>;
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500 font-medium animate-pulse">Wczytywanie statystyk platformy...</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Witaj na swoim pulpicie!</h1>
        <p className="text-gray-500 mt-1">Oto podsumowanie tego, co dzieje się obecnie na platformie.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full z-0"></div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Nowe zlecenia</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-gray-900">{stats?.newOrdersCount || 0}</p>
              {stats?.newOrdersCount ? <span className="text-yellow-600 text-sm font-bold mb-1">Wymaga uwagi!</span> : null}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full z-0"></div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Wydane Certyfikaty</h3>
            <p className="text-4xl font-black text-gray-900">{stats?.certificatesCount || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full z-0"></div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Zarejestrowane Ośrodki</h3>
            <p className="text-4xl font-black text-gray-900">{stats?.clientsCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Ostatnia aktywność w systemie (Najnowsze zlecenia)</h2>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 font-bold hover:underline">
            Zobacz wszystkie
          </Link>
        </div>
        
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-gray-900">{order.examTemplate?.title || "Usunięty pakiet"}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.client.email}</p>
                    </td>
                    <td className="p-5 text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 text-right">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors inline-block">
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 font-medium">
            Brak nowych zdarzeń do wyświetlenia.
          </div>
        )}
      </div>
    </>
  );
}