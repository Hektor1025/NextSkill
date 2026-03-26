"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationsCenter from "../../components/notifications/NotificationsCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await res.json();

      if (!session?.user) {
        router.push("/");
      } else if (session.user.role !== "ADMIN") {
        window.location.href = "/panel";
      } else {
        setUserEmail(session.user.email);
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [router]);

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-white/[0.08] text-white border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
        : "text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent"
    }`;
  };

  if (!isAuthorized) {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes pulseSoft {
                0%,100% { opacity: .65; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.04); }
              }
              .loading-orb {
                animation: pulseSoft 2s ease-in-out infinite;
              }
            `,
          }}
        />
        <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] px-10 py-8 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.45)] text-center">
              <div className="loading-orb mx-auto mb-5 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 blur-[1px]" />
              <p className="text-lg font-semibold text-white">
                Weryfikacja uprawnień...
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Trwa sprawdzanie dostępu do panelu administratora
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes driftA {
              0%,100% { transform: translate3d(0,0,0) scale(1); }
              50% { transform: translate3d(14px,-18px,0) scale(1.04); }
            }

            @keyframes driftB {
              0%,100% { transform: translate3d(0,0,0) scale(1); }
              50% { transform: translate3d(-18px,16px,0) scale(0.97); }
            }

            .drift-a { animation: driftA 14s ease-in-out infinite; }
            .drift-b { animation: driftB 16s ease-in-out infinite; }

            .dashboard-grid {
              background-image:
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
              background-size: 42px 42px;
              mask-image: radial-gradient(circle at center, rgba(0,0,0,.98), rgba(0,0,0,.72) 58%, transparent 100%);
              -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,.98), rgba(0,0,0,.72) 58%, transparent 100%);
            }
          `,
        }}
      />

      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />
        <div className="pointer-events-none absolute inset-0 dashboard-grid opacity-60" />
        <div className="pointer-events-none absolute left-[4%] top-[6%] h-[280px] w-[280px] rounded-full bg-blue-500/20 blur-[120px] drift-a" />
        <div className="pointer-events-none absolute right-[7%] top-[10%] h-[240px] w-[240px] rounded-full bg-cyan-400/12 blur-[100px] drift-b" />
        <div className="pointer-events-none absolute bottom-[5%] left-[28%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-[130px] drift-a" />

        <div className="relative z-10 flex min-h-screen">
          <aside className="hidden xl:flex xl:w-[300px] xl:flex-col xl:border-r xl:border-white/10 xl:bg-white/[0.04] xl:backdrop-blur-2xl">
            <div className="border-b border-white/10 px-7 py-7">
              <div className="flex items-center gap-4">
                <img
                  src="/Wechsler.png"
                  alt="Wechsler Logo"
                  className="h-14 w-auto object-contain transform scale-[7.8] origin-left -translate-x-[180px]"
                />
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/70">
                  Panel administratora
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Wechsler Platform
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Zarządzanie walidacją, certyfikacją, klientami i dokumentacją.
                </p>
              </div>
            </div>

            <nav className="flex-1 px-5 py-6 space-y-2">
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                <svg
                  className="h-5 w-5 text-cyan-200/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
                  />
                </svg>
                <span>Pulpit główny</span>
              </Link>

              <Link
                href="/dashboard/orders"
                className={navLinkClass("/dashboard/orders")}
              >
                <svg
                  className="h-5 w-5 text-cyan-200/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9m-6-4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span>Zlecenia / Egzaminy</span>
              </Link>

              <Link
                href="/dashboard/clients"
                className={navLinkClass("/dashboard/clients")}
              >
                <svg
                  className="h-5 w-5 text-cyan-200/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M17 20h5V10H2v10h5m10 0v-4a3 3 0 00-3-3H10a3 3 0 00-3 3v4m10 0H7m8-13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Klienci</span>
              </Link>

              <Link
                href="/dashboard/exams"
                className={navLinkClass("/dashboard/exams")}
              >
                <svg
                  className="h-5 w-5 text-cyan-200/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 6.253v11.494m-5.747-8.62l11.494 5.747M6.253 14.873l11.494-5.746"
                  />
                </svg>
                <span>Pakiety egzaminów</span>
              </Link>
            </nav>

            <div className="border-t border-white/10 p-5">
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Zalogowano jako
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-200">
                  {userEmail}
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Wyloguj się
              </button>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-white/10 bg-white/[0.03] backdrop-blur-2xl">
              <div className="flex h-auto min-h-[88px] flex-col justify-center gap-4 px-5 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                    Wechsler Admin
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">
                    Panel administratora
                  </h1>
                </div>

                <div className="flex items-center gap-4 self-start xl:self-auto">
                  <NotificationsCenter panelBasePath="/dashboard" />

                  <div className="hidden text-right sm:block">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Konto
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {userEmail}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/25 to-blue-500/25 text-base font-bold uppercase text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                    {userEmail.charAt(0)}
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 px-5 py-6 sm:px-8">{children}</div>

            <footer className="border-t border-white/10 bg-white/[0.03] px-5 py-4 text-center text-xs text-slate-500 sm:px-8">
              <Link
                href="/regulamin"
                className="transition hover:text-slate-300 hover:underline"
              >
                Regulamin i UPPDO
              </Link>{" "}
              |{" "}
              <Link
                href="/polityka-prywatnosci"
                className="transition hover:text-slate-300 hover:underline"
              >
                Polityka Prywatności
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}