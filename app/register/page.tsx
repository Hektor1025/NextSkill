"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    nip: "",
    address: "",
    contactPerson: "",
    phone: "",
    termsAccepted: false,
    marketingConsent: false
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    if (!formData.termsAccepted) {
      setError("Akceptacja Regulaminu i Polityki Prywatności jest wymagana do założenia konta.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          nip: formData.nip,
          address: formData.address,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          termsAccepted: formData.termsAccepted,
          marketingConsent: formData.marketingConsent
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas rejestracji.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/"); 
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-2xl shadow-sm border border-green-100 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejestracja udana!</h2>
          <p className="text-gray-600">Konto Twojego Ośrodka zostało utworzone. Za chwilę zostaniesz przekierowany do strony logowania...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Zarejestruj Ośrodek Szkoleniowy
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Lub jeśli masz już konto,{" "}
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
            zaloguj się tutaj
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Dane logowania</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adres e-mail *</label>
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hasło *</label>
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Powtórz hasło *</label>
                    <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Dane Organizacji (do faktury)</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pełna nazwa firmy / Ośrodka *</label>
                  <input name="companyName" type="text" required value={formData.companyName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIP *</label>
                  <input name="nip" type="text" required value={formData.nip} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pełny adres (Ulica, Kod pocztowy, Miasto)</label>
                  <input name="address" type="text" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Osoba kontaktowa</label>
                    <input name="contactPerson" type="text" value={formData.contactPerson} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon kontaktowy</label>
                    <input name="phone" type="text" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* NAPRAWIONE: Dodano klikalne linki z target="_blank" */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start mb-4">
                <div className="flex items-center h-5">
                  <input id="terms" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700 cursor-pointer">
                    Akceptuję <Link href="/regulamin" target="_blank" className="text-blue-600 hover:text-blue-800 hover:underline">Regulamin</Link> i <Link href="/polityka-prywatnosci" target="_blank" className="text-blue-600 hover:text-blue-800 hover:underline">Politykę Prywatności</Link> *
                  </label>
                  <p className="text-gray-500 text-xs mt-1">Oświadczam, że zapoznałem/am się z dokumentami oraz zawieram Umowę Powierzenia Przetwarzania Danych Osobowych (UPPDO).</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="marketing" name="marketingConsent" type="checkbox" checked={formData.marketingConsent} onChange={handleChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="marketing" className="font-medium text-gray-700 cursor-pointer">Zgoda na informacje handlowe (opcjonalnie)</label>
                  <p className="text-gray-500 text-xs mt-1">Wyrażam zgodę na otrzymywanie informacji o nowościach w systemie na podany adres e-mail.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
              >
                {isLoading ? "Rejestrowanie..." : "Zarejestruj Ośrodek"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}