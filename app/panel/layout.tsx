"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ClientPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // OCHRONIARZ KLIENTA
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await res.json();
      
      if (!session?.user) {
        router.push("/");
      } else if (session.user.role !== "CLIENT") {
        window.location.href = "/dashboard"; // Adminie, wracaj do siebie!
      } else {
        setUserEmail(session.user.email);
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-medium text-slate-500">Weryfikacja uprawnień klienta...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-lg font-bold">Strefa Klienta</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/panel" className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/panel' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            Mój pulpit
          </Link>
          <Link href="/panel/new-order" className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/panel/new-order' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            Zamów Egzamin
          </Link>
          <Link href="/panel/history" className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/panel/history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            Moje Certyfikaty
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-2 text-red-400 hover:bg-red-500 hover:text-white font-medium rounded-lg transition-all text-left flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Panel Ośrodka Szkoleniowego</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Zalogowano: <strong>{userEmail}</strong></span>
            {/* Dynamiczne kółko dla klienta */}
            <div className="w-10 h-10 bg-slate-800 rounded-full text-white flex items-center justify-center font-bold shadow-md uppercase">
              {userEmail.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          {children}
        </div>
        {/* NOWOŚĆ: Stopka prawna */}
        <footer className="p-4 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto bg-white">
          <Link href="/regulamin" className="hover:underline">Regulamin i UPPDO</Link> | <Link href="/polityka-prywatnosci" className="hover:underline">Polityka Prywatności</Link>
        </footer>
      </main>
    </div>
  );
}