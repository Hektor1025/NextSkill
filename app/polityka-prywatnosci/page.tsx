import React from "react";
import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <div className="mb-8 pb-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Polityka Prywatności</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-4 py-2 rounded-lg transition-colors">
            Powrót
          </Link>
        </div>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Kto jest administratorem Twoich danych?</h2>
            <p>Administratorem Twoich danych osobowych (jako przedstawiciela Ośrodka Szkoleniowego) jest [NAZWA TWOJEJ FIRMY] z siedzibą w [MIASTO], [ADRES], NIP: [TWÓJ NIP].</p>
            <p>Możesz się z nami skontaktować pod adresem e-mail: [TWÓJ EMAIL].</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Jakie dane przetwarzamy i w jakim celu?</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Dane rozliczeniowe i kontaktowe Ośrodka:</strong> nazwa firmy, NIP, adres, e-mail, telefon. Przetwarzamy je w celu realizacji umowy, wystawiania faktur oraz kontaktu technicznego (podstawa prawna: art. 6 ust. 1 lit. b i c RODO).</li>
              <li><strong>Dane logowania (e-mail, zaszyfrowane hasło):</strong> w celu umożliwienia dostępu do bezpiecznego panelu klienta.</li>
              <li><strong>Dane kursantów:</strong> w stosunku do danych kursantów wprowadzanych przez Ośrodek, nie jesteśmy ich Administratorem. Pełnimy wyłącznie rolę podmiotu przetwarzającego (Procesora) na podstawie Umowy Powierzenia Przetwarzania Danych zawartej w Regulaminie.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Odbiorcy danych</h2>
            <p>Twoje dane mogą być przekazywane wyłącznie zaufanym podmiotom wspierającym nasze usługi technologiczne:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Dostawcom hostingu i baz danych (np. serwery chmurowe).</li>
              <li>Dostawcom usług sztucznej inteligencji (np. OpenAI) wyłącznie w trybie API, które nie wykorzystuje przesyłanych skanów do trenowania modeli publicznych.</li>
              <li>Biuru rachunkowemu (w zakresie danych na fakturach).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Pliki Cookies (Ciasteczka)</h2>
            <p>Nasza platforma używa niezbędnych plików cookies w celu:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Utrzymania sesji logowania po uwierzytelnieniu w systemie.</li>
              <li>Zapewnienia prawidłowego działania funkcji bezpieczeństwa.</li>
            </ul>
            <p>Są to ciasteczka sesyjne i techniczne, niewykorzystywane do śledzenia w celach marketingowych.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Twoje prawa</h2>
            <p>Zgodnie z RODO przysługuje Ci prawo do:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
              <li>Sprostowania (poprawiania) swoich danych (np. poprzez edycję profilu w panelu).</li>
              <li>Usunięcia danych (tzw. prawo do bycia zapomnianym).</li>
              <li>Ograniczenia przetwarzania danych.</li>
              <li>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Czas przechowywania danych</h2>
            <p>Twoje dane jako Ośrodka Szkoleniowego przechowujemy przez cały okres posiadania aktywnego konta na Platformie, a po jego usunięciu – jedynie przez czas wymagany przez przepisy prawa podatkowego i księgowego (zazwyczaj 5 lat od końca roku kalendarzowego, w którym wystawiono fakturę).</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md">
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}