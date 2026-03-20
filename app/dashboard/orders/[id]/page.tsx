"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

type Document = { id: string; fileName: string; fileUrl: string; createdAt: string; };

type Participant = { 
  id: string; 
  firstName: string; 
  lastName: string; 
  birthDate: string; 
  birthPlace: string; 
  certificateUrl: string | null; 
  score: number | null; 
  maxScore: number | null; 
  testFinished: boolean; 
  scannedTestUrl: string | null;
};

type OrderDetails = {
  id: string;
  status: string;
  invoiceUrl: string | null;
  generatedTestUrl: string | null;
  createdAt: string;
  client: { email: string };
  examTemplate: { title: string; description: string } | null;
  documents: Document[];
  participants: Participant[];
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingTest, setIsUploadingTest] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/admin-orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setStatus(data.status);
      }
    } catch (error) { console.error("Błąd pobierania:", error); } finally { setIsLoading(false); }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      if (res.ok) { alert("Status zlecenia zaktualizowany!"); fetchOrderDetails(); }
    } catch (error) { alert("Błąd podczas aktualizacji."); } finally { setIsSaving(false); }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingInvoice(true);
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `faktura-${orderId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
      
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceUrl: publicUrlData.publicUrl })
      });
      if (res.ok) { alert("Faktura wgrana!"); fetchOrderDetails(); }
    } catch (error) { alert("Błąd wgrywania faktury."); } finally { setIsUploadingInvoice(false); }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTest(true);
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `arkusz-${orderId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
      
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ generatedTestUrl: publicUrlData.publicUrl })
      });
      if (res.ok) { alert("Arkusze egzaminacyjne udostępnione!"); fetchOrderDetails(); }
    } catch (error) { alert("Błąd wgrywania arkuszy."); } finally { setIsUploadingTest(false); }
  };

  const triggerCertUpload = (participantId: string) => {
    setActiveParticipantId(participantId);
    certInputRef.current?.click();
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeParticipantId) return;
    setIsUploadingCert(true);
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `certyfikat-${activeParticipantId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
      
      const res = await fetch(`/api/participants/${activeParticipantId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certificateUrl: publicUrlData.publicUrl })
      });
      if (res.ok) { alert("Certyfikat przypisany do osoby!"); fetchOrderDetails(); }
    } catch (error) { alert("Błąd wgrywania certyfikatu."); } finally { setIsUploadingCert(false); setActiveParticipantId(null); }
  };

  // -------------------------------------------------------------------------
  // EKSPORT DANYCH DO PLIKU CSV (EXCEL) Z POLSKIMI ZNAKAMI
  // -------------------------------------------------------------------------
  const exportToCSV = () => {
    if (!order || !order.participants || order.participants.length === 0) {
      alert("Brak danych uczestników do wyeksportowania.");
      return;
    }

    const headers = ["Imię", "Nazwisko", "Data Urodzenia", "Miejsce Urodzenia", "Zdobyte Punkty", "Maks. Punkty", "Procent", "Wynik Walidacji", "Status Testu"];
    
    const rows = order.participants.map(p => {
      const proc = p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
      const wynik = p.testFinished ? (proc >= 51 ? "Pozytywny" : "Negatywny") : "Brak danych";
      const status = p.testFinished ? "Zakończony" : "Oczekuje";
      
      return [
        p.firstName,
        p.lastName,
        p.birthDate,
        p.birthPlace || "-",
        p.score !== null ? p.score : "-",
        p.maxScore !== null ? p.maxScore : "-",
        p.testFinished ? `${proc}%` : "-",
        wynik,
        status
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const shortId = order.id.split('-')[0].toUpperCase();
    link.setAttribute("download", `Zlecenie_CVZIU${shortId}_Raport.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------------------
  // PERFEKCYJNY SILNIK NAKŁADAJĄCY TEKST NA PLIKI PNG Z CZCIONKĄ TIMES NEW ROMAN
  // -------------------------------------------------------------------------
  const generateOfficialDocuments = () => {
    if (!order || !order.participants || order.participants.length === 0) {
      alert("Brak kursantów do wygenerowania dokumentów.");
      return;
    }

    // === TUTAJ WKLEJ LINKI DO SWOICH PLIKÓW PUSTYCH TŁA Z SUPABASE ===
   const bgProtocolUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/3.png"; // Plik 3.png (Protokół)
    const bgCertFrontUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/1.png"; // Plik 1.png (Awers Certyfikatu)
    const bgCertBackUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/2.png";  // Plik 2.png (Rewers Certyfikatu)
    // =======================================================

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Zezwól na wyskakujące okienka, aby wygenerować dokumenty.");
      return;
    }

    const dzisiaj = new Date().toLocaleDateString('pl-PL');
    const shortId = order.id.split('-')[0].toUpperCase();
    const courseName = order.examTemplate?.title || "Szkolenie Zawodowe";
    
    const ocenieni = order.participants.filter(p => p.testFinished && p.maxScore && p.maxScore > 0);
    const zdani = ocenieni.filter(p => p.score && p.maxScore && (p.score / p.maxScore) >= 0.51);

    const efektyUczenia = order.examTemplate?.description 
      ? order.examTemplate.description.split('\n').map(line => line.trim()).filter(line => line.length > 0).map((line, index) => `<div style="margin-bottom: 6px; text-align: justify;">${index + 1}. ${line}</div>`).join('')
      : '<div>1. Brak wprowadzonych efektów uczenia się.</div>';
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <title>Dokumenty - Zlecenie #${shortId}</title>
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif; 
            background: #525659; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #000;
          }
          
          .page { 
            width: 210mm; 
            height: 297mm; 
            background: white; 
            margin: 20px auto; 
            position: relative; 
            box-shadow: 0 0 10px rgba(0,0,0,0.5); 
            page-break-after: always; 
            overflow: hidden;
          }
          .page:last-child { page-break-after: auto; }

          .bg-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            object-fit: cover;
          }

          .text-layer {
            position: absolute;
            z-index: 2;
            color: #000;
          }

          @media print { 
            body { background: white; margin: 0; padding: 0; } 
            .page { margin: 0; box-shadow: none; border: none; } 
          }

          /* ====================================================================
             1. WSPÓŁRZĘDNE DLA PROTOKOŁU (Plik 3.png / Podsumowanie1.pdf)
             ==================================================================== */
          .proto-numer { top: 60mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; }
          .proto-cel { top: 67mm; left: 105mm; transform: translateX(-50%); font-size: 16px; text-align: center; width: 170mm; line-height: 1.4; }
          
          .proto-opis-dnia { top: 82mm; left: 25mm; font-size: 16px; width: 160mm; line-height: 1.4; text-align: left; }
          .proto-kurs { top: 94mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; }
          
          .proto-tytul-listy { top: 106mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; }
          
          .proto-lista { top: 116mm; left: 25mm; width: 160mm; font-size: 16px; line-height: 1.6; }

          /* ====================================================================
             2. WSPÓŁRZĘDNE DLA CERTYFIKATU AWERS (Plik 1.png / Certyfikat1.pdf)
             ==================================================================== */
          .cert-dla { top: 88mm; left: 105mm; transform: translateX(-50%); font-size: 16px; }
          
          .cert-imie-nazwisko { top: 98mm; left: 105mm; transform: translateX(-50%); font-size: 26px; font-weight: bold; width: 190mm; text-align: center; }
          
          .cert-urodzony { top: 110mm; left: 105mm; transform: translateX(-50%); font-size: 16px; width: 190mm; text-align: center; }
          
          .cert-po-odbyciu { top: 130mm; left: 105mm; transform: translateX(-50%); font-size: 16px; }
          
          .cert-kurs { top: 142mm; left: 105mm; transform: translateX(-50%); font-size: 22px; font-weight: bold; width: 180mm; text-align: center; }
          
          .cert-wynik-tekst { top: 166mm; left: 105mm; transform: translateX(-50%); font-size: 16px; }
          .cert-wynik-box { top: 174mm; left: 105mm; transform: translateX(-50%); font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
          
          .cert-kielce-dnia { top: 215mm; left: 25mm; font-size: 16px; }
          .cert-numer-cvziu { top: 240mm; left: 115mm; font-size: 16px; font-weight: bold; }

          /* ====================================================================
             3. WSPÓŁRZĘDNE DLA CERTYFIKATU REWERS (Plik 2.png)
             ==================================================================== */
          .cert-efekty-lista { top: 60mm; left: 25mm; width: 160mm; font-size: 15px; line-height: 1.5; }
          .cert-stopka-rewers { bottom: 15mm; left: 25mm; width: 160mm; font-size: 12px; text-align: left; }
        </style>
      </head>
      <body>
    `;

    // --- 1. STRONA: PROTOKÓŁ ZBIORCZY ---
    htmlContent += `
      <div class="page">
        <img src="${bgProtocolUrl}" class="bg-image" />
        
        <div class="text-layer proto-numer">Protokół nr CVZIU${shortId}</div>
        
        <div class="text-layer proto-cel">
          z przeprowadzenia walidacji (egzaminu) efektów uczenia się<br/>
          w celu potwierdzenia nabycia kwalifikacji
        </div>
        
        <div class="text-layer proto-opis-dnia">
          Dnia ${dzisiaj} przeprowadzono walidację (egzamin) sprawdzającą przyswojenie przez<br/>
          uczestników szkolenia wiedzy z zakresu:
        </div>
        
        <div class="text-layer proto-kurs">${courseName}</div>
        
        <div class="text-layer proto-tytul-listy">Lista obecności oraz wyniki osób egzaminowanych</div>
        
        <div class="text-layer proto-lista">
            ${ocenieni.length > 0 ? ocenieni.map((p, i) => {
              const proc = p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
              const wynik = proc >= 51 ? 'pozytywna' : 'negatywna';
              return `<div style="margin-bottom: 6px;">${i + 1}. ${p.lastName} ${p.firstName} urodzony(a) ${p.birthDate} walidacja ${wynik}</div>`;
            }).join('') : '<div>Brak ocenionych uczestników w tym zleceniu.</div>'}
        </div>
      </div>
    `;

    // --- 2. STRONY: CERTYFIKATY ---
    zdani.forEach((p) => {
      const certId = `CVZIU${shortId}${p.id.substring(0, 4).toUpperCase()}`;
      
      // Awers
      htmlContent += `
        <div class="page">
          <img src="${bgCertFrontUrl}" class="bg-image" />
          
          <div class="text-layer cert-dla">dla</div>
          <div class="text-layer cert-imie-nazwisko">Pan(i) ${p.firstName} ${p.lastName}</div>
          <div class="text-layer cert-urodzony">urodzony(a) w dn. ${p.birthDate} w ${p.birthPlace || '-'}</div>
          
          <div class="text-layer cert-po-odbyciu">po odbyciu kursu pt.:</div>
          <div class="text-layer cert-kurs">"${courseName}"</div>
          
          <div class="text-layer cert-wynik-tekst">w wyniku przeprowadzonej walidacji zdał(a) egzamin</div>
          
          <div class="text-layer cert-wynik-box">
            <span style="font-family: Arial;">☑</span> wynikiem pozytywnym
          </div>
          
          <div class="text-layer cert-kielce-dnia">Kielce, dnia ${dzisiaj}</div>
          <div class="text-layer cert-numer-cvziu">Nr: ${certId}</div>
        </div>
      `;

      // Rewers
      htmlContent += `
        <div class="page">
          <img src="${bgCertBackUrl}" class="bg-image" />
          
          <div class="text-layer cert-efekty-lista">
            ${efektyUczenia}
          </div>
          
          <div class="text-layer cert-stopka-rewers">
            Załącznik do certyfikatu nr: ${certId} | Uczestnik: ${p.firstName} ${p.lastName}
          </div>
        </div>
      `;
    });

    htmlContent += `
        <script>
          window.onload = function() { 
            setTimeout(() => { window.print(); }, 800);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // -------------------------------------------------------------------------
  if (isLoading) return <div className="p-12 text-center text-gray-500 font-medium">Wczytywanie szczegółów zlecenia...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-medium">Nie znaleziono zlecenia.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/orders" className="text-gray-500 hover:text-blue-600 font-medium flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Wróć do listy zleceń
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-50 border-b border-gray-200 p-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Zlecenie #{order.id.split('-')[0]}</p><h1 className="text-2xl font-bold text-gray-900">{order.examTemplate?.title || "Brak nazwy egzaminu"}</h1></div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-center"><p className="text-xs text-gray-500 font-medium mb-1">Złożono</p><p className="text-sm font-bold text-gray-800">{new Date(order.createdAt).toLocaleDateString('pl-PL')}</p></div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dane Ośrodka</h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6"><p className="text-sm text-gray-500 mb-1">Adres e-mail konta</p><p className="font-bold text-gray-900">{order.client.email}</p></div>

            {(order.status === 'CONFIRMED' || order.status === 'TEST_READY' || order.status === 'COMPLETED') && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dokumenty Księgowe</h2>
                {order.invoiceUrl ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                    <div><p className="text-sm font-bold text-green-800">Faktura wgrana</p><a href={order.invoiceUrl} target="_blank" className="text-xs text-green-600 hover:underline">Podgląd pliku</a></div>
                    <button onClick={() => invoiceInputRef.current?.click()} className="text-xs bg-white border border-green-300 px-3 py-1 rounded shadow-sm text-green-700 hover:bg-green-100">Zmień</button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl text-center"><button onClick={() => invoiceInputRef.current?.click()} disabled={isUploadingInvoice} className="text-sm bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">{isUploadingInvoice ? "Wgrywanie..." : "+ Dodaj Fakturę"}</button></div>
                )}
                <input type="file" ref={invoiceInputRef} onChange={handleInvoiceUpload} className="hidden" accept=".pdf,.jpg,.png" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Zarządzanie Statusem</h2>
            <form onSubmit={handleStatusUpdate} className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Obecny etap zlecenia</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 mb-4">
                <option value="NEW">1. Nowe zlecenie (Oczekuje)</option>
                <option value="CONFIRMED">2. Potwierdzenie zlecenia (Klient dodaje osoby)</option>
                <option value="TEST_READY">3. Testy gotowe do pobrania (Klient wgrywa skany)</option>
                <option value="SCANS_UPLOADED">-- Weryfikacja (Klient wgrał skany) --</option>
                <option value="COMPLETED">4. Walidacja zakończona (Certyfikaty)</option>
              </select>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">{isSaving ? "Zapisywanie..." : "Zapisz nowy status"}</button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-white border-b border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Uczestnicy (Wyniki i Certyfikaty)</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block">Osoby: {order.participants.length}</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {order.participants.length > 0 && (
              <button 
                onClick={exportToCSV} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-sm flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Eksport CSV
              </button>
            )}

            {order.participants.some(p => p.testFinished) && (
              <button 
                onClick={generateOfficialDocuments} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-sm flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Drukuj Dokumenty
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <input type="file" ref={certInputRef} onChange={handleCertUpload} className="hidden" accept=".pdf,.jpg,.png" />
          
          {order.participants.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-xl">Klient nie wprowadził jeszcze żadnych uczestników.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="bg-gray-50 text-gray-600 border-b border-gray-200"><th className="p-3 font-semibold">Imię i Nazwisko</th><th className="p-3 font-semibold text-center">Wynik Egzaminu</th><th className="p-3 font-semibold text-right">Akcje / Ręczny Certyfikat</th></tr></thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {order.participants.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">
                        {p.firstName} {p.lastName}
                        {p.scannedTestUrl && (
                          <div className="mt-1">
                            <a href={p.scannedTestUrl} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              Podgląd Kartki (Z weryfikacji)
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {p.testFinished ? (
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${p.score && p.maxScore && (p.score / p.maxScore >= 0.51) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.score}/{p.maxScore} pkt
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Oczekuje</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {p.certificateUrl ? (
                          <div className="flex items-center justify-end space-x-2"><span className="text-green-600 font-bold text-xs">Wgrany Zewnętrzny</span><a href={p.certificateUrl} target="_blank" className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-gray-700">Podgląd</a><button onClick={() => triggerCertUpload(p.id)} className="text-xs text-blue-600 hover:underline">Zmień</button></div>
                        ) : (
                          <button onClick={() => triggerCertUpload(p.id)} disabled={isUploadingCert} className="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition-colors">{isUploadingCert && activeParticipantId === p.id ? "Wgrywanie..." : "+ Wgraj plik (opcjonalnie)"}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                <strong>Instrukcja edycji PDF:</strong> Wgraj swoje puste projekty (z Canvy) jako pliki PNG do Supabase. Skopiuj linki do plików i podmień je w zmiennych <code>bgProtocolUrl</code>, <code>bgCertFrontUrl</code> i <code>bgCertBackUrl</code> w kodzie pliku <code>page.tsx</code>. Dokumenty wygenerują się klasyczną czcionką Times New Roman.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Wgrane dokumenty zbiorcze od klienta</h2>
          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">Plików: {order.documents.length}</span>
        </div>
        <div className="p-6">
          {order.documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">Klient nie wgrał jeszcze żadnych plików.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow bg-gray-50">
                  <div className="truncate pr-4">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.fileName}</p>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">Otwórz</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}