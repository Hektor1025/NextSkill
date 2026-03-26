"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SessionTimeoutManager from "../../../../components/security/SessionTimeoutManager";
import { maskEmail } from "../../../../lib/masking";
import { getSession } from "next-auth/react";
import { supabase } from "../../../../lib/supabase";
import {
  getOrderStatusMeta,
  getToneClasses,
  type OrderWorkflow,
} from "../../../../lib/order-workflow";

type DocumentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

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
  id?: string;
  content: string;
  options: string[];
  correctAnswer: number;
};

type OrderActivityEvent = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  isDone: boolean;
  tone: "emerald" | "cyan" | "violet" | "yellow" | "slate";
};

type OrderEvent = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  actorEmail: string | null;
  actorRole: "ADMIN" | "CLIENT" | null;
  actorUser?: {
    id: string;
    email: string;
    role: "ADMIN" | "CLIENT";
  } | null;
  metadata?: Record<string, unknown> | null;
};

type OrderNote = {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorEmail: string | null;
  authorRole: "ADMIN" | "CLIENT" | null;
  authorUser?: {
    id: string;
    email: string;
    role: "ADMIN" | "CLIENT";
  } | null;
};

type OrderDetails = {
  id: string;
  status: string;
  invoiceUrl: string | null;
  generatedTestUrl: string | null;
  createdAt: string;
  client: {
    id?: string;
    email: string;
    role?: "ADMIN" | "CLIENT";
    companyName?: string | null;
  };
  examTemplate: {
    id: string;
    title: string;
    description: string;
    questions?: Question[];
  } | null;
  documents: DocumentItem[];
  participants: Participant[];
  workflow: OrderWorkflow;
  activity: OrderActivityEvent[];
  notes: OrderNote[];
  events: OrderEvent[];
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type SessionActor = {
  id: string | null;
  email: string | null;
  role: "ADMIN" | "CLIENT" | null;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    null
  );

  const [toast, setToast] = useState<ToastState>(null);
  const [actor, setActor] = useState<SessionActor>({
    id: null,
    email: null,
    role: null,
  });

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const [gradingScores, setGradingScores] = useState<
    Record<string, { score: string; maxScore: string }>
  >({});

  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [isPinnedNote, setIsPinnedNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    loadSessionActor();
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const loadSessionActor = async () => {
    try {
      const session = await getSession();
      const user = session?.user as
        | { id?: string; email?: string; role?: "ADMIN" | "CLIENT" }
        | undefined;

      setActor({
        id: user?.id ?? null,
        email: user?.email ?? null,
        role: user?.role ?? null,
      });
    } catch (error) {
      console.error("Błąd pobierania sesji:", error);
    }
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3200);
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": actor.id ?? "",
    "x-user-email": actor.email ?? "",
    "x-user-role": actor.role ?? "",
  });

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/admin-orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setStatus(data.status);

        if (data.examTemplate?.questions) {
          setGeneratedQuestions(data.examTemplate.questions);
        } else {
          setGeneratedQuestions([]);
        }
      } else {
        showToast("error", "Nie udało się pobrać danych zlecenia.");
      }
    } catch (error) {
      console.error("Błąd pobierania:", error);
      showToast("error", "Wystąpił błąd pobierania danych.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast("success", "Status zlecenia został zaktualizowany.");
        await fetchOrderDetails();
      } else {
        const data = await res.json().catch(() => null);
        showToast(
          "error",
          data?.error || "Nie udało się zapisać nowego statusu."
        );
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas aktualizacji statusu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInvoice(true);

    try {
      const fileExt = file.name.split(".").pop();
      const safeFileName = `faktura-${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scans")
        .upload(safeFileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("scans")
        .getPublicUrl(safeFileName);

      const res = await fetch(`/api/admin-orders/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ invoiceUrl: publicUrlData.publicUrl }),
      });

      if (res.ok) {
        showToast("success", "Faktura została wgrana.");
        await fetchOrderDetails();
      } else {
        showToast("error", "Nie udało się zapisać faktury w zleceniu.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd wgrywania faktury.");
    } finally {
      setIsUploadingInvoice(false);
      if (invoiceInputRef.current) {
        invoiceInputRef.current.value = "";
      }
    }
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
      const fileExt = file.name.split(".").pop();
      const safeFileName = `certyfikat-${activeParticipantId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scans")
        .upload(safeFileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("scans")
        .getPublicUrl(safeFileName);

      const res = await fetch(`/api/participants/${activeParticipantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateUrl: publicUrlData.publicUrl }),
      });

      if (res.ok) {
        showToast("success", "Certyfikat został przypisany do uczestnika.");
        await fetchOrderDetails();
      } else {
        showToast("error", "Nie udało się przypisać certyfikatu.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd wgrywania certyfikatu.");
    } finally {
      setIsUploadingCert(false);
      setActiveParticipantId(null);
      if (certInputRef.current) {
        certInputRef.current.value = "";
      }
    }
  };

  const submitManualGrade = async (participantId: string) => {
    const scores = gradingScores[participantId];

    if (!scores || !scores.score || !scores.maxScore) {
      showToast(
        "error",
        "Podaj zdobyte punkty i maksymalną liczbę punktów przed zapisem."
      );
      return;
    }

    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: parseInt(scores.score, 10),
          maxScore: parseInt(scores.maxScore, 10),
          testFinished: true,
        }),
      });

      if (res.ok) {
        showToast("success", "Ocena została zapisana.");
        await fetchOrderDetails();
      } else {
        showToast("error", "Nie udało się zapisać oceny.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas zapisu oceny.");
    }
  };

  const handleGenerateAI = async () => {
    if (!order?.examTemplate?.description) {
      showToast("error", "Brak opisu szkolenia w bazie.");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: order.examTemplate.description,
          count: questionCount,
          difficulty,
        }),
      });

      const data = await res.json();

      if (data.questions) {
        setGeneratedQuestions(data.questions);
        showToast("success", "Wygenerowano nowy zestaw pytań AI.");
      } else {
        showToast("error", "AI zwróciło nieoczekiwany format danych.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd połączenia z modułem AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...generatedQuestions];
    if (field === "content") {
      newQuestions[index].content = value;
    } else if (field === "correctAnswer") {
      newQuestions[index].correctAnswer = Number(value);
    }
    setGeneratedQuestions(newQuestions);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
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
          questions: generatedQuestions,
        }),
      });

      if (res.ok) {
        showToast("success", "Pytania zapisano. Otwieram arkusz do druku.");
        await fetchOrderDetails();
        printExamPDF(generatedQuestions);
      } else {
        showToast("error", "Wystąpił błąd podczas zapisywania pytań.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd połączenia przy zapisie pytań.");
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const printExamPDF = (questionsToPrint: Question[]) => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      showToast(
        "error",
        "Przeglądarka zablokowała okno druku. Zezwól na pop-upy."
      );
      return;
    }

    const letters = ["A", "B", "C", "D"];
    const htmlContent = `
      <!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Egzamin - ${
        order?.examTemplate?.title
      }</title>
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
          ${questionsToPrint
            .map(
              (q, index) => `
            <div class="question-block">
              <div class="question-text">${index + 1}. ${q.content}</div>
              <ul class="options">
                ${q.options
                  .map(
                    (opt, optIndex) =>
                      `<li class="option"><span class="option-letter">${letters[optIndex]}.</span> <span>${opt}</span></li>`
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
          ${questionsToPrint
            .map(
              (q, index) => `
            <div class="key-item"><strong>Zadanie ${
              index + 1
            }:</strong> Poprawna: <strong>${letters[q.correctAnswer]}</strong></div>
          `
            )
            .join("")}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!order || order.participants.length === 0) {
      showToast("info", "Brak danych uczestników do eksportu.");
      return;
    }

    const headers = [
      "Imię",
      "Nazwisko",
      "Data Urodzenia",
      "Miejsce Urodzenia",
      "Zdobyte Punkty",
      "Maks. Punkty",
      "Procent",
      "Wynik Walidacji",
      "Status Testu",
    ];

    const rows = order.participants.map((participant) => {
      const proc =
        participant.score !== null && participant.maxScore
          ? Math.round((participant.score / participant.maxScore) * 100)
          : 0;

      const wynik = participant.testFinished
        ? proc >= 51
          ? "Pozytywny"
          : "Negatywny"
        : "Brak danych";

      const statusText = participant.testFinished ? "Zakończony" : "Oczekuje";

      return [
        participant.firstName,
        participant.lastName,
        participant.birthDate,
        participant.birthPlace || "-",
        participant.score !== null ? participant.score : "-",
        participant.maxScore !== null ? participant.maxScore : "-",
        participant.testFinished ? `${proc}%` : "-",
        wynik,
        statusText,
      ];
    });

    const csvContent = [headers.join(";"), ...rows.map((e) => e.join(";"))].join(
      "\n"
    );

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "Zlecenie_Raport.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "Eksport CSV został przygotowany.");
  };

  const saveInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim()) {
      showToast("error", "Treść notatki nie może być pusta.");
      return;
    }

    setIsSavingNote(true);

    try {
      const res = await fetch(`/api/admin-orders/${orderId}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: newNote.trim(),
          isPinned: isPinnedNote,
        }),
      });

      if (res.ok) {
        setNewNote("");
        setIsPinnedNote(false);
        showToast("success", "Dodano notatkę wewnętrzną.");
        await fetchOrderDetails();
      } else {
        const data = await res.json().catch(() => null);
        showToast("error", data?.error || "Nie udało się zapisać notatki.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas zapisu notatki.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const statusMeta = useMemo(
    () => (order ? getOrderStatusMeta(order.status) : null),
    [order]
  );

  const positiveParticipantsCount = useMemo(() => {
    if (!order) return 0;
    return order.participants.filter(
      (participant) =>
        participant.score !== null &&
        participant.maxScore !== null &&
        participant.maxScore > 0 &&
        participant.score / participant.maxScore >= 0.51
    ).length;
  }, [order]);

  const readyForCertificatesCount = useMemo(() => {
    if (!order) return 0;
    return order.participants.filter(
      (participant) => participant.testFinished
    ).length;
  }, [order]);

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "NEW":
        return (
          <span className="inline-flex rounded-full border border-yellow-300/15 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            1. Nowe
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
            2. Potwierdzone
          </span>
        );
      case "TEST_READY":
        return (
          <span className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            3. Testy gotowe
          </span>
        );
      case "SCANS_UPLOADED":
        return (
          <span className="inline-flex rounded-full border border-purple-300/15 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
            Weryfikacja
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            4. Zakończone
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
            {statusValue}
          </span>
        );
    }
  };

  const getToastClasses = () => {
    if (!toast) return "";
    if (toast.type === "success") {
      return "border-emerald-300/15 bg-emerald-400/10 text-emerald-100";
    }
    if (toast.type === "error") {
      return "border-rose-300/15 bg-rose-400/10 text-rose-100";
    }
    return "border-cyan-300/15 bg-cyan-400/10 text-cyan-100";
  };

  const getProgressBarClass = (progress: number) => {
    if (progress >= 100) {
      return "bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-300";
    }
    if (progress >= 60) {
      return "bg-gradient-to-r from-blue-300 via-cyan-300 to-violet-300";
    }
    if (progress >= 30) {
      return "bg-gradient-to-r from-yellow-300 via-blue-300 to-cyan-300";
    }
    return "bg-gradient-to-r from-yellow-300 via-orange-300 to-rose-300";
  };

  const getActivityToneClasses = (
    tone: "emerald" | "cyan" | "violet" | "yellow" | "slate"
  ) => {
    switch (tone) {
      case "emerald":
        return "border-emerald-300/15 bg-emerald-400/10 text-emerald-200";
      case "cyan":
        return "border-cyan-300/15 bg-cyan-400/10 text-cyan-200";
      case "violet":
        return "border-violet-300/15 bg-violet-400/10 text-violet-200";
      case "yellow":
        return "border-yellow-300/15 bg-yellow-400/10 text-yellow-200";
      default:
        return "border-white/10 bg-white/[0.05] text-slate-300";
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-white">
            Wczytywanie szczegółów zlecenia...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie danych operacyjnych
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 px-10 py-8 text-center backdrop-blur-2xl">
          <p className="text-lg font-semibold text-red-100">
            Nie znaleziono zlecenia
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionTimeoutManager timeoutMinutes={30} warningSeconds={60} />
      {toast && (
        <div className="fixed right-5 top-5 z-[90] max-w-sm">
          <div
            className={`rounded-[22px] border px-5 py-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${getToastClasses()}`}
          >
            <p className="text-sm font-semibold leading-6">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Wróć do listy zleceń
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
                  Order command center
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white">
                  {order.examTemplate?.title || "Brak nazwy"}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-xs font-bold text-slate-300">
                    #{order.id.split("-")[0]}
                  </span>
                  {getStatusBadge(order.status)}
                  {statusMeta && (
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getToneClasses(
                        statusMeta.tone
                      )}`}
                    >
                      {statusMeta.label}
                    </span>
                  )}
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">
                  Ten widok skupia cały proces operacyjny w jednym miejscu:
                  dokumenty, workflow, oceny, certyfikaty, notatki i historię działań.
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-4">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Postęp
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {order.workflow.progressPercent}%
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Uczestnicy
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-cyan-200">
                    {order.workflow.stats.participantCount}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Pozytywne wyniki
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-200">
                    {positiveParticipantsCount}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Certyfikaty
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-violet-200">
                    {order.workflow.stats.certificatesReadyCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-300">
                  Postęp procesu
                </span>
                <span className="font-semibold text-white">
                  {order.workflow.progressPercent}%
                </span>
              </div>

              <div className="h-3 rounded-full border border-white/8 bg-white/[0.05] p-[2px]">
                <div
                  className={`h-full rounded-full ${getProgressBarClass(
                    order.workflow.progressPercent
                  )}`}
                  style={{ width: `${order.workflow.progressPercent}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {order.workflow.steps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`rounded-[20px] border px-4 py-4 ${
                      step.isDone
                        ? "border-emerald-300/15 bg-emerald-400/10"
                        : step.isCurrent
                        ? "border-cyan-300/15 bg-cyan-400/10"
                        : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          step.isDone
                            ? "bg-emerald-300 text-slate-950"
                            : step.isCurrent
                            ? "bg-cyan-300 text-slate-950"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {step.label}
                      </p>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
                  Następny krok administracyjny
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {order.workflow.nextActionTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {order.workflow.nextActionDescription}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Checklista braków
                </p>

                {order.workflow.missingItems.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.workflow.missingItems.map((item) => (
                      <span
                        key={item.key}
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          item.isBlocking
                            ? "border-rose-300/15 bg-rose-400/10 text-rose-200"
                            : "border-yellow-300/15 bg-yellow-400/10 text-yellow-200"
                        }`}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-emerald-200">
                    Zlecenie nie ma obecnie braków krytycznych.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Ośrodek
              </p>
              <p className="mt-2 text-sm font-medium text-slate-200">
                {order.client.companyName || order.client.email}
              </p>
              <p className="mt-1 text-xs text-slate-500">
  Kontakt: {maskEmail(order.client.email)}
</p>
              <p className="mt-1 text-xs text-slate-500">
                Data utworzenia: {formatDate(order.createdAt)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Ocenieni
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {order.workflow.stats.gradedParticipantsCount}
                  </p>
                </div>

                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Gotowi do cert.
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {readyForCertificatesCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Dokumenty księgowe
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Faktura i załączniki
              </h2>
            </div>

            <div className="p-6">
              {order.invoiceUrl ? (
                <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-400/10 p-5">
                  <p className="text-sm font-semibold text-emerald-200">
                    Faktura została wgrana
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={order.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-2xl border border-emerald-300/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-white/[0.08]"
                    >
                      Podgląd pliku
                    </a>

                    <button
                      type="button"
                      onClick={() => invoiceInputRef.current?.click()}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                    >
                      Zmień plik
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                  <button
                    type="button"
                    onClick={() => invoiceInputRef.current?.click()}
                    disabled={isUploadingInvoice}
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                  >
                    {isUploadingInvoice ? "Wgrywanie..." : "+ Dodaj fakturę"}
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={invoiceInputRef}
                onChange={handleInvoiceUpload}
                className="hidden"
                accept=".pdf,.jpg,.png"
              />

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Dokumenty przesłane w zleceniu
                </p>

                {order.documents.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {order.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {document.fileName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Dodano: {formatDate(document.createdAt)}
                          </p>
                        </div>

                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                        >
                          Otwórz
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                    Brak dokumentów przesłanych bezpośrednio do zlecenia.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Workflow
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Zarządzanie statusem
              </h2>
            </div>

            <div className="p-6">
              <form
                onSubmit={handleStatusUpdate}
                className="rounded-[24px] border border-blue-300/10 bg-blue-400/5 p-5"
              >
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mb-4 h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white outline-none transition focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                >
                  <option value="NEW">1. Nowe zlecenie (Oczekuje)</option>
                  <option value="CONFIRMED">
                    2. Potwierdzenie zlecenia (Klient dodaje osoby)
                  </option>
                  <option value="TEST_READY">
                    3. Testy gotowe (Wydawanie arkuszy)
                  </option>
                  <option value="SCANS_UPLOADED">
                    -- Weryfikacja (Trwa sprawdzanie) --
                  </option>
                  <option value="COMPLETED">
                    4. Walidacja zakończona (Certyfikaty)
                  </option>
                </select>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center rounded-[18px] border border-blue-300/15 bg-blue-400/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-60"
                >
                  {isSaving ? "Zapisywanie..." : "Zapisz i powiadom klienta"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {order.activity.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getActivityToneClasses(
                            event.tone
                          )}`}
                        >
                          {event.isDone ? "Done" : "Pending"}
                        </span>
                        <p className="truncate text-sm font-semibold text-white">
                          {event.title}
                        </p>
                      </div>

                      {event.date && (
                        <span className="text-xs text-slate-500">
                          {formatShortDate(event.date)}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {(order.status === "NEW" ||
          order.status === "CONFIRMED" ||
          order.status === "TEST_READY") && (
          <section className="overflow-hidden rounded-[32px] border border-indigo-300/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 bg-gradient-to-br from-indigo-400/10 via-blue-500/5 to-transparent p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-200/65">
                    AI Generator
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Inteligentny generator arkuszy
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Wygeneruj unikalny test egzaminacyjny dla tego klienta na
                    podstawie opisu szkolenia, a następnie zapisz pytania i
                    przygotuj arkusze PDF.
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
                      {isGenerating ? "Generowanie..." : "Losuj test AI"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {generatedQuestions.length > 0 && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    Questions preview
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Podgląd i edycja testu dla ośrodka ({generatedQuestions.length}{" "}
                    pytań)
                  </h3>
                </div>

                <div className="mb-6 max-h-[620px] space-y-5 overflow-y-auto pr-2">
                  {generatedQuestions.map((question, qIndex) => (
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
                          value={question.content}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "content", e.target.value)
                          }
                          className="h-[56px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 font-medium text-white outline-none transition focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className="flex overflow-hidden rounded-[18px] border border-white/10"
                          >
                            <span className="flex h-[56px] w-14 items-center justify-center bg-white/[0.06] text-sm font-bold text-slate-300">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <input
                              type="text"
                              value={option}
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
                          value={question.correctAnswer}
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={saveQuestionsAndGeneratePDF}
                    disabled={isSavingQuestions}
                    className="inline-flex items-center justify-center rounded-[18px] border border-indigo-300/15 bg-indigo-400/10 px-6 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/15 disabled:opacity-60"
                  >
                    <svg
                      className="mr-2 h-5 w-5"
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
                    {isSavingQuestions
                      ? "Zapisywanie..."
                      : "Zapisz test i generuj arkusze PDF"}
                  </button>

                  <p className="text-xs text-slate-400">
                    Kliknięcie zapisze nowy test w bazie online i otworzy okno druku.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Participants & grading
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Uczestnicy szkolenia
                </h2>
              </div>

              {order.participants.length > 0 && (
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
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
                  Eksport CSV
                </button>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <input
                type="file"
                ref={certInputRef}
                onChange={handleCertUpload}
                className="hidden"
                accept=".pdf,.jpg,.png"
              />

              {order.participants.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
                  <p className="text-lg font-medium text-white">
                    Brak uczestników w tym zleceniu
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Ośrodek nie wprowadził jeszcze żadnych kursantów.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[24px] border border-white/8">
                  <table className="w-full min-w-[1100px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/[0.03] text-left text-slate-500">
                        <th className="p-4 font-medium">Imię i nazwisko</th>
                        <th className="p-4 text-center font-medium">
                          Ocena / Status
                        </th>
                        <th className="p-4 text-right font-medium">
                          Certyfikat / Akcje
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/8">
                      {order.participants.map((participant) => {
                        const positive =
                          participant.score !== null &&
                          participant.maxScore !== null &&
                          participant.maxScore > 0
                            ? participant.score / participant.maxScore >= 0.51
                            : false;

                        return (
                          <tr
                            key={participant.id}
                            className="transition hover:bg-white/[0.03]"
                          >
                            <td className="p-4">
                              <p className="font-semibold text-white">
                                {participant.firstName} {participant.lastName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {participant.birthDate} •{" "}
                                {participant.birthPlace || "brak miejsca urodzenia"}
                              </p>

                              {participant.scannedTestUrl && (
                                <div className="mt-3">
                                  <a
                                    href={participant.scannedTestUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-xl border border-indigo-300/15 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-400/15"
                                  >
                                    <svg
                                      className="mr-1 h-3 w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.8"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    Otwórz wgrany skan testu
                                  </a>
                                </div>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              {participant.testFinished ? (
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    positive
                                      ? "border border-emerald-300/15 bg-emerald-400/10 text-emerald-200"
                                      : "border border-red-400/15 bg-red-500/10 text-red-200"
                                  }`}
                                >
                                  {participant.score}/{participant.maxScore} pkt
                                </span>
                              ) : participant.scannedTestUrl ? (
                                <div className="flex flex-col items-center gap-3">
                                  <span className="inline-flex rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200">
                                    Wymaga oceny ręcznej
                                  </span>

                                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                                    <input
                                      type="number"
                                      placeholder="Pkt"
                                      className="h-10 w-16 rounded-xl border border-white/10 bg-white/[0.05] px-2 text-center text-xs text-white outline-none focus:border-blue-300/40"
                                      value={gradingScores[participant.id]?.score || ""}
                                      onChange={(e) =>
                                        setGradingScores({
                                          ...gradingScores,
                                          [participant.id]: {
                                            ...gradingScores[participant.id],
                                            score: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                    <span className="text-xs font-bold text-slate-500">
                                      /
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="Max"
                                      className="h-10 w-16 rounded-xl border border-white/10 bg-white/[0.05] px-2 text-center text-xs text-white outline-none focus:border-blue-300/40"
                                      value={
                                        gradingScores[participant.id]?.maxScore || ""
                                      }
                                      onChange={(e) =>
                                        setGradingScores({
                                          ...gradingScores,
                                          [participant.id]: {
                                            ...gradingScores[participant.id],
                                            maxScore: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => submitManualGrade(participant.id)}
                                      className="inline-flex items-center justify-center rounded-xl border border-orange-300/15 bg-orange-400/10 px-3 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-400/15"
                                    >
                                      Zapisz
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs italic text-slate-500">
                                  Oczekuje na arkusz
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              {participant.certificateUrl ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-xs font-semibold text-emerald-200">
                                    Wgrany
                                  </span>
                                  <a
                                    href={participant.certificateUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                                  >
                                    Podgląd
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => triggerCertUpload(participant.id)}
                                    className="text-xs font-semibold text-cyan-200 transition hover:text-white"
                                  >
                                    Zmień
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => triggerCertUpload(participant.id)}
                                  disabled={isUploadingCert}
                                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-60"
                                >
                                  {isUploadingCert &&
                                  activeParticipantId === participant.id
                                    ? "Wgrywanie..."
                                    : "+ Ręczny certyfikat"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Internal notes
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Notatki wewnętrzne
                </h2>
              </div>

              <div className="p-6">
                <form onSubmit={saveInternalNote} className="space-y-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                    placeholder="Dodaj prywatną notatkę operacyjną do tego zlecenia..."
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-300/30"
                  />

                  <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={isPinnedNote}
                      onChange={(e) => setIsPinnedNote(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/[0.05]"
                    />
                    Przypnij notatkę na górze
                  </label>

                  <button
                    type="submit"
                    disabled={isSavingNote}
                    className="inline-flex items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                  >
                    {isSavingNote ? "Zapisywanie..." : "Dodaj notatkę"}
                  </button>
                </form>

                <div className="mt-6 space-y-3">
                  {order.notes.length > 0 ? (
                    order.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {note.isPinned && (
                              <span className="inline-flex rounded-full border border-yellow-300/15 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-200">
                                Pinned
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {note.authorEmail ||
                                note.authorUser?.email ||
                                "Nieznany autor"}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-7 text-slate-200">
                          {note.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                      Brak notatek wewnętrznych dla tego zlecenia.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Event log
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Dziennik zdarzeń
                </h2>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-6">
                {order.events.length > 0 ? (
                  <div className="space-y-4">
                    {order.events.map((event, index) => (
                      <div key={event.id} className="relative pl-12">
                        {index < order.events.length - 1 && (
                          <div className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-px bg-white/10" />
                        )}

                        <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                          •
                        </div>

                        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-white">
                              {event.title}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>

                          <p className="mt-2 text-xs leading-6 text-slate-400">
                            {event.description}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                              {event.type}
                            </span>
                            <span>
                              {event.actorEmail ||
                                event.actorUser?.email ||
                                "System / nieznany użytkownik"}
                            </span>
                            {event.actorRole && (
                              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                                {event.actorRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                    Brak zdarzeń zapisanych dla tego zlecenia.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </>
  );
}