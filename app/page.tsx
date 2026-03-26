"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
  if (res.error.includes("ACCOUNT_LOCKED")) {
    setError(
      "Konto zostało czasowo zablokowane po wielu błędnych próbach logowania. Spróbuj ponownie za 15 minut lub użyj resetu hasła."
    );
  } else {
    setError("Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.");
  }
  setIsLoading(false);
  return;
}

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/panel");
      }
    } catch (err) {
      setError("Wystąpił krytyczny błąd komunikacji z serwerem.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  router.push("/forgot-password");
};

  if (!isMounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root{
            --bg:#040816;
            --bg2:#08101f;
            --panel:rgba(9,15,29,0.72);
            --panel-strong:rgba(9,14,26,0.86);
            --line:rgba(255,255,255,0.10);
            --line-soft:rgba(255,255,255,0.06);
            --white:#f8fbff;
            --text:#e8efff;
            --muted:#9eb0cf;
            --muted-2:#8191af;
            --blue:#80aaff;
            --cyan:#8ef3ff;
            --violet:#b49cff;
            --emerald:#74f1c3;
            --danger:#ff6d87;
            --shadow:0 40px 120px rgba(0,0,0,0.45);
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            min-height: 100%;
            background:
              radial-gradient(circle at 12% 18%, rgba(77,128,255,0.22), transparent 28%),
              radial-gradient(circle at 86% 12%, rgba(142,243,255,0.14), transparent 22%),
              radial-gradient(circle at 70% 82%, rgba(180,156,255,0.16), transparent 28%),
              linear-gradient(135deg, #02040c 0%, #050b17 28%, #08101d 58%, #03060d 100%);
            color: var(--text);
          }

          body {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px) scale(.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes floatSoft {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }

          @keyframes driftA {
            0%,100% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(14px,-18px,0) scale(1.04); }
          }

          @keyframes driftB {
            0%,100% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(-18px,16px,0) scale(0.97); }
          }

          @keyframes driftC {
            0%,100% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(10px,12px,0) scale(1.02); }
          }

          @keyframes borderRun {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }

          @keyframes shine {
            0% {
              transform: translateX(-180%) skewX(-24deg);
              opacity: 0;
            }
            25% { opacity: .55; }
            100% {
              transform: translateX(250%) skewX(-24deg);
              opacity: 0;
            }
          }

          @keyframes pulseRing {
            0%,100% { box-shadow: 0 0 0 0 rgba(142,243,255,.18); }
            50% { box-shadow: 0 0 0 12px rgba(142,243,255,0); }
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .reveal-1 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .05s forwards; }
          .reveal-2 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .15s forwards; }
          .reveal-3 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .25s forwards; }
          .reveal-4 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .35s forwards; }
          .reveal-5 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .45s forwards; }
          .reveal-6 { opacity: 0; animation: fadeUp .72s cubic-bezier(.16,1,.3,1) .55s forwards; }

          .float-soft { animation: floatSoft 8s ease-in-out infinite; }
          .drift-a { animation: driftA 14s ease-in-out infinite; }
          .drift-b { animation: driftB 16s ease-in-out infinite; }
          .drift-c { animation: driftC 18s ease-in-out infinite; }

          .page-grid {
            background-image:
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: radial-gradient(circle at center, rgba(0,0,0,.98), rgba(0,0,0,.72) 58%, transparent 100%);
            -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,.98), rgba(0,0,0,.72) 58%, transparent 100%);
          }

          .noise {
            background-image: radial-gradient(rgba(255,255,255,0.28) .6px, transparent .6px);
            background-size: 4px 4px;
            opacity: .08;
            mix-blend-mode: soft-light;
          }

          .glass {
            background:
              linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.045));
            border: 1px solid rgba(255,255,255,0.10);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: var(--shadow);
          }

          .glass-strong {
            background:
              linear-gradient(180deg, rgba(8,13,25,0.82), rgba(8,12,22,0.64));
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
            box-shadow: var(--shadow);
          }

          .lux-border {
            position: relative;
            overflow: hidden;
            border-radius: 32px;
          }

          .lux-border::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(
              120deg,
              rgba(255,255,255,0.10),
              rgba(128,170,255,0.50),
              rgba(142,243,255,0.38),
              rgba(180,156,255,0.30),
              rgba(255,255,255,0.08)
            );
            background-size: 220% 220%;
            animation: borderRun 8s linear infinite;
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }

          .title-gradient {
            background: linear-gradient(90deg, #ffffff 0%, #cfe0ff 24%, #8ef3ff 70%, #ffffff 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .eyebrow {
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.045);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          }

          .lux-input {
            width: 100%;
            height: 60px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background:
              linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.03));
            color: var(--white);
            font-size: 15px;
            font-weight: 500;
            outline: none;
            transition: all .24s ease;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
          }

          .lux-input::placeholder {
            color: rgba(214,226,248,0.42);
          }

          .lux-input:focus {
            border-color: rgba(142,243,255,0.45);
            background:
              linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.04));
            box-shadow:
              0 0 0 4px rgba(128,170,255,0.10),
              0 16px 40px rgba(0,0,0,0.16);
          }

          .lux-button {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.14);
            background:
              linear-gradient(135deg, #eef7ff 0%, #b6d1ff 12%, #89adff 34%, #8ef3ff 74%, #f4fdff 100%);
            color: #05101f;
            box-shadow:
              0 18px 44px rgba(74,128,255,0.26),
              inset 0 1px 0 rgba(255,255,255,0.82);
            transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
          }

          .lux-button:hover {
            transform: translateY(-2px);
            filter: brightness(1.03);
            box-shadow:
              0 24px 54px rgba(74,128,255,0.34),
              inset 0 1px 0 rgba(255,255,255,0.86);
          }

          .lux-button:disabled {
            opacity: .75;
            transform: none;
            cursor: not-allowed;
          }

          .lux-button::after {
            content: "";
            position: absolute;
            top: 0;
            left: -35%;
            width: 38%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
            transform: skewX(-24deg);
            animation: shine 3s ease-in-out infinite;
          }

          .metric-card {
            background:
              linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.028));
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
          }

          .progress-track {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.05);
          }

          .spinner {
            width: 20px;
            height: 20px;
            border-radius: 999px;
            border: 2px solid rgba(5,16,31,0.22);
            border-top-color: rgba(5,16,31,0.94);
            animation: spin .8s linear infinite;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-text-fill-color: #f8fbff !important;
            transition: background-color 9999s ease-in-out 0s;
            -webkit-box-shadow: 0 0 0px 1000px #101827 inset !important;
            caret-color: #f8fbff;
          }
        `,
        }}
      />

      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white selection:bg-cyan-300 selection:text-slate-950">
        <div className="pointer-events-none absolute inset-0 page-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 noise" />

        <div className="pointer-events-none absolute left-[6%] top-[5%] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-[120px] drift-a" />
        <div className="pointer-events-none absolute right-[6%] top-[8%] h-[260px] w-[260px] rounded-full bg-cyan-400/14 blur-[100px] drift-b" />
        <div className="pointer-events-none absolute bottom-[-40px] left-[28%] h-[420px] w-[420px] rounded-full bg-violet-500/14 blur-[135px] drift-c" />
        <div className="pointer-events-none absolute bottom-[8%] right-[12%] h-[180px] w-[180px] rounded-full bg-emerald-300/10 blur-[90px] drift-a" />

        <div className="relative z-10 flex min-h-screen w-full">
          <div className="flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:w-[46%] xl:px-12 2xl:px-16">
            <div className="w-full max-w-[580px]">
              <div className="reveal-1 mb-8 flex items-center gap-4">
                <div className="flex items-center justify-center">
                  <img
                    src="/Wechsler.png"
                    alt="Wechsler Logo"
                    className="h-24 w-auto object-contain sm:h-28"
                  />
                </div>
              </div>

              <div className="reveal-2 mb-8">
                <h1 className="max-w-[520px] text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
                  Logowanie do <span className="title-gradient">platformy</span>
                </h1>

                <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-slate-300">
                  Uzyskaj dostęp do panelu certyfikacji, dokumentacji i procesów
                  zarządzania.
                </p>
              </div>

              <div className="reveal-3 lux-border">
                <div className="glass rounded-[32px] p-6 sm:p-8">
                  <div className="mb-8 flex flex-wrap items-center gap-3">
                    <div className="eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200/80">
                      walidacja
                    </div>
                    <div className="eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200/65">
                      certyfikacja
                    </div>
                  </div>

                  {error && (
                    <div className="reveal-4 mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                          <svg
                            className="h-4 w-4 text-red-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-100">
                            Weryfikacja nie powiodła się
                          </p>
                          <p className="mt-1 text-sm leading-6 text-red-100/85">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="reveal-4">
                      <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                        Adres e-mail
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                              d="M16 12H8m0 0l3-3m-3 3l3 3M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"
                            />
                          </svg>
                        </span>

                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="biuro@osrodek.pl"
                          className="lux-input pl-12 pr-4"
                        />
                      </div>
                    </div>

                    <div className="reveal-5">
                      <div className="mb-2.5 flex items-center justify-between gap-4">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                          Hasło
                        </label>

                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-medium text-cyan-200/80 transition hover:text-cyan-100"
                        >
                          Zapomniałeś hasła?
                        </button>
                      </div>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 116 0v2H9z"
                            />
                          </svg>
                        </span>

                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Wpisz swoje hasło"
                          className="lux-input pl-12 pr-14 tracking-[0.10em]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/70 transition hover:text-white"
                          aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                        >
                          {showPassword ? (
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
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.01-2.28 2.77-4.19 4.99-5.37M9.88 9.88a3 3 0 104.24 4.24M6.1 6.1L3 3m18 18-3.11-3.11M9.17 4.68A9.96 9.96 0 0112 5c5 0 9.27 3.11 11 7a11.83 11.83 0 01-4.01 4.87"
                              />
                            </svg>
                          ) : (
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="reveal-5 flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={() => setRememberMe((prev) => !prev)}
                          className="h-4 w-4 rounded border-white/20 bg-white/10 accent-cyan-300"
                        />
                        <span className="text-sm text-slate-300">
                          Zapamiętaj mnie
                        </span>
                      </label>
                    </div>

                    <div className="reveal-6 pt-1">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="lux-button flex h-[60px] w-full items-center justify-center rounded-[18px] px-6 text-[15px] font-bold tracking-[0.10em]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <span className="spinner" />
                            <span>Trwa logowanie...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span>Zaloguj się do panelu</span>
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="reveal-6 mt-8 border-t border-white/8 pt-6 text-center">
                    <p className="text-sm text-slate-300">
                      Nie posiadasz konta?{" "}
                      <Link
                        href="/register"
                        className="font-semibold text-cyan-200 transition hover:text-white"
                      >
                        Zarejestruj się bezpłatnie
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:flex lg:w-[54%] lg:items-center lg:justify-center lg:px-8 xl:px-12 2xl:px-16">
            <div className="relative w-full max-w-[820px]">
              <div className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-sm float-soft" />
              <div className="pointer-events-none absolute right-10 top-[18%] h-20 w-20 rounded-full border border-cyan-300/20 bg-cyan-300/10 float-soft" />
              <div className="pointer-events-none absolute bottom-10 left-[18%] h-16 w-16 rounded-full border border-violet-300/20 bg-violet-300/10 float-soft" />

              <div className="reveal-2 lux-border">
                <div className="glass-strong relative rounded-[36px] p-8 xl:p-10 2xl:p-12">
                  <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/8 via-transparent to-transparent" />
                  <div className="absolute -right-20 top-6 h-56 w-56 rounded-full bg-cyan-300/10 blur-[90px]" />
                  <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

                  <div className="relative z-10">
                    <div className="mb-8 flex items-start justify-between gap-5">
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-100/65">
                          Platforma walidacji i certyfikacji
                        </p>
                        <h2 className="max-w-[560px] text-3xl font-semibold leading-tight xl:text-[42px]">
                          Nowoczesne środowisko do zarządzania egzaminami, {" "}
                          <span className="title-gradient">dokumentacją i procesami certyfikacyjnymi.</span>
                        </h2>
                      </div>

                      
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Status
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="inline-block h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(116,241,195,0.95)]" />
                          <span className="text-base font-semibold text-white/95">
                            System Aktywny
                          </span>
                        </div>
                      </div>

                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Dostęp
                        </p>
                        <p className="mt-3 text-base font-semibold text-white/95">
                          Dostęp oparty na rolach
                        </p>
                      </div>

                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Moduły
                        </p>
                        <p className="mt-3 text-base font-semibold text-white/95">
                          Walidacja / Certyfikacja / Dokumenty
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 xl:p-7">
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                            Panel zarządzania procesem
                          </p>
                          <p className="mt-2 text-xl font-semibold text-white/95">
                            Jedno miejsce do obsługi egzaminów, wyników i dokumentacji.
                          </p>
                        </div>

                        <div className="hidden h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 xl:flex">
                          <svg
                            className="h-8 w-8 text-cyan-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                              d="M9 17v-6m4 6V7m4 10v-4M5 21h14"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="metric-card rounded-2xl p-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-300">Autoryzacja i sesje</span>
                            <span className="font-semibold text-cyan-200">99%</span>
                          </div>
                          <div className="progress-track h-2 rounded-full">
                            <div className="h-2 w-[99%] rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" />
                          </div>
                        </div>

                        <div className="metric-card rounded-2xl p-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-300">Procesy certyfikacji</span>
                            <span className="font-semibold text-cyan-200">94%</span>
                          </div>
                          <div className="progress-track h-2 rounded-full">
                            <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-blue-300 via-cyan-300 to-emerald-300" />
                          </div>
                        </div>

                        <div className="metric-card rounded-2xl p-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-300">Obieg dokumentacji</span>
                            <span className="font-semibold text-cyan-200">96%</span>
                          </div>
                          <div className="progress-track h-2 rounded-full">
                            <div className="h-2 w-[96%] rounded-full bg-gradient-to-r from-violet-300 via-blue-400 to-cyan-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Dostępność systemu
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">99.98%</p>
                      </div>

                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Standard pracy
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">Premium</p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/8 pt-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
                          System stworzony dla organizacji, 
                        </p>
                        <p className="mt-2 max-w-[520px] text-sm leading-6 text-slate-300">
                          które oczekują przejrzystości, bezpieczeństwa i wysokiego standardu obsługi.
                        </p>
                      </div>

                      <div className="hidden xl:block">
                        <span className="eyebrow rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/75">
                          Premium Visual System
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}