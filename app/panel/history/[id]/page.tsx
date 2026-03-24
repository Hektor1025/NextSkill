"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

type Participant = { 
  id: string; firstName: string; lastName: string; birthDate: string; birthPlace: string; 
  certificateUrl: string | null; score: number | null; maxScore: number | null; 
  testFinished: boolean; scannedTestUrl: string | null;
};

type Question = { id: string; content: string; options: string[]; };

type OrderDetails = {
  id: string; status: string; invoiceUrl: string | null; generatedTestUrl: string | null; createdAt: string;
  examTemplate: { id: string; title: string; description: string; learningOutcomes?: string | null; questions?: Question[] } | null;
  participants: Participant[];
};

export default function ClientOrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [activeScanParticipantId, setActiveScanParticipantId] = useState<string | null>(null);
  const participantScanInputRef = useRef<HTMLInputElement>(null);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null); // NOWOŚĆ: Referencja do pliku CSV

  useEffect(() => { if (orderId) fetchOrderDetails(); }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/client-orders/${orderId}`);
      if (res.ok) setOrder(await res.json());
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingParticipant(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, firstName, lastName, birthDate, birthPlace })
      });
      if (res.ok) { setFirstName(""); setLastName(""); setBirthDate(""); setBirthPlace(""); fetchOrderDetails(); } 
      else { alert("Błąd podczas dodawania."); }
    } catch (error) { console.error(error); } finally { setIsAddingParticipant(false); }
  };

  // --- NOWOŚĆ: MASOWY IMPORT Z CSV ---
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAddingParticipant(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const newParticipants = [];
        
        // Pętla od i=1 (pomijamy pierwszy wiersz, bo to nagłówki typu Imię;Nazwisko;Data;Miejsce)
        for (let i = 1; i < lines.length; i++) {
          const [fName, lName, bDate, bPlace] = lines[i].split(';').map(s => s.trim().replace(/"/g, ''));
          // Zabezpieczenie: dodajemy tylko wiersze, gdzie jest imie nazwisko i data
          if (fName && lName && bDate) {
             newParticipants.push({ orderId, firstName: fName, lastName: lName, birthDate: bDate, birthPlace: bPlace || "-" });
          }
        }
        
        if (newParticipants.length > 0) {
           const res = await fetch("/api/participants", {
             method: "POST", 
             headers: { "Content-Type": "application/json" }, 
             body: JSON.stringify({ participants: newParticipants })
           });
           
           if (res.ok) { 
             alert(`Sukces! Zaimportowano ${newParticipants.length} kursantów z pliku.`); 
             fetchOrderDetails(); 
           } else { 
             alert("Wystąpił błąd podczas zapisywania masowego importu w bazie."); 
           }
        } else {
           alert("Nie znaleziono poprawnych danych w pliku. Upewnij się, że rozdzieliłeś dane średnikiem (;) w formacie: Imię;Nazwisko;Data urodzenia;Miejsce");
        }
      } catch(e) { 
        alert("Błąd przetwarzania pliku CSV."); 
      } finally { 
        setIsAddingParticipant(false); 
        if (csvInputRef.current) csvInputRef.current.value = ""; 
      }
    };
    reader.readAsText(file, 'UTF-8'); // Wczytuje polskie znaki z CSV
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę osobę?")) return;
    try {
      const res = await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
      if (res.ok) fetchOrderDetails();
    } catch (error) { console.error(error); }
  };

  const triggerParticipantScan = (participantId: string) => {
    setActiveScanParticipantId(participantId);
    participantScanInputRef.current?.click();
  };

  const handleParticipantScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeScanParticipantId || !order?.examTemplate?.id) return;
    setIsUploading(true);
    try {
      let blobsToUpload: Blob[] = [];
      if (file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        const majorVersion = parseInt(pdfjsLib.version.split('.')[0], 10);
        const workerExt = majorVersion >= 4 ? 'mjs' : 'js';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${workerExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); 
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.height = viewport.height; canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
            if (blob) blobsToUpload.push(blob);
          }
        }
      } else { blobsToUpload.push(file); }

      if (blobsToUpload.length === 0) throw new Error("Nie odczytano pliku");

      const uploadedUrls: string[] = [];
      for (let i = 0; i < blobsToUpload.length; i++) {
        const safeFileName = `skan-${activeScanParticipantId}-${Date.now()}-strona${i+1}.jpg`;
        const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, blobsToUpload[i]);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
      const res = await fetch(`/api/grade-scan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantId: activeScanParticipantId, fileUrls: uploadedUrls, examTemplateId: order.examTemplate.id })
      });
      if (res.ok) { 
        const data = await res.json();
        if (data.requiresManualGrading) alert(data.message); else alert("Skan oceniony pomyślnie przez AI!"); 
        fetchOrderDetails();
      } else { alert("Błąd AI. Administrator oceni skan ręcznie."); fetchOrderDetails(); }
    } catch (error) { alert("Błąd przetwarzania pliku."); } finally { setIsUploading(false); setActiveScanParticipantId(null); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${orderId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
      const res = await fetch(`/api/client-orders/${orderId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, fileUrl: publicUrlData.publicUrl, fileType: file.type || 'unknown' }),
      });
      if (res.ok) { alert("Plik przesłany!"); fetchOrderDetails(); }
    } catch (error) { alert("Błąd wgrywania."); } finally { setIsUploading(false); }
  };

  const copyTestLink = (participantId: string) => {
    const testLink = `${window.location.origin}/exam/${orderId}/${participantId}`;
    navigator.clipboard.writeText(testLink);
    alert("Skopiowano link do testu!");
  };

  const generateClientPDF = () => {
    if (!order?.examTemplate?.questions || order.examTemplate.questions.length === 0) { alert("Ten test nie ma pytań."); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Zezwól na wyskakujące okienka."); return; }
    const letters = ['A', 'B', 'C', 'D'];
    const htmlContent = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Arkusz - ${order.examTemplate.title}</title><style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5; } .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; } .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; } .student-info { display: flex; justify-content: space-between; margin-top: 30px; font-size: 16px; } .info-line { border-bottom: 1px dotted #000; width: 300px; display: inline-block; } .question-block { margin-bottom: 30px; page-break-inside: avoid; } .question-text { font-weight: bold; font-size: 16px; margin-bottom: 12px; } .options { list-style-type: none; padding-left: 0; margin: 0; } .option { margin-bottom: 8px; font-size: 15px; display: flex; } .option-letter { font-weight: bold; margin-right: 10px; } @media print { body { padding: 0; } }</style></head><body><div class="header"><div class="title">${order.examTemplate.title}</div><div style="font-size: 14px; color: #555;">Test weryfikujący wiedzę</div><div class="student-info"><div>Imię i nazwisko: <span class="info-line"></span></div><div>Data: <span class="info-line" style="width: 150px;"></span></div></div></div><div class="questions">${order.examTemplate.questions.map((q, index) => `<div class="question-block"><div class="question-text">${index + 1}. ${q.content}</div><ul class="options">${q.options.map((opt, optIndex) => `<li class="option"><span class="option-letter">${letters[optIndex]}.</span> <span>${opt}</span></li>`).join('')}</ul></div>`).join('')}</div><script>window.onload = function() { window.print(); }</script></body></html>`;
    printWindow.document.write(htmlContent); printWindow.document.close();
  };

  const generateOfficialDocuments = () => {
    if (!order || !order.participants || order.participants.length === 0) return;
    const bgProtocolUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/3.png";
    const bgCertFrontUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/1.png";
    const bgCertBackUrl = "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/2.png";
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Zezwól na wyskakujące okienka."); return; }
    const dzisiaj = new Date().toLocaleDateString('pl-PL');
    const shortId = order.id.split('-')[0].toUpperCase();
    const courseName = order.examTemplate?.title || "Szkolenie Zawodowe";
    const ocenieni = order.participants.filter(p => p.testFinished && p.maxScore && p.maxScore > 0);
    const zdani = ocenieni.filter(p => p.score && p.maxScore && (p.score / p.maxScore) >= 0.51);
    const sourceText = order.examTemplate?.learningOutcomes || order.examTemplate?.description || "";
    const efektyUczenia = sourceText ? sourceText.split('\n').map(line => line.trim()).filter(line => line.length > 0).map((line, index) => `<div style="margin-bottom: 6px; text-align: justify;">${index + 1}. ${line}</div>`).join('') : '<div>Brak wprowadzonych efektów.</div>';
    
    let htmlContent = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Dokumenty - #${shortId}</title><style>body { font-family: 'Times New Roman', Times, serif; background: #525659; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000; } .page { width: 210mm; height: 297mm; background: white; margin: 20px auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5); page-break-after: always; overflow: hidden; } .page:last-child { page-break-after: auto; } .bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: cover; } .text-layer { position: absolute; z-index: 2; color: #000; } @media print { body { background: white; margin: 0; padding: 0; } .page { margin: 0; box-shadow: none; border: none; } } .proto-numer { top: 60mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-cel { top: 67mm; left: 105mm; transform: translateX(-50%); font-size: 16px; text-align: center; width: 170mm; line-height: 1.4; } .proto-opis-dnia { top: 82mm; left: 25mm; font-size: 16px; width: 160mm; line-height: 1.4; text-align: left; } .proto-kurs { top: 94mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-tytul-listy { top: 106mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-lista { top: 116mm; left: 25mm; width: 160mm; font-size: 16px; line-height: 1.6; } .cert-dla { top: 88mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-imie-nazwisko { top: 98mm; left: 105mm; transform: translateX(-50%); font-size: 26px; font-weight: bold; width: 190mm; text-align: center; } .cert-urodzony { top: 110mm; left: 105mm; transform: translateX(-50%); font-size: 16px; width: 190mm; text-align: center; } .cert-po-odbyciu { top: 130mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-kurs { top: 142mm; left: 105mm; transform: translateX(-50%); font-size: 22px; font-weight: bold; width: 180mm; text-align: center; } .cert-wynik-tekst { top: 166mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-wynik-box { top: 174mm; left: 105mm; transform: translateX(-50%); font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; } .cert-kielce-dnia { top: 215mm; left: 25mm; font-size: 16px; } .cert-numer-cvziu { top: 240mm; left: 115mm; font-size: 16px; font-weight: bold; } .cert-efekty-lista { top: 60mm; left: 25mm; width: 160mm; font-size: 15px; line-height: 1.5; } .cert-stopka-rewers { bottom: 15mm; left: 25mm; width: 160mm; font-size: 12px; text-align: left; }</style></head><body>`;
    htmlContent += `<div class="page"><img src="${bgProtocolUrl}" class="bg-image" /><div class="text-layer proto-numer">Protokół nr CVZIU${shortId}</div><div class="text-layer proto-cel">z przeprowadzenia walidacji (egzaminu) efektów uczenia się<br/>w celu potwierdzenia nabycia kwalifikacji</div><div class="text-layer proto-opis-dnia">Dnia ${dzisiaj} przeprowadzono walidację (egzamin) sprawdzającą przyswojenie przez<br/>uczestników szkolenia wiedzy z zakresu:</div><div class="text-layer proto-kurs">${courseName}</div><div class="text-layer proto-tytul-listy">Lista obecności oraz wyniki osób egzaminowanych</div><div class="text-layer proto-lista">${ocenieni.length > 0 ? ocenieni.map((p, i) => { const proc = p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0; const wynik = proc >= 51 ? 'pozytywna' : 'negatywna'; return `<div style="margin-bottom: 6px;">${i + 1}. ${p.lastName} ${p.firstName} urodzony(a) ${p.birthDate} walidacja ${wynik}</div>`; }).join('') : '<div>Brak.</div>'}</div></div>`;
    zdani.forEach((p) => {
      const certId = `CVZIU${shortId}${p.id.substring(0, 4).toUpperCase()}`;
      htmlContent += `<div class="page"><img src="${bgCertFrontUrl}" class="bg-image" /><div class="text-layer cert-dla">dla</div><div class="text-layer cert-imie-nazwisko">Pan(i) ${p.firstName} ${p.lastName}</div><div class="text-layer cert-urodzony">urodzony(a) w dn. ${p.birthDate} w ${p.birthPlace || '-'}</div><div class="text-layer cert-po-odbyciu">po odbyciu kursu pt.:</div><div class="text-layer cert-kurs">"${courseName}"</div><div class="text-layer cert-wynik-tekst">w wyniku przeprowadzonej walidacji zdał(a) egzamin</div><div class="text-layer cert-wynik-box"><span style="font-family: Arial;">☑</span> wynikiem pozytywnym</div><div class="text-layer cert-kielce-dnia">Kielce, dnia ${dzisiaj}</div><div class="text-layer cert-numer-cvziu">Nr: ${certId}</div></div><div class="page"><img src="${bgCertBackUrl}" class="bg-image" /><div class="text-layer cert-efekty-lista">${efektyUczenia}</div><div class="text-layer cert-stopka-rewers">Załącznik do certyfikatu nr: ${certId} | Uczestnik: ${p.firstName} ${p.lastName}</div></div>`;
    });
    htmlContent += `<script>window.onload = function() { setTimeout(() => { window.print(); }, 800); }</script></body></html>`;
    printWindow.document.write(htmlContent); printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!order || order.participants.length === 0) return;
    const headers = ["Imię", "Nazwisko", "Data Urodzenia", "Miejsce Urodzenia", "Zdobyte Punkty", "Maks. Punkty", "Procent", "Wynik Walidacji"];
    const rows = order.participants.map(p => {
      const proc = p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
      return [p.firstName, p.lastName, p.birthDate, p.birthPlace || "-", p.score ?? "-", p.maxScore ?? "-", p.testFinished ? `${proc}%` : "-", p.testFinished ? (proc >= 51 ? "Pozytywny" : "Negatywny") : "-"];
    });
    const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.setAttribute("href", URL.createObjectURL(blob)); link.setAttribute("download", `Wyniki_${order.id.split('-')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStatusAlert = (status: string) => {
    switch(status) {
      case 'NEW': return <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6"><h3 className="text-yellow-800 font-bold mb-1">Etap 1: Nowe zlecenie</h3><p className="text-yellow-700 text-sm">Oczekuj na potwierdzenie.</p></div>;
      case 'CONFIRMED': return <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6"><h3 className="text-blue-800 font-bold mb-1">Etap 2: Potwierdzenie zlecenia</h3><p className="text-blue-700 text-sm">Wprowadź uczestników poniżej.</p></div>;
      case 'TEST_READY': return <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6"><h3 className="text-indigo-800 font-bold mb-1">Etap 3: Przeprowadzenie egzaminu</h3><p className="text-indigo-700 text-sm">Wgraj skany przy nazwisku.</p></div>;
      case 'SCANS_UPLOADED': return <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6"><h3 className="text-purple-800 font-bold mb-1">Etap: Oczekuje na akceptację</h3><p className="text-purple-700 text-sm">Trwa weryfikacja.</p></div>;
      default: return null;
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Wczytywanie szczegółów...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-medium">Nie znaleziono zlecenia.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <input type="file" ref={participantScanInputRef} onChange={handleParticipantScanUpload} className="hidden" accept=".pdf, image/jpeg, image/png, image/webp" />
      <input type="file" ref={csvInputRef} onChange={handleCsvImport} className="hidden" accept=".csv" />

      <div className="mb-6 flex justify-between items-center">
        <Link href="/panel/history" className="text-slate-500 hover:text-blue-600 font-medium flex items-center transition-colors"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Wróć do listy</Link>
        {order.invoiceUrl && (order.status === 'CONFIRMED' || order.status === 'TEST_READY' || order.status === 'COMPLETED') && (<a href={order.invoiceUrl} target="_blank" className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center border border-green-300"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Pobierz Fakturę</a>)}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-900 p-8 text-white"><p className="text-sm font-bold text-slate-400 uppercase mb-2">Zlecenie #{order.id.split('-')[0]}</p><h1 className="text-3xl font-bold">{order.examTemplate?.title || "Brak nazwy"}</h1></div>

        {order.status === 'COMPLETED' ? (
          <div className="p-8 pb-4">
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 text-center shadow-lg"><h2 className="text-3xl font-black text-green-900 mb-4">Wszystko gotowe! 🎉</h2><p className="text-green-800 text-lg mb-8">Walidacja zakończona. Możesz pobrać certyfikaty.</p><div className="flex flex-col sm:flex-row justify-center gap-4"><button onClick={generateOfficialDocuments} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-md">Pobierz Certyfikaty</button><button onClick={exportToCSV} className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-bold py-4 px-8 rounded-xl shadow-sm">Eksport CSV</button></div></div>
          </div>
        ) : (
          <div className="p-8 pb-4">
            {getStatusAlert(order.status)}
            {order.status === 'TEST_READY' && (<div className="mt-4 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center"><h3 className="text-lg font-bold text-indigo-900 mb-2">Tradycyjny Egzamin</h3><p className="text-indigo-700 text-sm mb-4">Wydrukuj arkusze i wgraj skan przy nazwisku.</p>{order.examTemplate?.questions?.length ? (<button onClick={generateClientPDF} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-indigo-700">Generuj Arkusz PDF</button>) : (<span className="text-gray-500 text-sm">Brak pytań.</span>)}</div>)}
          </div>
        )}

        <div className="px-8 pb-8 mt-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">Zgłoszeni uczestnicy</h2>

          {order.status === 'CONFIRMED' && (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6 relative">
              <form onSubmit={handleAddParticipant} className="mb-4 pb-4 border-b border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div><label className="block text-xs font-semibold text-blue-700 mb-1">Imię</label><input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-xs font-semibold text-blue-700 mb-1">Nazwisko</label><input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-xs font-semibold text-blue-700 mb-1">Data ur.</label><input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-xs font-semibold text-blue-700 mb-1">Miejsce ur.</label><input type="text" required value={birthPlace} onChange={e => setBirthPlace(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
                </div>
                <div className="flex justify-end"><button type="submit" disabled={isAddingParticipant} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm">+ Dodaj pojedynczo</button></div>
              </form>

              {/* MASOWY IMPORT */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-900 mb-1">Masowy import z Excela (CSV)</h3>
                  <p className="text-xs text-blue-700">Format: <code>Imię;Nazwisko;Data ur(YYYY-MM-DD);Miejsce ur</code></p>
                </div>
                <button type="button" onClick={() => csvInputRef.current?.click()} disabled={isAddingParticipant} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> Wgraj plik CSV
                </button>
              </div>
            </div>
          )}

          {order.participants?.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="bg-slate-100 text-slate-600 border-b border-slate-200"><th className="p-3 font-semibold">Imię i Nazwisko</th><th className="p-3 font-semibold text-center">Wynik</th><th className="p-3 font-semibold text-right">Akcje</th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {order.participants.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="p-3 text-center">{p.testFinished ? (<span className="font-bold bg-gray-100 px-2 py-1 rounded-full">{p.score}/{p.maxScore}</span>) : (<span className="text-gray-400">-</span>)}</td>
                      <td className="p-3 text-right">
                        {order.status === 'CONFIRMED' ? (<button onClick={() => handleDeleteParticipant(p.id)} className="text-red-500 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 rounded">Usuń</button>) 
                        : order.status === 'TEST_READY' && !p.testFinished ? (<div className="flex justify-end gap-2"><button onClick={() => triggerParticipantScan(p.id)} className="bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded hover:bg-purple-200 text-xs">Wgraj Skan</button><button onClick={() => copyTestLink(p.id)} className="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded hover:bg-blue-200 text-xs">Link Online</button></div>) 
                        : (<span className="text-gray-400">Brak akcji</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<div className="text-center py-6 text-slate-400 border border-dashed rounded-xl">Brak osób na liście.</div>)}
        </div>
      </div>
    </div>
  );
}