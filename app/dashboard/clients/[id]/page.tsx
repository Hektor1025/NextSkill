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
  companyName?: string;
  nip?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  orders: Order[];
};

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stany do edycji
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "", nip: "", address: "", contactPerson: "", phone: "", newPassword: ""
  });
  const [isSaving, setIsSaving] = useState(false);

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
        setFormData({
          companyName: data.companyName || "",
          nip: data.nip || "",
          address: data.address || "",
          contactPerson: data.contactPerson || "",
          phone: data.phone || "",
          newPassword: ""
        });
      }
    } catch (error) {
      console.error("Błąd pobierania danych klienta:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          nip: formData.nip,
          address: formData.address,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          password: formData.newPassword
        })
      });
      
      if (res.ok) {
        alert("Dane Ośrodka zostały zaktualizowane pomyślnie.");
        setFormData({...formData, newPassword: ""}); // Czyścimy pole hasła
        setIsEditing(false);
        fetchClientDetails(); // Odśwież widok
      } else {
        alert("Wystąpił błąd podczas zapisywania.");
      }
    } catch(error) {
      alert("Błąd połączenia z serwerem.");
    } finally {
      setIsSaving(false);
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

  const totalOrders = client.orders.length;
  const totalParticipants = client.orders.reduce((sum, order) => sum + order.participants.length, 0);
  const totalCertificates = client.orders.reduce((sum, order) => {
    return sum + order.participants.filter(p => p.certificateUrl !== null).length;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/clients" className="text-gray-500 hover:text-blue-600 font-medium flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Wróć do listy klientów
        </Link>
        <button onClick={() => setIsEditing(!isEditing)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors">
          {isEditing ? "Anuluj edycję" : "Zmień dane / Hasło"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-800 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
              {client.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.companyName || "Brak nazwy ośrodka"}</h1>
              <p className="text-slate-400 text-sm mt-1">{client.email} | Zarejestrowano: {new Date(client.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>
          </div>
        </div>

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

        {/* PANEL EDYCJI DANYCH PRZEZ ADMINA */}
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="p-8 border-b border-gray-100 bg-blue-50/30">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Edycja danych Ośrodka
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nazwa Firmy</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">NIP</label>
                <input type="text" name="nip" value={formData.nip} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Adres</label>
                <input type="text" name="address" value={formData.address} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Osoba kontaktowa</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefon</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
              <label className="block text-sm font-bold text-red-800 mb-1">Zmiana hasła (Zostaw puste, jeśli nie chcesz zmieniać)</label>
              <input type="text" name="newPassword" placeholder="Wpisz nowe hasło dla klienta..." value={formData.newPassword} onChange={handleFormChange} className="w-full px-3 py-2 border border-red-300 rounded-lg outline-none focus:border-red-500 bg-white" />
            </div>

            <div className="flex justify-end gap-2">
              <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                {isSaving ? "Zapisywanie..." : "Zapisz poprawki"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><span className="block text-xs text-gray-500 uppercase font-bold">Nazwa firmy</span><span className="text-sm font-medium">{client.companyName || "Brak"}</span></div>
            <div><span className="block text-xs text-gray-500 uppercase font-bold">NIP</span><span className="text-sm font-medium">{client.nip || "Brak"}</span></div>
            <div><span className="block text-xs text-gray-500 uppercase font-bold">Adres</span><span className="text-sm font-medium">{client.address || "Brak"}</span></div>
            <div><span className="block text-xs text-gray-500 uppercase font-bold">Osoba kontaktowa</span><span className="text-sm font-medium">{client.contactPerson || "Brak"} ({client.phone || "brak telefonu"})</span></div>
          </div>
        )}

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