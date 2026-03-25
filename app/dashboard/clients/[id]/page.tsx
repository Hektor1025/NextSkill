"use client";

import React, { useEffect, useState } from "react";
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

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    nip: "",
    address: "",
    contactPerson: "",
    phone: "",
    newPassword: "",
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
          newPassword: "",
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
          password: formData.newPassword,
        }),
      });

      if (res.ok) {
        alert("Dane Ośrodka zostały zaktualizowane pomyślnie.");
        setFormData({ ...formData, newPassword: "" });
        setIsEditing(false);
        fetchClientDetails();
      } else {
        alert("Wystąpił błąd podczas zapisywania.");
      }
    } catch (error) {
      alert("Błąd połączenia z serwerem.");
    } finally {
      setIsSaving(false);
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
            2. Osoby
          </span>
        );
      case "TEST_READY":
        return (
          <span className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            3. Testy
          </span>
        );
      case "SCANS_UPLOADED":
        return (
          <span className="inline-flex rounded-full border border-purple-300/15 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
            Weryfikacja
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            4. Gotowe
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
            Nieznany
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-white">
            Ładowanie profilu klienta...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie danych organizacji
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 px-10 py-8 text-center backdrop-blur-2xl">
          <p className="text-lg font-semibold text-red-100">
            Nie znaleziono klienta w bazie
          </p>
        </div>
      </div>
    );
  }

  const totalOrders = client.orders.length;
  const totalParticipants = client.orders.reduce(
    (sum, order) => sum + order.participants.length,
    0
  );
  const totalCertificates = client.orders.reduce((sum, order) => {
    return sum + order.participants.filter((p) => p.certificateUrl !== null).length;
  }, 0);

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Wróć do listy klientów
        </Link>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          {isEditing ? "Anuluj edycję" : "Zmień dane / Hasło"}
        </button>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-cyan-300/20 to-blue-500/20 text-3xl font-bold uppercase text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                {client.email.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                  Client profile
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white">
                  {client.companyName || "Brak nazwy ośrodka"}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {client.email} | Zarejestrowano:{" "}
                  {new Date(client.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-b border-white/10 bg-white/[0.03] md:grid-cols-3">
          <div className="border-b border-white/8 p-6 text-center md:border-b-0 md:border-r md:border-white/8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Złożone zlecenia
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">{totalOrders}</p>
          </div>

          <div className="border-b border-white/8 p-6 text-center md:border-b-0 md:border-r md:border-white/8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Zgłoszone osoby
            </p>
            <p className="mt-3 text-4xl font-semibold text-cyan-200">
              {totalParticipants}
            </p>
          </div>

          <div className="p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Wydane certyfikaty
            </p>
            <p className="mt-3 text-4xl font-semibold text-emerald-200">
              {totalCertificates}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={handleUpdateProfile}
            className="border-b border-white/10 bg-white/[0.03] p-6 sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10">
                <svg
                  className="h-5 w-5 text-cyan-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                  Edit mode
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Edycja danych ośrodka
                </h2>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Nazwa firmy
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  NIP
                </label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleFormChange}
                  className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Adres
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Osoba kontaktowa
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleFormChange}
                  className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-red-400/20 bg-red-500/10 p-5">
              <label className="mb-2 block text-sm font-semibold text-red-100">
                Zmiana hasła
              </label>
              <p className="mb-3 text-xs text-red-100/70">
                Zostaw puste, jeśli nie chcesz zmieniać hasła klienta.
              </p>
              <input
                type="text"
                name="newPassword"
                placeholder="Wpisz nowe hasło dla klienta..."
                value={formData.newPassword}
                onChange={handleFormChange}
                className="h-[56px] w-full rounded-[18px] border border-red-300/20 bg-white/[0.05] px-4 text-white outline-none transition focus:border-red-300/40 focus:ring-4 focus:ring-red-300/10"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-70"
              >
                {isSaving ? "Zapisywanie..." : "Zapisz poprawki"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-5 border-b border-white/10 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Nazwa firmy
              </span>
              <span className="mt-2 block text-sm font-medium text-white">
                {client.companyName || "Brak"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
                NIP
              </span>
              <span className="mt-2 block text-sm font-medium text-white">
                {client.nip || "Brak"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Adres
              </span>
              <span className="mt-2 block text-sm font-medium text-white">
                {client.address || "Brak"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Osoba kontaktowa
              </span>
              <span className="mt-2 block text-sm font-medium text-white">
                {client.contactPerson || "Brak"}{" "}
                <span className="text-slate-400">
                  ({client.phone || "brak telefonu"})
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="mb-6 border-b border-white/10 pb-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Order history
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Historia zamówień ośrodka
            </h2>
          </div>

          {client.orders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
              <p className="text-lg font-medium text-white">
                Ten ośrodek nie złożył jeszcze żadnego zlecenia
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Gdy pojawią się zamówienia, będą widoczne tutaj.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[24px] border border-white/8">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.03] text-left text-sm text-slate-500">
                    <th className="p-4 font-medium">Zlecenie</th>
                    <th className="p-4 font-medium">Data wpłynięcia</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 text-center font-medium">Osób zgłoszono</th>
                    <th className="p-4 text-right font-medium">Akcja</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/8">
                  {client.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-white">
                          {order.examTemplate?.title || "Brak nazwy"}
                        </p>
                        <p className="mt-1 text-xs uppercase text-slate-500">
                          ID: {order.id.split("-")[0]}
                        </p>
                      </td>

                      <td className="p-4 text-sm text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>

                      <td className="p-4">{getStatusBadge(order.status)}</td>

                      <td className="p-4 text-center font-medium text-slate-200">
                        {order.participants.length}
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
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
    </div>
  );
}