"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // OCHRONIARZ: Sprawdza kto próbuje wejść do tego folderu
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await res.json();
      
      if (!session?.user) {
        router.push("/"); // Brak logowania -> wyrzuć na stronę główną
      } else if (session.user.role !== "ADMIN") {
        window.location.href = "/panel"; // Zalogowany jako klient -> wyrzuć do panelu klienta
      } else {
        setUserEmail(session.user.email); // Jesteś adminem -> wpuść i zapisz maila
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  // Ekran ładowania (żeby przez ułamek sekundy nie pokazywać błędnych danych)
  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-medium text-gray-500">Weryfikacja uprawnień...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Pasek boczny (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">Platforma Certyfikacyjna</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            Pulpit główny
          </Link>
          <Link href="/dashboard/orders" className={`block px-4 py-2 rounded-lg transition-colors ${pathname === '/dashboard/orders' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            Zlecenia / Egzaminy
          </Link>
          <Link href="/dashboard/clients" className={`block px-4 py-2 rounded-lg transition-colors ${pathname === '/dashboard/clients' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            Klienci
          </Link>
          <Link href="/dashboard/exams" className={`block px-4 py-2 rounded-lg transition-colors ${pathname === '/dashboard/exams' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            Pakiety Egzaminów
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors text-left flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Wyloguj się
          </button>
        </div>
      </aside>

      {/* Główna zawartość */}
      <main className="flex-1 flex flex-col">
        {/* Pasek górny (Header) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">Panel Administratora</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Zalogowano jako: <strong>{userEmail}</strong></span>
            {/* Dynamiczne kółko, które pobiera pierwszą literę maila */}
            <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-md uppercase">
              {userEmail.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}