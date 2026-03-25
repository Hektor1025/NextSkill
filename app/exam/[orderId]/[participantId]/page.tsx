"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Question = {
  id: string;
  content: string;
  options: string[];
};

type ExamData = {
  participant: {
    firstName: string;
    lastName: string;
    testFinished: boolean;
    score: number | null;
    maxScore: number | null;
  };
  exam: {
    id: string;
    title: string;
    questions: Question[];
  };
};

export default function OnlineExamPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const participantId = params.participantId as string;

  const [data, setData] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(
    null
  );

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      const res = await fetch(
        `/api/take-exam?orderId=${orderId}&participantId=${participantId}`
      );
      if (res.ok) {
        setData(await res.json());
      } else {
        alert("Nie udało się załadować egzaminu. Sprawdź poprawność linku.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (!data) return;

    if (Object.keys(answers).length < data.exam.questions.length) {
      if (
        !confirm(
          "Nie odpowiedziałeś na wszystkie pytania. Czy na pewno chcesz zakończyć test?"
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/take-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          participantId,
          examTemplateId: data.exam.id,
          userAnswers: answers,
        }),
      });

      if (res.ok) {
        const resultData = await res.json();
        setResult({ score: resultData.score, maxScore: resultData.maxScore });
      } else {
        alert("Błąd podczas wysyłania testu.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
            <p className="text-lg font-semibold text-white">
              Ładowanie arkusza egzaminacyjnego...
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Trwa przygotowanie testu dla uczestnika
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 px-10 py-8 text-center backdrop-blur-2xl">
            <p className="text-lg font-semibold text-red-100">
              Błąd: brak dostępu do egzaminu
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data.participant.testFinished || result) {
    const finalScore = result?.score ?? data.participant.score ?? 0;
    const finalMax = result?.maxScore ?? data.participant.maxScore ?? 0;
    const percentage = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;
    const passed = percentage >= 50;

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />

        <div className="pointer-events-none absolute left-[8%] top-[8%] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-[10%] top-[15%] h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[35%] h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-[120px]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 px-8 py-10 text-center">
              <div
                className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border ${
                  passed
                    ? "border-emerald-300/20 bg-emerald-400/10"
                    : "border-red-300/20 bg-red-500/10"
                }`}
              >
                {passed ? (
                  <svg
                    className="h-10 w-10 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-10 w-10 text-red-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                Exam finished
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                Egzamin zakończony
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                {data.participant.firstName} {data.participant.lastName}, dziękujemy
                za rozwiązanie testu.
              </p>
            </div>

            <div className="p-8 text-center sm:p-10">
              <div
                className={`rounded-[28px] border p-8 ${
                  passed
                    ? "border-emerald-300/15 bg-emerald-400/10"
                    : "border-red-400/15 bg-red-500/10"
                }`}
              >
                <p
                  className={`text-sm font-semibold uppercase tracking-[0.24em] ${
                    passed ? "text-emerald-200/80" : "text-red-200/80"
                  }`}
                >
                  Wynik końcowy
                </p>

                <h2
                  className={`mt-4 text-3xl font-semibold ${
                    passed ? "text-emerald-100" : "text-red-100"
                  }`}
                >
                  {finalScore} / {finalMax} pkt
                </h2>

                <div className="mt-4 text-6xl font-semibold text-white">
                  {percentage}%
                </div>

                <p
                  className={`mx-auto mt-6 max-w-xl text-sm leading-7 ${
                    passed ? "text-emerald-100/85" : "text-red-100/85"
                  }`}
                >
                  {passed
                    ? "Gratulacje. Egzamin został zaliczony. Oczekuj na wydanie certyfikatu przez swój ośrodek szkoleniowy."
                    : "Niestety nie uzyskałeś wymaganej liczby punktów. Skontaktuj się z osobą prowadzącą szkolenie w celu ustalenia dalszych kroków."}
                </p>
              </div>

              <p className="mt-8 text-xs uppercase tracking-[0.24em] text-slate-500">
                Możesz już bezpiecznie zamknąć to okno
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data.exam.questions.length;
  const progress =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(77,128,255,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(142,243,255,0.10),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(180,156,255,0.10),transparent_28%),linear-gradient(135deg,#02040c_0%,#050b17_28%,#08101d_58%,#03060d_100%)]" />

      <div className="pointer-events-none absolute left-[6%] top-[6%] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[10%] top-[10%] h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[8%] left-[35%] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl flex-1">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 px-6 py-8 text-center sm:px-8">
              <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                Online exam
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {data.exam.title}
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Egzaminowany:{" "}
                <span className="font-semibold text-white">
                  {data.participant.firstName} {data.participant.lastName}
                </span>
              </p>

              <div className="mx-auto mt-6 max-w-xl rounded-[22px] border border-white/10 bg-white/[0.05] p-4 text-left">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.20em] text-slate-500">
                  <span>Postęp</span>
                  <span>
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-8 rounded-[24px] border border-blue-300/10 bg-blue-400/5 p-5 text-sm leading-7 text-slate-300">
                <p className="font-semibold text-white">Instrukcja</p>
                <p className="mt-2">
                  Przeczytaj uważnie każde pytanie. Zaznacz jedną, najbardziej
                  pasującą odpowiedź. Po zakończeniu kliknij przycisk{" "}
                  <span className="font-semibold text-cyan-200">
                    „Zakończ i wyślij test”
                  </span>{" "}
                  na dole strony.
                </p>
              </div>

              <div className="space-y-8">
                {data.exam.questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7"
                  >
                    <h3 className="mb-5 text-lg font-semibold leading-8 text-white sm:text-xl">
                      <span className="mr-3 text-cyan-200">{qIndex + 1}.</span>
                      {q.content}
                    </h3>

                    <div className="space-y-3">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = answers[q.id] === optIndex;

                        return (
                          <label
                            key={optIndex}
                            className={`flex cursor-pointer items-center rounded-[20px] border p-4 transition-all duration-200 ${
                              isSelected
                                ? "border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(142,243,255,0.08)]"
                                : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              className="h-5 w-5 border-white/20 bg-white/10 accent-cyan-300"
                              checked={isSelected}
                              onChange={() => handleOptionSelect(q.id, optIndex)}
                            />
                            <span
                              className={`ml-4 text-base ${
                                isSelected
                                  ? "font-semibold text-white"
                                  : "text-slate-300"
                              }`}
                            >
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 border-t border-white/10 pt-8 text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 px-10 py-4 text-lg font-semibold text-blue-100 transition hover:bg-blue-400/15 disabled:opacity-60 sm:w-auto"
                >
                  {isSubmitting ? "Wysyłanie..." : "Zakończ i wyślij test"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-6 w-full max-w-4xl px-4 pb-6 text-center text-xs leading-6 text-slate-500">
          Administratorem Twoich danych osobowych, w tym imienia, nazwiska oraz
          wyniku testu, jest ośrodek szkoleniowy odpowiedzialny za przeprowadzenie
          tego egzaminu. Platforma certyfikacyjna świadczy wyłącznie usługę
          techniczną polegającą na dostarczeniu oprogramowania egzaminacyjnego.
        </footer>
      </div>
    </div>
  );
}