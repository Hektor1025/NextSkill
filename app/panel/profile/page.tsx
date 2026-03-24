"use client";

import React, { useState, useEffect } from "react";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");
  
  const [formData, setFormData] = useState({
    companyName: "",
    nip: "",
    address: "",
    contactPerson: "",
    phone: "",
    newPassword: "" // Dodany stan dla nowego hasła
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const initProfile = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const session = await sessionRes.json();
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          fetchProfile(session.user.email);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Błąd sesji:", error);
        setIsLoading(false);
      }
    };
    
    initProfile();
  }, []);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          companyName: data.companyName || "",
          nip: data.nip || "",
          address: data.address || "",
          contactPerson: data.contactPerson || "",
          phone: data.phone || "",
          newPassword: "" // Resetujemy pole hasła przy ładowaniu
        });
      }
    } catch (error) {
      console.error("Błąd pobierania profilu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail, 
          ...formData 
        })
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Dane profilu zostały pomyślnie zaktualizowane." });
        setFormData({ ...formData, newPassword: "" }); // Czyścimy pole hasła po udanym zapisie
      } else {
        setMessage({ type: "error", text: "Wystąpił błąd podczas zapisywania." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Wystąpił błąd połączenia z serwerem." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 font-medium">Ładowanie danych profilu...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mój Profil (Dane Ośrodka)</h1>
        <p className="text-slate-500 mt-1">Aktualizuj swoje dane. Będą one używane do wystawiania faktur i na certyfikatach.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Konto E-mail powiązane z tym Ośrodkiem:</p>
            <p className="text-xl font-bold text-slate-800">{userEmail}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 font-medium text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Pełna nazwa firmy / Ośrodka</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Numer NIP</label>
              <input type="text" name="nip" value={formData.nip} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-mono" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Pełny adres (Ulica, Kod pocztowy, Miasto)</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>

            <div className="border-t border-slate-100 md:col-span-2 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Osoba kontaktowa</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="np. Jan Kowalski" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telefon kontaktowy</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="+48..." />
              </div>
            </div>
          </div>

          {/* NOWOŚĆ: Sekcja Bezpieczeństwa - Zmiana hasła przez Klienta */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Bezpieczeństwo
            </h2>
            <p className="text-sm text-slate-500 mb-4">Jeśli chcesz zmienić hasło do swojego konta, wpisz nowe poniżej. W przeciwnym razie pozostaw to pole puste.</p>
            <div className="max-w-md">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nowe hasło</label>
              <input 
                type="text" 
                name="newPassword" 
                placeholder="Wpisz nowe hasło..." 
                value={formData.newPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md disabled:opacity-50">
              {isSaving ? "Zapisywanie zmian..." : "Zapisz zmiany w profilu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}