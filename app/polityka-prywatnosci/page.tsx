import React from "react";
import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
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
                  Polityka Prywatności
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
                1. Kto jest administratorem Twoich danych?
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Administratorem Twoich danych osobowych (jako przedstawiciela
                  Ośrodka Szkoleniowego) jest [NAZWA TWOJEJ FIRMY] z siedzibą w
                  [MIASTO], [ADRES], NIP: [TWÓJ NIP].
                </p>
                <p>
                  Możesz się z nami skontaktować pod adresem e-mail:
                  [TWÓJ EMAIL].
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                2. Jakie dane przetwarzamy i w jakim celu?
              </h2>
              <ul className="space-y-3 text-sm leading-7 text-slate-300">
                <li>
                  <strong className="text-white">
                    Dane rozliczeniowe i kontaktowe Ośrodka:
                  </strong>{" "}
                  nazwa firmy, NIP, adres, e-mail, telefon. Przetwarzamy je w celu
                  realizacji umowy, wystawiania faktur oraz kontaktu technicznego
                  (podstawa prawna: art. 6 ust. 1 lit. b i c RODO).
                </li>
                <li>
                  <strong className="text-white">
                    Dane logowania (e-mail, zaszyfrowane hasło):
                  </strong>{" "}
                  w celu umożliwienia dostępu do bezpiecznego panelu klienta.
                </li>
                <li>
                  <strong className="text-white">Dane kursantów:</strong> w stosunku
                  do danych kursantów wprowadzanych przez Ośrodek, nie jesteśmy ich
                  Administratorem. Pełnimy wyłącznie rolę podmiotu przetwarzającego
                  (Procesora) na podstawie Umowy Powierzenia Przetwarzania Danych
                  zawartej w Regulaminie.
                </li>
              </ul>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                3. Odbiorcy danych
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Twoje dane mogą być przekazywane wyłącznie zaufanym podmiotom
                  wspierającym nasze usługi technologiczne:
                </p>
                <ul className="space-y-3">
                  <li>
                    Dostawcom hostingu i baz danych (np. serwery chmurowe).
                  </li>
                  <li>
                    Dostawcom usług sztucznej inteligencji (np. OpenAI) wyłącznie
                    w trybie API, które nie wykorzystuje przesyłanych skanów do
                    trenowania modeli publicznych.
                  </li>
                  <li>Biuru rachunkowemu (w zakresie danych na fakturach).</li>
                </ul>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                4. Pliki Cookies (Ciasteczka)
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>Nasza platforma używa niezbędnych plików cookies w celu:</p>
                <ul className="space-y-3">
                  <li>Utrzymania sesji logowania po uwierzytelnieniu w systemie.</li>
                  <li>Zapewnienia prawidłowego działania funkcji bezpieczeństwa.</li>
                </ul>
                <p>
                  Są to ciasteczka sesyjne i techniczne, niewykorzystywane do
                  śledzenia w celach marketingowych.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                5. Twoje prawa
              </h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <p>Zgodnie z RODO przysługuje Ci prawo do:</p>
                <ul className="space-y-3">
                  <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
                  <li>
                    Sprostowania (poprawiania) swoich danych (np. poprzez edycję
                    profilu w panelu).
                  </li>
                  <li>Usunięcia danych (tzw. prawo do bycia zapomnianym).</li>
                  <li>Ograniczenia przetwarzania danych.</li>
                  <li>
                    Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
                    (PUODO).
                  </li>
                </ul>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                6. Czas przechowywania danych
              </h2>
              <p className="text-sm leading-7 text-slate-300">
                Twoje dane jako Ośrodka Szkoleniowego przechowujemy przez cały
                okres posiadania aktywnego konta na Platformie, a po jego usunięciu
                – jedynie przez czas wymagany przez przepisy prawa podatkowego i
                księgowego (zazwyczaj 5 lat od końca roku kalendarzowego, w którym
                wystawiono fakturę).
              </p>
            </section>
          </div>

          <div className="border-t border-white/10 px-6 py-8 text-center sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 px-8 py-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/15"
            >
              Wróć do strony głównej
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}