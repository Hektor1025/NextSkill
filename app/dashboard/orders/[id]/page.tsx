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

type Question = { id?: string; content: string; options: string[]; correctAnswer: number; };

type OrderDetails = {
  id: string;
  status: string;
  invoiceUrl: string | null;
  generatedTestUrl: string | null;
  createdAt: string;
  client: { email: string };
  examTemplate: { id: string; title: string; description: string; questions?: Question[] } | null;
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
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // --- STAN DLA RĘCZNEGO OCENIANIA ---
  const [gradingScores, setGradingScores] = useState<Record<string, {score: string, maxScore: string}>>({});

  // --- STAN DLA GENERATORA AI ---
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

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
        if (data.examTemplate?.questions) {
          setGeneratedQuestions(data.examTemplate.questions);
        }
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

  // --- WGRYWANIE CERTYFIKATÓW (Dla Etapu 4) ---
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

  // --- RĘCZNE OCENIANIE SKANÓW (Dla Etapu 3) ---
  const submitManualGrade = async (participantId: string) => {
    const scores = gradingScores[participantId];
    if (!scores || !scores.score || !scores.maxScore) {
      alert("Podaj zarówno zdobyte punkty, jak i maksimum przed zapisaniem.");
      return;
    }
    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          score: parseInt(scores.score), 
          maxScore: parseInt(scores.maxScore), 
          testFinished: true 
        })
      });
      if (res.ok) { alert("Ocena została zapisana w systemie!"); fetchOrderDetails(); } 
      else { alert("Błąd podczas zapisywania oceny."); }
    } catch (e) { alert("Wystąpił błąd."); }
  };

  // --- OBSŁUGA GENERATORA AI (Dla Etapu 2/3) ---
  const handleGenerateAI = async () => {
    if (!order?.examTemplate?.description) { alert("Brak opisu szkolenia w bazie"); return; }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: order.examTemplate.description, count: questionCount, difficulty })
      });
      const data = await res.json();
      if (data.questions) setGeneratedQuestions(data.questions);
      else alert("Błąd: Sztuczna inteligencja zwróciła dane w nieoczekiwanym formacie.");
    } catch(error) { alert("Błąd połączenia z modułem AI."); } finally { setIsGenerating(false); }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...generatedQuestions];
    if (field === "content") newQuestions[index].content = value;
    else if (field === "correctAnswer") newQuestions[index].correctAnswer = Number(value);
    setGeneratedQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[qIndex].options[optIndex] = value;
    setGeneratedQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(newQuestions);
  };

  const saveQuestionsAndGeneratePDF = async () => {
    if (!order?.examTemplate?.id) return;
    setIsSavingQuestions(true);
    try {
      const res = await fetch(`/api/exams/${order.examTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: order.examTemplate.title, 
          description: order.examTemplate.description,
          questions: generatedQuestions 
        })
      });
      
      if (res.ok) {
        alert("Pytania zapisane pomyślnie! Generuję arkusz do druku...");
        fetchOrderDetails();
        printExamPDF(generatedQuestions);
      } else {
        alert("Wystąpił błąd podczas zapisywania pytań.");
      }
    } catch (error) { alert("Wystąpił błąd połączenia."); } finally { setIsSavingQuestions(false); }
  };

  const printExamPDF = (questionsToPrint: Question[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Proszę zezwolić na wyskakujące okienka (pop-ups), aby wygenerować PDF."); return; }

    const letters = ['A', 'B', 'C', 'D'];
    const htmlContent = `
      <!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Egzamin - ${order?.examTemplate?.title}</title>
      <style>
        body { font-family: 'Arial', sans-serif; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
        .student-info { display: flex; justify-content: space-between; margin-top: 30px; font-size: 16px; }
        .info-line { border-bottom: 1px dotted #000; width: 300px; display: inline-block; }
        .question-block { margin-bottom: 30px; page-break-inside: avoid; }
        .question-text { font-weight: bold; font-size: 16px; margin-bottom: 12px; }
        .options { list-style-type: none; padding-left: 0; margin: 0; }
        .option { margin-bottom: 8px; font-size: 15px; display: flex; }
        .option-letter { font-weight: bold; margin-right: 10px; }
        .page-break { page-break-before: always; }
        .key-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;}
        .key-list { column-count: 2; column-gap: 40px; }
        .key-item { margin-bottom: 10px; font-size: 16px; page-break-inside: avoid; }
        @media print { body { padding: 0; } button { display: none; } }
      </style></head><body>
        <div class="header">
          <div class="title">${order?.examTemplate?.title}</div>
          <div style="font-size: 14px; color: #555;">Test weryfikujący wiedzę</div>
          <div class="student-info"><div>Imię i nazwisko: <span class="info-line"></span></div><div>Data: <span class="info-line" style="width: 150px;"></span></div></div>
        </div>
        <div class="questions">
          ${questionsToPrint.map((q, index) => `
            <div class="question-block">
              <div class="question-text">${index + 1}. ${q.content}</div>
              <ul class="options">
                ${q.options.map((opt, optIndex) => `<li class="option"><span class="option-letter">${letters[optIndex]}.</span> <span>${opt}</span></li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        <div class="page-break"></div>
        <div class="key-title">KLUCZ ODPOWIEDZI DLA EGZAMINATORA (NIE DRUKOWAĆ DLA KURSANTÓW)</div>
        <div class="key-list">
          ${questionsToPrint.map((q, index) => `
            <div class="key-item"><strong>Zadanie ${index + 1}:</strong> Poprawna: <strong>${letters[q.correctAnswer]}</strong></div>
          `).join('')}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `;
    printWindow.document.write(htmlContent); printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!order || order.participants.length === 0) return alert("Brak danych uczestników.");
    const headers = ["Imię", "Nazwisko", "Data Urodzenia", "Miejsce Urodzenia", "Zdobyte Punkty", "Maks. Punkty", "Procent", "Wynik Walidacji", "Status Testu"];
    const rows = order.participants.map(p => {
      const proc = p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
      const wynik = p.testFinished ? (proc >= 51 ? "Pozytywny" : "Negatywny") : "Brak danych";
      const status = p.testFinished ? "Zakończony" : "Oczekuje";
      return [p.firstName, p.lastName, p.birthDate, p.birthPlace || "-", p.score !== null ? p.score : "-", p.maxScore !== null ? p.maxScore : "-", p.testFinished ? `${proc}%` : "-", wynik, status];
    });
    const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Zlecenie_Raport.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (isLoading) return <div className="p-12 text-center text-gray-500 font-medium">Wczytywanie szczegółów zlecenia...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-medium">Nie znaleziono zlecenia.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/orders" className="text-gray-500 hover:text-blue-600 font-medium flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Wróć do listy zleceń
        </Link>
      </div>

      {/* --- SEKCJA 1: SZCZEGÓŁY I STATUS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-50 border-b border-gray-200 p-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Zlecenie #{order.id.split('-')[0]}</p><h1 className="text-2xl font-bold text-gray-900">{order.examTemplate?.title || "Brak nazwy"}</h1></div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-center"><p className="text-xs text-gray-500 font-medium mb-1">Ośrodek</p><p className="text-sm font-bold text-gray-800">{order.client.email}</p></div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
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

          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Zarządzanie Statusem</h2>
            <form onSubmit={handleStatusUpdate} className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 mb-4">
                <option value="NEW">1. Nowe zlecenie (Oczekuje)</option>
                <option value="CONFIRMED">2. Potwierdzenie zlecenia (Klient dodaje osoby)</option>
                <option value="TEST_READY">3. Testy gotowe (Wydawanie arkuszy)</option>
                <option value="SCANS_UPLOADED">-- Weryfikacja (Trwa sprawdzanie) --</option>
                <option value="COMPLETED">4. Walidacja zakończona (Certyfikaty)</option>
              </select>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">{isSaving ? "Zapisywanie..." : "Zapisz i powiadom Klienta"}</button>
            </form>
          </div>
        </div>
      </div>

      {/* --- SEKCJA 2: KREATOR TESTÓW AI (Widoczny przed zakonczeniem) --- */}
      {(order.status === 'NEW' || order.status === 'CONFIRMED' || order.status === 'TEST_READY') && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl shadow-sm border border-indigo-100 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-indigo-900 mb-1 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Inteligentny Generator Arkuszy 
              </h2>
              <p className="text-sm text-indigo-700">Wygeneruj unikalny test egzaminacyjny dla tego klienta na podstawie opisu szkolenia.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-indigo-800 mb-1">Poziom trudności:</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2 border border-indigo-200 rounded-lg outline-none bg-white text-indigo-900 text-sm font-medium">
                  <option value="easy">🟢 Łatwy (Podstawy)</option><option value="medium">🟡 Średni (Standard)</option><option value="hard">🔴 Trudny (Zaawansowany)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-indigo-800 mb-1">Liczba pytań:</label>
                <input type="number" min="1" max="50" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-20 px-3 py-2 border border-indigo-200 rounded-lg outline-none text-center bg-white text-sm font-medium" />
              </div>
              <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center h-10">
                {isGenerating ? "Generowanie..." : "Losuj Test AI"}
              </button>
            </div>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="mt-6 border-t border-indigo-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Podgląd i edycja testu dla Ośrodka ({generatedQuestions.length} pytań)</h3>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {generatedQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-white border border-indigo-100 rounded-xl p-4 relative group shadow-sm">
                    <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Pytanie {qIndex + 1}</label>
                    <input type="text" value={q.content} onChange={(e) => handleQuestionChange(qIndex, "content", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-medium text-gray-900 focus:border-indigo-500 bg-gray-50 mb-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center"><span className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-l-lg font-bold text-sm border-y border-l border-gray-300">{String.fromCharCode(65 + optIndex)}</span><input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-r-lg outline-none text-sm focus:border-indigo-500 bg-white" /></div>
                      ))}
                    </div>
                    <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 w-max">
                      <label className="text-xs font-bold text-green-800 mr-2">Poprawna:</label>
                      <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="bg-white border border-green-300 text-green-900 text-xs rounded outline-none px-2 py-1 font-bold cursor-pointer"><option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option></select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveQuestionsAndGeneratePDF} disabled={isSavingQuestions} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  {isSavingQuestions ? "Zapisywanie..." : "Zapisz test i Generuj Arkusze PDF"}
                </button>
                <p className="text-xs text-indigo-600 font-medium">Kliknięcie zapisze nowy test w bazie online i otworzy okno druku.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SEKCJA 3: UCZESTNICY I OCENIANIE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-white border-b border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Uczestnicy szkolenia (Ocenianie)</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block">Osób: {order.participants.length}</span>
          </div>
          {order.participants.length > 0 && <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-sm flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Eksport CSV</button>}
        </div>
        
        <div className="p-6">
          <input type="file" ref={certInputRef} onChange={handleCertUpload} className="hidden" accept=".pdf,.jpg,.png" />
          
          {order.participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">Ośrodek nie wprowadził jeszcze żadnych kursantów do tego zlecenia.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-3 font-semibold">Imię i Nazwisko</th>
                    <th className="p-3 font-semibold text-center">Ocena / Status</th>
                    {order.status === 'COMPLETED' && <th className="p-3 font-semibold text-right">Akcje / Ręczny Certyfikat</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {order.participants.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-bold text-gray-800">
                        {p.firstName} {p.lastName}
                        {p.scannedTestUrl && (
                          <div className="mt-2">
                            <a href={p.scannedTestUrl} target="_blank" className="text-xs text-indigo-600 hover:underline flex items-center bg-indigo-50 px-2 py-1 rounded-md w-max border border-indigo-100">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              Otwórz wgrany skan testu
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {p.testFinished ? (
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${p.score && p.maxScore && (p.score / p.maxScore >= 0.51) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.score}/{p.maxScore} pkt
                          </span>
                        ) : p.scannedTestUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200 font-bold">Wymaga oceny ręcznej</span>
                            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm">
                               <input type="number" placeholder="Pkt" className="w-12 px-1 py-1 text-xs border border-gray-200 rounded outline-none text-center focus:border-blue-500"
                                 value={gradingScores[p.id]?.score || ""}
                                 onChange={e => setGradingScores({...gradingScores, [p.id]: {...gradingScores[p.id], score: e.target.value}})}
                               />
                               <span className="text-gray-400 font-bold text-xs">/</span>
                               <input type="number" placeholder="Max" className="w-12 px-1 py-1 text-xs border border-gray-200 rounded outline-none text-center focus:border-blue-500"
                                 value={gradingScores[p.id]?.maxScore || ""}
                                 onChange={e => setGradingScores({...gradingScores, [p.id]: {...gradingScores[p.id], maxScore: e.target.value}})}
                               />
                               <button onClick={() => submitManualGrade(p.id)} className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-orange-600 transition-colors">Zapisz</button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Oczekuje na arkusz</span>
                        )}
                      </td>
                      {order.status === 'COMPLETED' && (
                        <td className="p-3 text-right">
                          {p.certificateUrl ? (
                            <div className="flex items-center justify-end space-x-2"><span className="text-green-600 font-bold text-xs">Wgrany</span><a href={p.certificateUrl} target="_blank" className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-gray-700">Podgląd</a><button onClick={() => triggerCertUpload(p.id)} className="text-xs text-blue-600 hover:underline">Zmień</button></div>
                          ) : (
                            <button onClick={() => triggerCertUpload(p.id)} disabled={isUploadingCert} className="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition-colors">{isUploadingCert && activeParticipantId === p.id ? "Wgrywanie..." : "+ Ręczny Certyfikat"}</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}