"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Participant = {
  id: string;
  certificateUrl: string | null;
};

type Order = {
  id: string;
  status: string;
  createdAt: string;
  examTemplate: { title: string } | null;
  participants: Participant[];
};

type ClientProfile = {
  id: string;
  email: string;
  createdAt: string;
  orders: Order[];
};

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      }
    } catch (error) {
      console.error("Błąd pobierania danych klienta:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">1. Nowe</span>;
      case 'CONFIRMED': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">2. Osoby</span>;
      case 'TEST_READY': return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">3. Testy</span>;
      case 'SCANS_UPLOADED': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">Weryfikacja</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">4. Gotowe</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">Nieznany</span>;
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500 font-medium">Ładowanie profilu klienta...</div>;
  }

  if (!client) {
    return <div className="p-12 text-center text-red-500 font-medium">Nie znaleziono klienta w bazie.</div>;
  }

  // Obliczamy szybkie statystyki dla tego klienta
  const totalOrders = client.orders.length;
  const totalParticipants = client.orders.reduce((sum, order) => sum + order.participants.length, 0);
  const totalCertificates = client.orders.reduce((sum, order) => {
    return sum + order.participants.filter(p => p.certificateUrl !== null).length;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-gray-500 hover:text-blue-600 font-medium flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Wróć do listy klientów
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-800 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
              {client.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.email}</h1>
              <p className="text-slate-400 text-sm mt-1">
                Zarejestrowano: {new Date(client.createdAt).toLocaleDateString('pl-PL')}
              </p>
            </div>
          </div>
        </div>

        {/* Podsumowanie współpracy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50">
          <div className="p-6 text-center border-r border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Złożone zlecenia</p>
            <p className="text-3xl font-black text-gray-900">{totalOrders}</p>
          </div>
          <div className="p-6 text-center border-r border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Zgłoszone osoby</p>
            <p className="text-3xl font-black text-blue-600">{totalParticipants}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Wydane certyfikaty</p>
            <p className="text-3xl font-black text-green-600">{totalCertificates}</p>
          </div>
        </div>

        {/* Tabela historii zleceń tego konkretnego klienta */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
            Historia Zamówień Ośrodka
          </h2>

          {client.orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-xl">
              Ten ośrodek nie złożył jeszcze żadnego zlecenia na platformie.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 text-sm">
                    <th className="p-3 font-semibold">Zlecenie</th>
                    <th className="p-3 font-semibold">Data wpłynięcia</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-center">Osób zgłoszono</th>
                    <th className="p-3 font-semibold text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {client.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{order.examTemplate?.title || "Brak nazwy"}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase">ID: {order.id.split('-')[0]}</p>
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-3 text-center font-medium text-gray-700">
                        {order.participants.length}
                      </td>
                      <td className="p-3 text-right">
                        <Link 
                          href={`/dashboard/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors inline-block"
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
    </div>
  );
}