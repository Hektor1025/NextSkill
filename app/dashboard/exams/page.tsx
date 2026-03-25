"use client";

import React, { useEffect, useState } from "react";

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
  learningOutcomes?: string | null;
  level?: string | null;
  questions?: Question[];
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [level, setLevel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingOutcomes, setIsGeneratingOutcomes] = useState(false);
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
      alert("Najpierw wpisz sensowny opis programu szkolenia (min. 10 znaków).");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, count: questionCount, difficulty }),
      });

      const data = await res.json();

      if (data.questions) {
        setQuestions(data.questions);
      } else {
        alert("Błąd: AI zwróciło dane w nieoczekiwanym formacie.");
      }
    } catch (error) {
      console.error(error);
      alert("Błąd połączenia z modułem AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOutcomesAI = async () => {
    if (!description || description.length < 10) {
      alert(
        "Najpierw wpisz sensowny opis programu szkolenia, na podstawie którego AI ma wygenerować efekty."
      );
      return;
    }

    setIsGeneratingOutcomes(true);
    try {
      const res = await fetch("/api/generate-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (res.ok && data.outcomes) {
        setLearningOutcomes(data.outcomes);
      } else {
        alert(data.error || "Wystąpił błąd podczas generowania efektów.");
      }
    } catch (error) {
      console.error(error);
      alert("Błąd połączenia z modułem AI.");
    } finally {
      setIsGeneratingOutcomes(false);
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

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setLearningOutcomes("");
    setLevel("");
    setIsCustom(false);
    setDifficulty("medium");
    setQuestions([]);
    setQuestionCount(10);
  };

  const handleEdit = (exam: ExamTemplate) => {
    setEditingId(exam.id);
    setTitle(exam.title);
    setDescription(exam.description || "");
    setLearningOutcomes(exam.learningOutcomes || "");
    setLevel(exam.level || "");
    setIsCustom(exam.isCustom);
    setQuestions(exam.questions || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string, examTitle: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć szkolenie "${examTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExams();
      } else {
        alert("Nie można usunąć szkolenia (być może jest powiązane ze zleceniami).");
      }
    } catch (error) {
      alert("Błąd podczas usuwania.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/exams/${editingId}` : "/api/exams";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          learningOutcomes,
          level,
          isCustom,
          questions,
        }),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchExams();
      } else {
        alert("Wystąpił błąd podczas zapisywania.");
      }
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
  };

  const generatePDF = (exam: ExamTemplate) => {
    if (!exam.questions || exam.questions.length === 0) {
      alert("Ten egzamin nie ma jeszcze pytań.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Proszę zezwolić na wyskakujące okienka (pop-ups), aby wygenerować PDF.");
      return;
    }

    const letters = ["A", "B", "C", "D"];

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <title>Egzamin - ${exam.title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5; }
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
          .key-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
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
          ${exam.questions
            .map(
              (q, index) => `
            <div class="question-block">
              <div class="question-text">${index + 1}. ${q.content}</div>
              <ul class="options">
                ${q.options
                  .map(
                    (opt, optIndex) => `
                  <li class="option">
                    <span class="option-letter">${letters[optIndex]}.</span>
                    <span>${opt}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="page-break"></div>
        <div class="key-title">KLUCZ ODPOWIEDZI DLA EGZAMINATORA (NIE DRUKOWAĆ DLA KURSANTÓW)</div>
        <div class="key-list">
          ${exam.questions
            .map(
              (q, index) => `
            <div class="key-item">
              <strong>Zadanie ${index + 1}:</strong> Prawidłowa odpowiedź: <strong>${letters[q.correctAnswer]}</strong>
            </div>
          `
            )
            .join("")}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const difficultyLabel =
    difficulty === "easy"
      ? "Łatwy"
      : difficulty === "hard"
      ? "Trudny"
      : "Średni";

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Exam Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Pakiety egzaminów
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Zarządzaj wzorami egzaminów, generuj testy i efekty uczenia z użyciem AI
            oraz przygotowuj pakiety gotowe do wykorzystania w procesie certyfikacji.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
        >
          {showForm ? "Anuluj edycję" : "+ Dodaj nowy pakiet"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                  {editingId ? "Edit mode" : "Exam creator"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {editingId
                    ? "Edycja pakietu edukacyjnego"
                    : "Kreator pakietu edukacyjnego"}
                </h2>
              </div>

              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                AI + baza wiedzy
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Nazwa egzaminu
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-[60px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Np. Wózki widłowe"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Poziom
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-[60px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Np. Podstawowy"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-300/80">
                  Opis programu szkolenia
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Wklej tutaj szczegółowy opis, sylabus lub plan szkolenia..."
                />
              </div>

              <div className="md:col-span-2 overflow-hidden rounded-[28px] border border-cyan-300/10 bg-gradient-to-br from-cyan-400/10 via-blue-500/5 to-transparent p-5 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                      Learning outcomes
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Efekty uczenia się
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Każda linia to osobny punkt. Zostaną wykorzystane na certyfikacie.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateOutcomesAI}
                    disabled={isGeneratingOutcomes}
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                  >
                    {isGeneratingOutcomes
                      ? "Generowanie..."
                      : "✨ Generuj z opisu (AI)"}
                  </button>
                </div>

                <textarea
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  className="min-h-[150px] w-full rounded-[20px] border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder={`Nabycie wiedzy z zakresu...\nUmiejętność obsługi...\nZabezpieczenie miejsca wypadku...`}
                />
              </div>

              <div className="md:col-span-2 overflow-hidden rounded-[28px] border border-indigo-300/10 bg-gradient-to-br from-indigo-400/10 via-blue-500/5 to-transparent p-5 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-200/65">
                      AI Generator
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Generator testów AI
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Skonfiguruj poziom trudności i liczbę pytań, a następnie wygeneruj
                      profesjonalny zestaw pytań egzaminacyjnych.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/75">
                        Trudność
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white outline-none transition focus:border-indigo-300/40 focus:ring-4 focus:ring-indigo-300/10"
                      >
                        <option value="easy">🟢 Łatwy</option>
                        <option value="medium">🟡 Średni</option>
                        <option value="hard">🔴 Trudny</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/75">
                        Liczba pytań
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-center text-white outline-none transition focus:border-indigo-300/40 focus:ring-4 focus:ring-indigo-300/10"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="inline-flex h-[56px] w-full items-center justify-center rounded-[18px] border border-indigo-300/15 bg-indigo-400/10 px-5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/15 disabled:opacity-60"
                      >
                        {isGenerating ? "Generowanie..." : "Generuj pytania"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Poziom: {difficultyLabel} • Pytań: {questionCount}
                </div>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="border-t border-white/10 pt-8">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    Questions preview
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Podgląd i edycja testu ({questions.length} pytań)
                  </h3>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="group relative rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6"
                    >
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute right-5 top-5 rounded-full border border-red-400/15 bg-red-500/10 p-2 text-red-200 opacity-0 transition hover:bg-red-500/15 group-hover:opacity-100"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>

                      <div className="mb-5 pr-10">
                        <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                          Pytanie {qIndex + 1}
                        </label>
                        <input
                          type="text"
                          value={q.content}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "content", e.target.value)
                          }
                          className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 font-medium text-white outline-none transition focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex overflow-hidden rounded-[18px] border border-white/10">
                            <span className="flex h-[56px] w-14 items-center justify-center bg-white/[0.06] text-sm font-bold text-slate-300">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                handleOptionChange(qIndex, optIndex, e.target.value)
                              }
                              className="h-[56px] w-full bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:bg-white/[0.06]"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3">
                        <label className="text-sm font-semibold text-emerald-200">
                          Poprawna odpowiedź:
                        </label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "correctAnswer",
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-emerald-300/20 bg-white/[0.08] px-3 py-2 text-sm font-bold text-white outline-none"
                        >
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

            <div className="flex items-center gap-3 border-t border-white/10 pt-6">
              <input
                type="checkbox"
                id="isCustom"
                checked={isCustom}
                onChange={(e) => setIsCustom(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 accent-cyan-300"
              />
              <label
                htmlFor="isCustom"
                className="cursor-pointer text-sm text-slate-300"
              >
                Oznacz jako „Egzamin niestandardowy”
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-8 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
              >
                {editingId ? "Zapisz zmiany" : "Zapisz egzamin w bazie"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="inline-flex items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Anuluj
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Available templates
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Dostępne pakiety w systemie
            </h2>
          </div>

          <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200">
            Łącznie: {exams.length}
          </span>
        </div>

        {isLoading ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">
              Ładowanie danych z bazy...
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Trwa pobieranie pakietów egzaminacyjnych
            </p>
          </div>
        ) : exams.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-white">
              Brak egzaminów w systemie
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Użyj generatora AI, aby stworzyć pierwszy pakiet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-col gap-5 p-6 transition hover:bg-white/[0.03] lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">
                      {exam.title}
                    </h3>

                    {exam.level && (
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
                        {exam.level}
                      </span>
                    )}

                    {exam.isCustom && (
                      <span className="inline-flex rounded-full border border-purple-300/15 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
                        Niestandardowy
                      </span>
                    )}

                    {exam.questions && exam.questions.length > 0 && (
                      <span className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                        Baza: {exam.questions.length} pytań
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
                    {exam.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                  <button
                    onClick={() => handleEdit(exam)}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    Edytuj
                  </button>

                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                  >
                    Usuń
                  </button>

                  {exam.questions && exam.questions.length > 0 && (
                    <button
                      onClick={() => generatePDF(exam)}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-300/15 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Zapisz jako PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}