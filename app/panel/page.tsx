"use client";

import React, { useState, useEffect } from "react";
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
    switch(status) {
      case 'NEW': return "1. Nowe zlecenie";
      case 'CONFIRMED': return "2. Oczekuje na osoby";
      case 'TEST_READY': return "3. Testy gotowe";
      case 'SCANS_UPLOADED': return "Weryfikacja";
      case 'COMPLETED': return "4. Zakończone";
      default: return "Nieznany status";
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Ładowanie Twojego pulpitu...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Powitanie i główny przycisk */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl font-bold mb-2">Witaj w panelu ośrodka!</h1>
          <p className="text-blue-100 max-w-xl">
            Zarządzaj swoimi zleceniami, pobieraj arkusze egzaminacyjne i odbieraj gotowe certyfikaty dla swoich kursantów.
          </p>
        </div>
        <Link 
          href="/panel/new-order" 
          className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-8 rounded-xl transition-transform transform hover:-translate-y-1 shadow-md whitespace-nowrap"
        >
          + Nowe Zlecenie
        </Link>
      </div>

      {/* Kafelki ze statystykami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Zlecenia w toku</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-slate-900">{stats?.activeOrdersCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Gotowe Certyfikaty</h3>
          <p className="text-4xl font-black text-green-600">{stats?.readyCertificates || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Zamówienia ogółem</h3>
          <p className="text-4xl font-black text-slate-900">{stats?.totalOrders || 0}</p>
        </div>
      </div>

      {/* Ostatnie zlecenia */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Twoje najnowsze zlecenia</h2>
          <Link href="/panel/history" className="text-sm text-blue-600 font-bold hover:underline">
            Przejdź do pełnej historii
          </Link>
        </div>
        
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-900">{order.examTemplate?.title || "Usunięty pakiet"}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase">ID: {order.id.split('-')[0]}</p>
                    </td>
                    <td className="p-5 text-slate-500 text-sm font-medium">
                      {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                    </td>
                    <td className="p-5">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <Link href={`/panel/history/${order.id}`} className="inline-block text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                        Zarządzaj
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium mb-4">Nie masz jeszcze żadnych aktywnych zleceń.</p>
            <Link href="/panel/new-order" className="text-blue-600 font-bold hover:underline">
              Kliknij tutaj, aby złożyć pierwsze zamówienie
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}