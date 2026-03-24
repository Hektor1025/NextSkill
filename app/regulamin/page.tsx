import React from "react";
import Link from "next/link";

export default function RegulaminPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <div className="mb-8 pb-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Regulamin Serwisu i UPPDO</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-4 py-2 rounded-lg transition-colors">
            Powrót
          </Link>
        </div>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">§ 1. Postanowienia ogólne</h2>
            <p>1. Niniejszy Regulamin określa zasady korzystania z Platformy Certyfikacyjnej dostępnej pod adresem internetowym [TWOJA_DOMENA].</p>
            <p>2. Operatorem platformy i Usługodawcą jest [NAZWA TWOJEJ FIRMY] z siedzibą w [MIASTO], [ADRES], NIP: [TWÓJ NIP].</p>
            <p>3. Platforma przeznaczona jest wyłącznie dla podmiotów biznesowych (B2B), w szczególności Ośrodków Szkoleniowych, w celu przeprowadzania i zarządzania walidacją efektów uczenia się.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">§ 2. Świadczenie usług</h2>
            <p>1. Usługodawca udostępnia infrastrukturę informatyczną umożliwiającą m.in. generowanie testów, ręczne lub zautomatyzowane ocenianie egzaminów oraz generowanie dokumentów certyfikacyjnych.</p>
            <p>2. Usługodawca dokłada wszelkich starań, aby platforma działała bezawaryjnie, jednak zastrzega sobie prawo do przerw technicznych niezbędnych do konserwacji systemu.</p>
            <p>3. Użytkownik ponosi pełną odpowiedzialność za treść danych wprowadzanych do systemu, w tym poprawność danych swoich kursantów.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">§ 3. Umowa Powierzenia Przetwarzania Danych Osobowych (UPPDO)</h2>
            <p>1. W ramach korzystania z platformy, Użytkownik (Ośrodek Szkoleniowy) jako Administrator Danych Osobowych swoich kursantów, powierza Usługodawcy (Procesorowi) przetwarzanie tych danych.</p>
            <p>2. Zakres powierzonych danych obejmuje: imię, nazwisko, datę urodzenia, miejsce urodzenia oraz wyniki egzaminów.</p>
            <p>3. Przetwarzanie odbywa się wyłącznie w celu technicznej realizacji usługi (wygenerowanie egzaminu, protokołu oraz certyfikatu).</p>
            <p>4. Usługodawca zobowiązuje się do wdrożenia odpowiednich środków technicznych i organizacyjnych zapewniających bezpieczeństwo powierzonych danych (zgodnie z art. 32 RODO).</p>
            <p>5. Usługodawca nie udostępnia danych kursantów podmiotom trzecim bez zgody Ośrodka Szkoleniowego, z wyłączeniem organów państwowych uprawnionych na podstawie przepisów prawa.</p>
            <p>6. Po zakończeniu współpracy i usunięciu konta Ośrodka Szkoleniowego, Usługodawca trwale usuwa wszystkie powierzone dane osobowe kursantów.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">§ 4. Płatności i rozliczenia</h2>
            <p>1. Korzystanie z systemu jest płatne zgodnie z aktualnym cennikiem lub indywidualnymi ustaleniami między stronami.</p>
            <p>2. Rozliczenia odbywają się na podstawie faktur VAT wystawianych przez Usługodawcę.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">§ 5. Postanowienia końcowe</h2>
            <p>1. Regulamin wchodzi w życie z dniem [DATA].</p>
            <p>2. Usługodawca zastrzega sobie prawo do zmiany Regulaminu, o czym poinformuje Użytkowników z odpowiednim wyprzedzeniem.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md">
            Rozumiem i akceptuję - Wróć
          </Link>
        </div>
      </div>
    </div>
  );
}