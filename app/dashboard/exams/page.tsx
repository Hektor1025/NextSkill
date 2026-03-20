"use client";

import React, { useState, useEffect } from "react";

type Question = {
  content: string;
  options: string[];
  correctAnswer: number;
};

type ExamTemplate = {
  id: string;
  title: string;
  description: string;
  isCustom: boolean;
  questions?: Question[];
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium"); // NOWOŚĆ: Stan trudności
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      }
    } catch (error) {
      console.error("Błąd pobierania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!description || description.length < 10) {
      alert("Najpierw wpisz sensowny opis programu szkolenia (min. 10 znaków)!");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Wysyłamy wybrany poziom trudności do AI!
        body: JSON.stringify({ description, count: questionCount, difficulty })
      });
      
      const data = await res.json();
      
      if (data.questions) {
        setQuestions(data.questions); 
      } else {
        alert("Błąd: Sztuczna inteligencja zwróciła dane w nieoczekiwanym formacie.");
      }
    } catch(error) {
      console.error(error);
      alert("Błąd połączenia z modułem AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === "content") {
      newQuestions[index].content = value;
    } else if (field === "correctAnswer") {
      newQuestions[index].correctAnswer = Number(value);
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isCustom, questions }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setIsCustom(false);
        setDifficulty("medium");
        setQuestions([]);
        setShowForm(false);
        fetchExams();
      }
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
  };

  // NOWOŚĆ: System generowania PDF poprzez natywny widok do druku
  const generatePDF = (exam: ExamTemplate) => {
    if (!exam.questions || exam.questions.length === 0) {
      alert("Ten egzamin nie ma jeszcze pytań!");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Proszę zezwolić na wyskakujące okienka (pop-ups), aby wygenerować PDF.");
      return;
    }

    const letters = ['A', 'B', 'C', 'D'];
    
    // Budujemy piękny, sformatowany kod HTML dla testu i klucza odpowiedzi
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <title>Egzamin - ${exam.title}</title>
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
          /* Klasy dla klucza odpowiedzi na nowej stronie */
          .page-break { page-break-before: always; }
          .key-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;}
          .key-list { column-count: 2; column-gap: 40px; }
          .key-item { margin-bottom: 10px; font-size: 16px; page-break-inside: avoid; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${exam.title}</div>
          <div style="font-size: 14px; color: #555;">Test weryfikujący wiedzę</div>
          <div class="student-info">
            <div>Imię i nazwisko: <span class="info-line"></span></div>
            <div>Data: <span class="info-line" style="width: 150px;"></span></div>
          </div>
        </div>

        <div class="questions">
          ${exam.questions.map((q, index) => `
            <div class="question-block">
              <div class="question-text">${index + 1}. ${q.content}</div>
              <ul class="options">
                ${q.options.map((opt, optIndex) => `
                  <li class="option">
                    <span class="option-letter">${letters[optIndex]}.</span> 
                    <span>${opt}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>

        <div class="page-break"></div>
        <div class="key-title">KLUCZ ODPOWIEDZI DLA EGZAMINATORA (NIE DRUKOWAĆ DLA KURSANTÓW)</div>
        <div class="key-list">
          ${exam.questions.map((q, index) => `
            <div class="key-item">
              <strong>Zadanie ${index + 1}:</strong> Prawidłowa odpowiedź: <strong>${letters[q.correctAnswer]}</strong>
            </div>
          `).join('')}
        </div>

        <script>
          // Automatycznie wywołuje okno zapisu do PDF po wczytaniu
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pakiety Egzaminów</h1>
          <p className="text-gray-500 mt-1">Zarządzaj wzorami egzaminów i generuj nowe testy za pomocą AI</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center">
          {showForm ? "Anuluj dodawanie" : "+ Dodaj nowy pakiet"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 border-t-4 border-t-blue-500">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Kreator pakietu edukacyjnego
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa egzaminu (np. Wózki widłowe)</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="Wpisz nazwę..." />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Opis programu szkolenia (Baza wiedzy dla AI)</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] transition-colors" placeholder="Wklej tutaj szczegółowy opis, sylabus lub plan szkolenia..." />
              </div>

              {/* PANEL SZTUCZNEJ INTELIGENCJI Z WYBOREM TRUDNOŚCI */}
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-indigo-900 mb-1 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Generator Testów AI
                  </h3>
                  <p className="text-sm text-indigo-700">Skonfiguruj parametry i wygeneruj profesjonalny test.</p>
                </div>
                
                <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-indigo-800 mb-1">Poziom trudności:</label>
                    <select 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="px-3 py-2 border border-indigo-200 rounded-lg outline-none bg-white text-indigo-900 text-sm font-medium"
                    >
                      <option value="easy">🟢 Łatwy (Podstawy)</option>
                      <option value="medium">🟡 Średni (Standard)</option>
                      <option value="hard">🔴 Trudny (Zaawansowany)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-indigo-800 mb-1">Liczba pytań:</label>
                    <input type="number" min="1" max="50" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-20 px-3 py-2 border border-indigo-200 rounded-lg outline-none text-center bg-white" />
                  </div>
                  
                  <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center whitespace-nowrap h-10">
                    {isGenerating ? (
                      <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Wymyślam...</span>
                    ) : "Generuj pytania"}
                  </button>
                </div>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Podgląd i edycja testu ({questions.length} pytań)</h3>
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative group">
                      <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                      
                      <div className="mb-4 pr-8">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pytanie {qIndex + 1}</label>
                        <input type="text" value={q.content} onChange={(e) => handleQuestionChange(qIndex, "content", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-medium text-gray-900 focus:border-blue-500 bg-white" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-l-lg font-bold text-sm border-y border-l border-gray-300">{String.fromCharCode(65 + optIndex)}</span>
                            <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-r-lg outline-none text-sm focus:border-blue-500 bg-white" />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-max">
                        <label className="text-sm font-bold text-green-800 mr-3">Poprawna odpowiedź (Klucz):</label>
                        <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="bg-white border border-green-300 text-green-900 text-sm rounded outline-none px-2 py-1 font-bold cursor-pointer">
                          <option value={0}>A</option>
                          <option value={1}>B</option>
                          <option value={2}>C</option>
                          <option value={3}>D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center mt-6 pt-6 border-t border-gray-100">
              <input type="checkbox" id="isCustom" checked={isCustom} onChange={(e) => setIsCustom(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="isCustom" className="ml-2 text-sm text-gray-700 cursor-pointer">Oznacz jako "Egzamin Niestandardowy"</label>
            </div>
            
            <div className="pt-4">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto">
                Zapisz egzamin w bazie
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA EGZAMINÓW */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Dostępne pakiety w systemie</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">Łącznie: {exams.length}</span>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Ładowanie danych z bazy...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">Brak egzaminów w systemie. Użyj generatora AI, aby stworzyć pierwszy pakiet!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {exams.map((exam) => (
              <div key={exam.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
                    {exam.isCustom && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Niestandardowy</span>}
                    {exam.questions && exam.questions.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Baza: {exam.questions.length} pytań
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{exam.description}</p>
                </div>
                
                {/* NOWOŚĆ: PRZYCISK GENEROWANIA PDF */}
                {exam.questions && exam.questions.length > 0 && (
                  <button 
                    onClick={() => generatePDF(exam)}
                    className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Zapisz jako PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}