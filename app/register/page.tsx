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
    marketingConsent: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
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
      setError(
        "Akceptacja Regulaminu i Polityki Prywatności jest wymagana do założenia konta."
      );
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
          marketingConsent: formData.marketingConsent,
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
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root{
              --white:#f8fbff;
              --text:#e8efff;
              --muted:#9eb0cf;
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
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(20px) scale(.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .success-card {
              animation: fadeUp .6s cubic-bezier(.16,1,.3,1) forwards;
              background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.045));
              border: 1px solid rgba(255,255,255,0.10);
              backdrop-filter: blur(24px);
              -webkit-backdrop-filter: blur(24px);
              box-shadow: 0 40px 120px rgba(0,0,0,0.45);
            }

            .page-grid {
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
          <div className="pointer-events-none absolute inset-0 page-grid opacity-60" />
          <div className="pointer-events-none absolute left-[10%] top-[10%] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="pointer-events-none absolute right-[10%] top-[18%] h-[220px] w-[220px] rounded-full bg-cyan-400/14 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[6%] left-[35%] h-[300px] w-[300px] rounded-full bg-violet-500/14 blur-[135px]" />

          <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
            <div className="success-card w-full max-w-xl rounded-[32px] p-8 text-center sm:p-10">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10">
                <svg
                  className="h-10 w-10 text-emerald-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">
                Rejestracja udana
              </h2>

              <p className="mx-auto max-w-lg text-[15px] leading-7 text-slate-300">
                Konto Twojego ośrodka zostało utworzone pomyślnie.
                Za chwilę nastąpi przekierowanie do strony logowania.
              </p>

              <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                Konto aktywne
              </div>
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
          :root{
            --bg:#040816;
            --bg2:#08101f;
            --white:#f8fbff;
            --text:#e8efff;
            --muted:#9eb0cf;
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

          .consent-box {
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            border-radius: 18px;
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
          <div className="flex w-full items-start justify-center px-5 py-8 sm:px-8 lg:w-[56%] xl:px-12 2xl:px-16">
            <div className="w-full max-w-[760px]">
              <div className="reveal-1 mb-8 flex items-center gap-4">
                <div className="flex items-center justify-center">
                  <img
                    src="/Wechsler.jpg"
                    alt="Wechsler Logo"
                    className="h-24 w-auto object-contain sm:h-28"
                  />
                </div>
              </div>

              <div className="reveal-2 mb-8">
                <h1 className="max-w-[620px] text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
                  Rejestracja do <span className="title-gradient">platformy</span>
                </h1>

                <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-slate-300">
                  Utwórz konto organizacji i uzyskaj dostęp do środowiska
                  walidacji, certyfikacji i zarządzania dokumentacją.
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
                    <div className="reveal-4 mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
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
                            Rejestracja nie mogła zostać zakończona
                          </p>
                          <p className="mt-1 text-sm leading-6 text-red-100/85">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="reveal-4">
                      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                        <h3 className="text-lg font-semibold text-white">
                          Dane logowania
                        </h3>
                        <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          etap 1
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        <div>
                          <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                            Adres e-mail
                          </label>
                          <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="biuro@osrodek.pl"
                            className="lux-input px-5"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                              Hasło
                            </label>
                            <div className="relative">
                              <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Wpisz hasło"
                                className="lux-input px-5 pr-14"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword((prev) => !prev)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/70 transition hover:text-white"
                                aria-label={
                                  showPassword ? "Ukryj hasło" : "Pokaż hasło"
                                }
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

                          <div>
                            <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                              Powtórz hasło
                            </label>
                            <div className="relative">
                              <input
                                name="confirmPassword"
                                type={
                                  showConfirmPassword ? "text" : "password"
                                }
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Powtórz hasło"
                                className="lux-input px-5 pr-14"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword((prev) => !prev)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/70 transition hover:text-white"
                                aria-label={
                                  showConfirmPassword
                                    ? "Ukryj hasło"
                                    : "Pokaż hasło"
                                }
                              >
                                {showConfirmPassword ? (
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
                        </div>
                      </div>
                    </div>

                    <div className="reveal-5">
                      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                        <h3 className="text-lg font-semibold text-white">
                          Dane organizacji
                        </h3>
                        <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          etap 2
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        <div>
                          <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                            Pełna nazwa firmy / ośrodka
                          </label>
                          <input
                            name="companyName"
                            type="text"
                            required
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="Wpisz pełną nazwę organizacji"
                            className="lux-input px-5"
                          />
                        </div>

                        <div>
                          <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                            NIP
                          </label>
                          <input
                            name="nip"
                            type="text"
                            required
                            value={formData.nip}
                            onChange={handleChange}
                            placeholder="Wpisz numer NIP"
                            className="lux-input px-5"
                          />
                        </div>

                        <div>
                          <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                            Pełny adres
                          </label>
                          <input
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Ulica, kod pocztowy, miasto"
                            className="lux-input px-5"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                              Osoba kontaktowa
                            </label>
                            <input
                              name="contactPerson"
                              type="text"
                              value={formData.contactPerson}
                              onChange={handleChange}
                              placeholder="Imię i nazwisko"
                              className="lux-input px-5"
                            />
                          </div>

                          <div>
                            <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                              Telefon kontaktowy
                            </label>
                            <input
                              name="phone"
                              type="text"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+48 000 000 000"
                              className="lux-input px-5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="reveal-6">
                      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                        <h3 className="text-lg font-semibold text-white">
                          Zgody i oświadczenia
                        </h3>
                        <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          etap 3
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="consent-box p-4">
                          <div className="flex items-start gap-3">
                            <input
                              id="terms"
                              name="termsAccepted"
                              type="checkbox"
                              checked={formData.termsAccepted}
                              onChange={handleChange}
                              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-cyan-300"
                            />
                            <div className="text-sm leading-6 text-slate-300">
                              <label
                                htmlFor="terms"
                                className="cursor-pointer font-medium text-slate-200"
                              >
                                Akceptuję{" "}
                                <Link
                                  href="/regulamin"
                                  target="_blank"
                                  className="text-cyan-200 transition hover:text-white hover:underline"
                                >
                                  Regulamin
                                </Link>{" "}
                                i{" "}
                                <Link
                                  href="/polityka-prywatnosci"
                                  target="_blank"
                                  className="text-cyan-200 transition hover:text-white hover:underline"
                                >
                                  Politykę Prywatności
                                </Link>{" "}
                                *
                              </label>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                Oświadczam, że zapoznałem/am się z dokumentami
                                oraz zawieram Umowę Powierzenia Przetwarzania
                                Danych Osobowych.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="consent-box p-4">
                          <div className="flex items-start gap-3">
                            <input
                              id="marketing"
                              name="marketingConsent"
                              type="checkbox"
                              checked={formData.marketingConsent}
                              onChange={handleChange}
                              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-cyan-300"
                            />
                            <div className="text-sm leading-6 text-slate-300">
                              <label
                                htmlFor="marketing"
                                className="cursor-pointer font-medium text-slate-200"
                              >
                                Zgoda na informacje handlowe
                              </label>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                Wyrażam zgodę na otrzymywanie informacji o
                                nowościach w systemie na podany adres e-mail.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="reveal-6 pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="lux-button flex h-[60px] w-full items-center justify-center rounded-[18px] px-6 text-[15px] font-bold tracking-[0.10em]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <span className="spinner" />
                            <span>Rejestrowanie...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span>Zarejestruj ośrodek</span>
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
                      Masz już konto?{" "}
                      <Link
                        href="/"
                        className="font-semibold text-cyan-200 transition hover:text-white"
                      >
                        Zaloguj się tutaj
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:flex lg:w-[44%] lg:items-start lg:justify-center lg:px-8 lg:py-10 xl:px-12 2xl:px-16">
            <div className="relative w-full max-w-[700px]">
              <div className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-sm float-soft" />
              <div className="pointer-events-none absolute right-10 top-[18%] h-20 w-20 rounded-full border border-cyan-300/20 bg-cyan-300/10 float-soft" />
              <div className="pointer-events-none absolute bottom-10 left-[18%] h-16 w-16 rounded-full border border-violet-300/20 bg-violet-300/10 float-soft" />

              <div className="reveal-2 lux-border">
                <div className="glass-strong relative rounded-[36px] p-8 xl:p-10">
                  <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/8 via-transparent to-transparent" />
                  <div className="absolute -right-20 top-6 h-56 w-56 rounded-full bg-cyan-300/10 blur-[90px]" />
                  <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

                  <div className="relative z-10">
                    <div className="mb-8">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-100/65">
                        Platforma walidacji i certyfikacji
                      </p>
                      <h2 className="max-w-[520px] text-3xl font-semibold leading-tight xl:text-[40px]">
                        Dołącz do systemu stworzonego do zarządzania egzaminami, {" "}
                        <span className="title-gradient"> dokumentacją i procesami certyfikacyjnymi.</span>
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Rejestracja organizacji
                        </p>
                        <p className="mt-3 text-base font-semibold text-white/95">
                          Dane organizacji i dostęp do platformy
                        </p>
                      </div>

                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Zakres systemu
                        </p>
                        <p className="mt-3 text-base font-semibold text-white/95">
                          Walidacja / Certyfikacja / Obsługa dokumentów
                        </p>
                      </div>

                      <div className="metric-card rounded-2xl p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          Ochrona dostępu
                        </p>
                        <p className="mt-3 text-base font-semibold text-white/95">
                          Bezpieczny panel użytkownika
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                        Korzyści
                      </p>

                      <div className="mt-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-300" />
                          <p className="text-sm leading-6 text-slate-300">
                            Jedno miejsce do prowadzenia całego procesu.
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-300" />
                          <p className="text-sm leading-6 text-slate-300">
                            Przejrzysta organizacja pracy i dokumentów.
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-300" />
                          <p className="text-sm leading-6 text-slate-300">
                            Nowoczesny i uporządkowany interfejs wspierający codzienną pracę.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-white/8 pt-6">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
                        Zaprojektowany z myślą o jakości
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Spójny system dla organizacji, które stawiają na porządek, bezpieczeństwo i profesjonalizm.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="reveal-3 mt-5 flex items-center justify-end gap-3 text-[11px] uppercase tracking-[0.28em] text-slate-500">
                <span>Nowoczesna platforma</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Profesjonalny standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}