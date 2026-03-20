"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

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

type Question = {
  id: string;
  content: string;
  options: string[];
};

type OrderDetails = {
  id: string;
  status: string;
  invoiceUrl: string | null;
  generatedTestUrl: string | null;
  createdAt: string;
  examTemplate: { id: string; title: string; description: string; questions?: Question[] } | null;
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

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/client-orders/${orderId}`);
      if (res.ok) setOrder(await res.json());
    } catch (error) { console.error("Błąd pobierania:", error); } finally { setIsLoading(false); }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingParticipant(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, firstName, lastName, birthDate, birthPlace })
      });
      if (res.ok) { setFirstName(""); setLastName(""); setBirthDate(""); setBirthPlace(""); fetchOrderDetails(); } 
      else { alert("Błąd podczas dodawania kursanta."); }
    } catch (error) { console.error(error); } finally { setIsAddingParticipant(false); }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę osobę z listy?")) return;
    try {
      const res = await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
      if (res.ok) fetchOrderDetails();
      else alert("Błąd podczas usuwania.");
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
      const fileExt = file.name.split('.').pop();
      const safeFileName = `skan-testu-${activeScanParticipantId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scans').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('scans').getPublicUrl(safeFileName);
      
      const res = await fetch(`/api/grade-scan`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          participantId: activeScanParticipantId,
          fileUrl: publicUrlData.publicUrl,
          examTemplateId: order.examTemplate.id
        })
      });

      if (res.ok) { 
        alert("Skan został wgrany i oceniony przez AI!"); 
        fetchOrderDetails(); 
      } else {
        alert("Wgrano skan, ale wystąpił błąd z automatyczną oceną. Administrator oceni go ręcznie.");
        fetchOrderDetails();
      }
    } catch (error) { 
      alert("Błąd podczas wgrywania skanu kursanta."); 
    } finally { 
      setIsUploading(false); 
      setActiveScanParticipantId(null);
    }
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
      if (res.ok) { alert("Plik ogólny został przesłany!"); fetchOrderDetails(); }
    } catch (error) { alert("Wystąpił błąd wgrywania."); } finally { setIsUploading(false); }
  };

  const copyTestLink = (participantId: string) => {
    const baseUrl = window.location.origin;
    const testLink = `${baseUrl}/exam/${orderId}/${participantId}`;
    navigator.clipboard.writeText(testLink);
    alert("Link do testu skopiowany do schowka! Możesz go wysłać kursantowi.");
  };

  const generateClientPDF = () => {
    if (!order?.examTemplate?.questions || order.examTemplate.questions.length === 0) {
      alert("Błąd: Ten test nie ma zapisanych pytań w bazie."); return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Zezwól na wyskakujące okienka, aby wygenerować arkusz PDF."); return; }
    const letters = ['A', 'B', 'C', 'D'];
    const htmlContent = `
      <!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Arkusz - ${order.examTemplate.title}</title>
      <style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5; } .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; } .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; } .student-info { display: flex; justify-content: space-between; margin-top: 30px; font-size: 16px; } .info-line { border-bottom: 1px dotted #000; width: 300px; display: inline-block; } .question-block { margin-bottom: 30px; page-break-inside: avoid; } .question-text { font-weight: bold; font-size: 16px; margin-bottom: 12px; } .options { list-style-type: none; padding-left: 0; margin: 0; } .option { margin-bottom: 8px; font-size: 15px; display: flex; } .option-letter { font-weight: bold; margin-right: 10px; } @media print { body { padding: 0; } }</style>
      </head><body><div class="header"><div class="title">${order.examTemplate.title}</div><div style="font-size: 14px; color: #555;">Test weryfikujący wiedzę</div><div class="student-info"><div>Imię i nazwisko: <span class="info-line"></span></div><div>Data: <span class="info-line" style="width: 150px;"></span></div></div></div><div class="questions">${order.examTemplate.questions.map((q, index) => `<div class="question-block"><div class="question-text">${index + 1}. ${q.content}</div><ul class="options">${q.options.map((opt, optIndex) => `<li class="option"><span class="option-letter">${letters[optIndex]}.</span> <span>${opt}</span></li>`).join('')}</ul></div>`).join('')}</div><script>window.onload = function() { window.print(); }</script></body></html>
    `;
    printWindow.document.write(htmlContent); printWindow.document.close();
  };

  const getStatusAlert = (status: string) => {
    switch(status) {
      case 'NEW': return <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6"><h3 className="text-yellow-800 font-bold mb-1">Etap 1: Nowe zlecenie</h3><p className="text-yellow-700 text-sm">Twoje zlecenie zostało przyjęte do systemu. Oczekuj na potwierdzenie.</p></div>;
      case 'CONFIRMED': return <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6"><h3 className="text-blue-800 font-bold mb-1">Etap 2: Potwierdzenie zlecenia</h3><p className="text-blue-700 text-sm">To jest jedyny moment, w którym możesz dodawać i usuwać uczestników szkolenia. Wprowadź ich poniżej.</p></div>;
      case 'TEST_READY': return <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6"><h3 className="text-indigo-800 font-bold mb-1">Etap 3: Przeprowadzenie egzaminu</h3><p className="text-indigo-700 text-sm">Skopiuj link do testu online dla kursanta LUB wygeneruj test do druku i wgraj skany przy jego nazwisku.</p></div>;
      case 'SCANS_UPLOADED': return <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6"><h3 className="text-purple-800 font-bold mb-1">Etap: Oczekuje na akceptację</h3><p className="text-purple-700 text-sm">Przesłałeś skany. Oczekujemy na weryfikację przez Administratora.</p></div>;
      case 'COMPLETED': return <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-6"><h3 className="text-green-800 font-bold mb-1">Etap 4: Walidacja zakończona</h3><p className="text-green-700 text-sm">Certyfikaty są gotowe do pobrania!</p></div>;
      default: return null;
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Wczytywanie szczegółów Twojego zlecenia...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-medium">Nie znaleziono zlecenia.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Dodana obsługa plików .pdf, .jpg, .jpeg, .png */}
      <input type="file" ref={participantScanInputRef} onChange={handleParticipantScanUpload} className="hidden" accept=".pdf, image/jpeg, image/png, image/jpg" />

      <div className="mb-6 flex justify-between items-center">
        <Link href="/panel/history" className="text-slate-500 hover:text-blue-600 font-medium flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Wróć do listy zleceń
        </Link>
        {order.invoiceUrl && (order.status === 'CONFIRMED' || order.status === 'TEST_READY') && (
          <a href={order.invoiceUrl} target="_blank" className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center border border-green-300">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Pobierz Fakturę
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-900 p-8 text-white"><p className="text-sm font-bold text-slate-400 uppercase mb-2">Szczegóły zlecenia #{order.id.split('-')[0]}</p><h1 className="text-3xl font-bold">{order.examTemplate?.title || "Brak nazwy"}</h1></div>

        <div className="p-8 pb-4">
          {getStatusAlert(order.status)}
          
          {order.status === 'TEST_READY' && (
             <div className="mt-4 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center shadow-sm">
               <h3 className="text-lg font-bold text-indigo-900 mb-2">Tradycyjny Egzamin Papierowy</h3>
               <p className="text-indigo-700 text-sm mb-4">Wydrukuj arkusze, daj kursantom do wypełnienia i wgraj skan/zdjęcie każdemu na liście poniżej.</p>
               {order.examTemplate?.questions && order.examTemplate.questions.length > 0 ? (
                 <button onClick={generateClientPDF} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md">Generuj Arkusz PDF do druku</button>
               ) : order.generatedTestUrl ? (
                 <a href={order.generatedTestUrl} target="_blank" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md">Pobierz Arkusze Wgrane przez Admina</a>
               ) : <span className="text-gray-500 italic text-sm">Arkusze nie są dostępne.</span>}
             </div>
          )}
        </div>

        <div className="px-8 pb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Zgłoszeni uczestnicy i Wyniki</h2>

          {order.status === 'CONFIRMED' && (
            <form onSubmit={handleAddParticipant} className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div><label className="block text-xs font-semibold text-blue-700 mb-1">Imię</label><input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-semibold text-blue-700 mb-1">Nazwisko</label><input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-semibold text-blue-700 mb-1">Data ur.</label><input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-semibold text-blue-700 mb-1">Miejsce ur.</label><input type="text" required value={birthPlace} onChange={e => setBirthPlace(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500" /></div>
              </div>
              <div className="flex justify-end"><button type="submit" disabled={isAddingParticipant} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50">+ Dodaj</button></div>
            </form>
          )}

          {order.participants && order.participants.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="bg-slate-100 text-slate-600 border-b border-slate-200"><th className="p-3 font-semibold">Imię i Nazwisko</th><th className="p-3 font-semibold text-center">Wynik Testu</th><th className="p-3 font-semibold text-right">Akcje</th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {order.participants.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="p-3 text-center">
                        {p.testFinished ? (
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${p.score && p.maxScore && (p.score / p.maxScore >= 0.5) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.score}/{p.maxScore} pkt
                          </span>
                        ) : order.status === 'TEST_READY' ? (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">Oczekuje na rozwiązanie</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {p.certificateUrl ? (
                          <a href={p.certificateUrl} target="_blank" className="inline-flex items-center bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded hover:bg-green-200">Pobierz Certyfikat</a>
                        ) : order.status === 'CONFIRMED' ? (
                          <button onClick={() => handleDeleteParticipant(p.id)} className="text-red-500 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 rounded">Usuń</button>
                        ) : order.status === 'TEST_READY' && !p.testFinished ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => triggerParticipantScan(p.id)} disabled={isUploading && activeScanParticipantId === p.id} className="bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded hover:bg-purple-200 text-xs whitespace-nowrap">
                              {isUploading && activeScanParticipantId === p.id ? "Ocenianie..." : "Wgraj Skan"}
                            </button>
                            <button onClick={() => copyTestLink(p.id)} className="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded hover:bg-blue-200 text-xs whitespace-nowrap">Test Online</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Brak akcji</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">Lista uczestników jest pusta.</div>
          )}
        </div>

        <div className="px-8 pb-8 pt-4 border-t border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Dodatkowe dokumenty zbiorcze (opcjonalnie)</h2>
          {order.status !== 'TEST_READY' ? (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center"><p className="text-slate-500 text-sm">Przesyłanie plików możliwe jest wyłącznie w Etapie 3.</p></div>
          ) : (
            <>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf, .jpg, .jpeg, .png" />
              <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`bg-white p-8 rounded-xl border-2 border-dashed ${isUploading && !activeScanParticipantId ? 'border-gray-300 opacity-70 cursor-wait' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'} text-center transition-all shadow-sm`}>
                <h3 className="font-bold text-slate-700 mb-1 text-lg">Wybierz inne pliki dla tego zlecenia</h3>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}