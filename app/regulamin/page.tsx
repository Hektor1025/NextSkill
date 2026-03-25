import React from "react";
import Link from "next/link";

export default function RegulaminPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />
      <div className="pointer-events-none absolute left-[6%] top-[8%] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[10%] top-[14%] h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[8%] left-[35%] h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                  Legal documents
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  Regulamin Serwisu i UPPDO
                </h1>
              </div>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                Powrót
              </Link>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-8 sm:py-10">
            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                § 1. Postanowienia ogólne
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  1. Niniejszy Regulamin określa zasady korzystania z Platformy
                  Certyfikacyjnej dostępnej pod adresem internetowym [TWOJA_DOMENA].
                </p>
                <p>
                  2. Operatorem platformy i Usługodawcą jest [NAZWA TWOJEJ FIRMY]
                  z siedzibą w [MIASTO], [ADRES], NIP: [TWÓJ NIP].
                </p>
                <p>
                  3. Platforma przeznaczona jest wyłącznie dla podmiotów biznesowych
                  (B2B), w szczególności Ośrodków Szkoleniowych, w celu przeprowadzania
                  i zarządzania walidacją efektów uczenia się.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                § 2. Świadczenie usług
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  1. Usługodawca udostępnia infrastrukturę informatyczną umożliwiającą
                  m.in. generowanie testów, ręczne lub zautomatyzowane ocenianie
                  egzaminów oraz generowanie dokumentów certyfikacyjnych.
                </p>
                <p>
                  2. Usługodawca dokłada wszelkich starań, aby platforma działała
                  bezawaryjnie, jednak zastrzega sobie prawo do przerw technicznych
                  niezbędnych do konserwacji systemu.
                </p>
                <p>
                  3. Użytkownik ponosi pełną odpowiedzialność za treść danych
                  wprowadzanych do systemu, w tym poprawność danych swoich kursantów.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                § 3. Umowa Powierzenia Przetwarzania Danych Osobowych (UPPDO)
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  1. W ramach korzystania z platformy, Użytkownik (Ośrodek Szkoleniowy)
                  jako Administrator Danych Osobowych swoich kursantów, powierza
                  Usługodawcy (Procesorowi) przetwarzanie tych danych.
                </p>
                <p>
                  2. Zakres powierzonych danych obejmuje: imię, nazwisko, datę
                  urodzenia, miejsce urodzenia oraz wyniki egzaminów.
                </p>
                <p>
                  3. Przetwarzanie odbywa się wyłącznie w celu technicznej realizacji
                  usługi (wygenerowanie egzaminu, protokołu oraz certyfikatu).
                </p>
                <p>
                  4. Usługodawca zobowiązuje się do wdrożenia odpowiednich środków
                  technicznych i organizacyjnych zapewniających bezpieczeństwo
                  powierzonych danych (zgodnie z art. 32 RODO).
                </p>
                <p>
                  5. Usługodawca nie udostępnia danych kursantów podmiotom trzecim
                  bez zgody Ośrodka Szkoleniowego, z wyłączeniem organów państwowych
                  uprawnionych na podstawie przepisów prawa.
                </p>
                <p>
                  6. Po zakończeniu współpracy i usunięciu konta Ośrodka Szkoleniowego,
                  Usługodawca trwale usuwa wszystkie powierzone dane osobowe kursantów.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                § 4. Płatności i rozliczenia
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  1. Korzystanie z systemu jest płatne zgodnie z aktualnym cennikiem
                  lub indywidualnymi ustaleniami między stronami.
                </p>
                <p>
                  2. Rozliczenia odbywają się na podstawie faktur VAT wystawianych
                  przez Usługodawcę.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                § 5. Postanowienia końcowe
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>1. Regulamin wchodzi w życie z dniem [DATA].</p>
                <p>
                  2. Usługodawca zastrzega sobie prawo do zmiany Regulaminu, o czym
                  poinformuje Użytkowników z odpowiednim wyprzedzeniem.
                </p>
              </div>
            </section>
          </div>

          <div className="border-t border-white/10 px-6 py-8 text-center sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 px-8 py-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/15"
            >
              Rozumiem i akceptuję — wróć
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}