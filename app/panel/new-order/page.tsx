"use client";

import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ExamTemplate = {
  id: string;
  title: string;
  description: string;
};

export default function NewOrderPage() {
  const [exams, setExams] = useState<ExamTemplate[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
      console.error("Błąd pobierania egzaminów:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setIsSubmitting(true);

    try {
      const session = await getSession();
      // @ts-ignore
      const clientId = session?.user?.id;

      if (!clientId) {
        alert("Błąd autoryzacji. Spróbuj zalogować się ponownie.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examTemplateId: selectedExamId,
          clientId: clientId,
        }),
      });

      if (res.ok) {
        router.push("/panel/history");
      } else {
        alert("Wystąpił błąd podczas zapisywania zlecenia.");
      }
    } catch (error) {
      console.error("Błąd połączenia:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
          <p className="text-lg font-semibold text-white">
            Ładowanie dostępnych egzaminów...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie pakietów z bazy systemu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                New order
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Nowe zlecenie egzaminu
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Wybierz pakiet egzaminacyjny z dostępnej bazy i rozpocznij proces
                certyfikacji dla swojego ośrodka.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Wybierz rodzaj egzaminu
              </label>

              {exams.length === 0 ? (
                <div className="rounded-[24px] border border-orange-300/15 bg-orange-400/10 p-5 text-sm text-orange-200">
                  Administrator nie dodał jeszcze żadnych pakietów egzaminacyjnych
                  do systemu.
                </div>
              ) : (
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="h-[60px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/10"
                >
                  <option value="" disabled className="text-slate-900">
                    -- Kliknij, aby rozwinąć listę --
                  </option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id} className="text-slate-900">
                      {exam.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedExam && (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Opis pakietu
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {selectedExam.title}
                </h3>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                  {selectedExam.description}
                </p>
              </div>
            )}

            <div className="border-t border-white/10 pt-6 flex justify-end">
              <button
                type="submit"
                disabled={!selectedExamId || isSubmitting}
                className={`inline-flex items-center justify-center rounded-[20px] px-8 py-4 text-sm font-semibold transition ${
                  !selectedExamId || isSubmitting
                    ? "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
                    : "border border-cyan-300/15 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15"
                }`}
              >
                {isSubmitting
                  ? "Przetwarzanie..."
                  : "Utwórz zlecenie i przejdź dalej"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}