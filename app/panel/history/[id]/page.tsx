"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SessionTimeoutManager from "../../../../components/security/SessionTimeoutManager";
import { supabase } from "../../../../lib/supabase";
import {
  getOrderStatusMeta,
  getToneClasses,
  type OrderWorkflow,
} from "../../../../lib/order-workflow";

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type DocumentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
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
  examTemplate: {
    id: string;
    title: string;
    description: string;
    learningOutcomes?: string | null;
    questions?: Question[];
  } | null;
  participants: Participant[];
  documents: DocumentItem[];
  workflow: OrderWorkflow;
};

export default function ClientOrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(
    null
  );

  const [activeScanParticipantId, setActiveScanParticipantId] = useState<
    string | null
  >(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const participantScanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const statusMeta = useMemo(
    () => (order ? getOrderStatusMeta(order.status) : null),
    [order]
  );

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3200);
  };

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/client-orders/${orderId}`);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        showToast("error", data?.error || "Nie udało się pobrać szczegółów.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd pobierania szczegółów zlecenia.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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

  const resetParticipantForm = () => {
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setBirthPlace("");
  };

  const handleAddParticipant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!order) return;

    if (!firstName || !lastName || !birthDate) {
      showToast("error", "Uzupełnij imię, nazwisko i datę urodzenia.");
      return;
    }

    setIsAddingParticipant(true);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          firstName,
          lastName,
          birthDate,
          birthPlace,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się dodać uczestnika.");
      }

      resetParticipantForm();
      showToast("success", "Uczestnik został dodany.");
      await fetchOrderDetails();
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas dodawania uczestnika.");
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setIsAddingParticipant(true);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const newParticipants: Array<{
        orderId: string;
        firstName: string;
        lastName: string;
        birthDate: string;
        birthPlace: string;
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const [fName, lName, bDate, bPlace] = lines[i]
          .split(";")
          .map((value) => value.trim().replace(/"/g, ""));

        if (fName && lName && bDate) {
          newParticipants.push({
            orderId: order.id,
            firstName: fName,
            lastName: lName,
            birthDate: bDate,
            birthPlace: bPlace || "-",
          });
        }
      }

      if (newParticipants.length === 0) {
        throw new Error(
          "Nie znaleziono poprawnych danych. Format: Imię;Nazwisko;Data urodzenia;Miejsce."
        );
      }

      const res = await fetch("/api/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participants: newParticipants,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się zapisać importu.");
      }

      showToast(
        "success",
        `Zaimportowano ${newParticipants.length} uczestników z pliku CSV.`
      );
      await fetchOrderDetails();
    } catch (error) {
      console.error(error);
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Wystąpił błąd przetwarzania pliku CSV."
      );
    } finally {
      setIsAddingParticipant(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const confirmDeleteParticipant = (participant: Participant) => {
    setParticipantToDelete(participant);
  };

  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return;

    try {
      const res = await fetch(`/api/participants/${participantToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się usunąć uczestnika.");
      }

      showToast(
        "success",
        `Usunięto uczestnika: ${participantToDelete.firstName} ${participantToDelete.lastName}.`
      );
      setParticipantToDelete(null);
      await fetchOrderDetails();
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas usuwania uczestnika.");
    }
  };

  const triggerParticipantScan = (participantId: string) => {
    setActiveScanParticipantId(participantId);
    participantScanInputRef.current?.click();
  };

  const handleParticipantScanUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !activeScanParticipantId || !order?.examTemplate?.id) {
      return;
    }

    setIsUploading(true);

    try {
      const blobsToUpload: Blob[] = [];

      if (file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        const majorVersion = parseInt(pdfjsLib.version.split(".")[0], 10);
        const workerExt = majorVersion >= 4 ? "mjs" : "js";
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${workerExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.92)
          );

          if (blob) {
            blobsToUpload.push(blob);
          }
        }
      } else {
        blobsToUpload.push(file);
      }

      if (blobsToUpload.length === 0) {
        throw new Error("Nie udało się odczytać pliku do przesłania.");
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < blobsToUpload.length; i++) {
        const safeFileName = `skan-${activeScanParticipantId}-${Date.now()}-${
          i + 1
        }.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("scans")
          .upload(safeFileName, blobsToUpload[i]);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("scans")
          .getPublicUrl(safeFileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const res = await fetch(`/api/grade-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: activeScanParticipantId,
          fileUrls: uploadedUrls,
          examTemplateId: order.examTemplate.id,
        }),
      });

      if (!res.ok) {
        showToast(
          "info",
          "Skan został przesłany, ale nie udało się go ocenić automatycznie. Administrator może zweryfikować go ręcznie."
        );
      } else {
        const data = await res.json();
        if (data?.requiresManualGrading) {
          showToast("info", data.message || "Skan wymaga ręcznej weryfikacji.");
        } else {
          showToast("success", "Skan został oceniony pomyślnie.");
        }
      }

      await fetchOrderDetails();
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas przetwarzania skanu.");
    } finally {
      setIsUploading(false);
      setActiveScanParticipantId(null);
      if (participantScanInputRef.current) {
        participantScanInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const safeFileName = `${order.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scans")
        .upload(safeFileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("scans")
        .getPublicUrl(safeFileName);

      const res = await fetch(`/api/client-orders/${order.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: publicUrlData.publicUrl,
          fileType: file.type || "unknown",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się zapisać dokumentu.");
      }

      showToast("success", "Dokument został przesłany do zlecenia.");
      await fetchOrderDetails();
    } catch (error) {
      console.error(error);
      showToast("error", "Wystąpił błąd podczas wgrywania dokumentu.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const generatePrintableSheets = () => {
    if (!order?.examTemplate?.questions || order.examTemplate.questions.length === 0) {
      showToast("error", "Brak pytań do wygenerowania arkusza.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const questionsHtml = order.examTemplate.questions
      .map(
        (question, index) => `
          <section class="question">
            <div class="question-header">
              <span class="index">${index + 1}</span>
              <h3>${escapeHtml(question.content)}</h3>
            </div>

            <ul>
              ${question.options
                .map(
                  (option, optionIndex) => `
                    <li>
                      <span class="option-label">${String.fromCharCode(
                        65 + optionIndex
                      )}</span>
                      <span>${escapeHtml(option)}</span>
                    </li>
                  `
                )
                .join("")}
            </ul>
          </section>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pl">
        <head>
          <meta charset="UTF-8" />
          <title>Arkusz egzaminacyjny</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: Arial, sans-serif;
              color: #111827;
              background: #ffffff;
            }

            .header {
              margin-bottom: 28px;
              padding-bottom: 18px;
              border-bottom: 2px solid #e5e7eb;
            }

            .eyebrow {
              font-size: 12px;
              letter-spacing: 0.25em;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 12px;
            }

            h1 {
              margin: 0 0 8px 0;
              font-size: 28px;
              line-height: 1.2;
            }

            .meta {
              color: #475569;
              font-size: 14px;
              line-height: 1.8;
            }

            .question {
              page-break-inside: avoid;
              margin: 0 0 24px 0;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              background: #f8fafc;
            }

            .question-header {
              display: flex;
              gap: 14px;
              align-items: flex-start;
              margin-bottom: 14px;
            }

            .index {
              display: inline-flex;
              width: 30px;
              height: 30px;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              background: #dbeafe;
              color: #1d4ed8;
              font-weight: 700;
              font-size: 14px;
              flex-shrink: 0;
            }

            h3 {
              margin: 2px 0 0 0;
              font-size: 17px;
              line-height: 1.5;
            }

            ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }

            li {
              display: flex;
              gap: 12px;
              align-items: flex-start;
              padding: 10px 0;
              border-top: 1px dashed #d1d5db;
            }

            li:first-child {
              border-top: none;
            }

            .option-label {
              display: inline-flex;
              width: 26px;
              height: 26px;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              border: 1px solid #cbd5e1;
              font-weight: 700;
              font-size: 13px;
              flex-shrink: 0;
            }

            @media print {
              body {
                padding: 18px;
              }
            }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="eyebrow">Arkusz egzaminacyjny</div>
            <h1>${escapeHtml(order.examTemplate.title)}</h1>
            <div class="meta">
              <div>ID zlecenia: ${escapeHtml(order.id.split("-")[0])}</div>
              <div>Data wygenerowania: ${escapeHtml(
                new Date().toLocaleDateString("pl-PL")
              )}</div>
            </div>
          </header>

          ${questionsHtml}
        </body>
      </html>
    `;

    const popup = window.open("", "_blank", "noopener,noreferrer");

    if (!popup) {
      showToast("error", "Przeglądarka zablokowała okno wydruku.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();

    setTimeout(() => {
      popup.print();
    }, 400);
  };

  const copyOrderExamLink = async (participantId: string) => {
    try {
      const url = `${window.location.origin}/exam/${orderId}?participantId=${participantId}`;
      await navigator.clipboard.writeText(url);
      showToast("success", "Link do egzaminu został skopiowany.");
    } catch (error) {
      console.error(error);
      showToast("error", "Nie udało się skopiować linku.");
    }
  };

  const timelineEvents = useMemo(() => {
    if (!order) return [];

    const events: Array<{
      id: string;
      title: string;
      description: string;
      isDone: boolean;
      date?: string;
    }> = [
      {
        id: "created",
        title: "Złożono zamówienie",
        description: "Zlecenie zostało utworzone w systemie.",
        isDone: true,
        date: order.createdAt,
      },
      {
        id: "invoice",
        title: "Faktura",
        description: order.invoiceUrl
          ? "Faktura jest dostępna do pobrania."
          : "Faktura nie została jeszcze udostępniona.",
        isDone: !!order.invoiceUrl,
      },
      {
        id: "participants",
        title: "Lista uczestników",
        description:
          order.workflow.stats.participantCount > 0
            ? `Dodano ${order.workflow.stats.participantCount} uczestników.`
            : "Lista uczestników nie została jeszcze uzupełniona.",
        isDone: order.workflow.stats.participantCount > 0,
      },
      {
        id: "tests",
        title: "Arkusze i materiały",
        description: order.workflow.stats.testsReady
          ? "Materiały egzaminacyjne są gotowe."
          : "Materiały nie zostały jeszcze przygotowane.",
        isDone: order.workflow.stats.testsReady,
      },
      {
        id: "scans",
        title: "Skany / dokumenty",
        description: order.workflow.stats.scansUploaded
          ? "Do zlecenia zostały dostarczone skany lub dokumenty."
          : "System oczekuje na skany lub dokumenty do weryfikacji.",
        isDone: order.workflow.stats.scansUploaded,
      },
      {
        id: "verification",
        title: "Weryfikacja wyników",
        description:
          order.workflow.stats.gradedParticipantsCount > 0
            ? `Oceniono ${order.workflow.stats.gradedParticipantsCount} uczestników.`
            : "Weryfikacja nie została jeszcze zakończona.",
        isDone:
          order.workflow.stats.participantCount > 0 &&
          order.workflow.stats.gradedParticipantsCount ===
            order.workflow.stats.participantCount,
      },
      {
        id: "certificates",
        title: "Certyfikaty",
        description:
          order.workflow.stats.certificatesReadyCount > 0
            ? `Udostępniono ${order.workflow.stats.certificatesReadyCount} certyfikatów.`
            : "Certyfikaty nie zostały jeszcze opublikowane.",
        isDone:
          order.workflow.stats.participantCount > 0 &&
          order.workflow.stats.certificatesReadyCount ===
            order.workflow.stats.participantCount,
      },
    ];

    return events;
  }, [order]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl">
          <div className="h-8 w-60 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 h-3 w-full animate-pulse rounded-full bg-white/10" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="h-[320px] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
          <div className="h-[320px] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
        </div>

        <div className="h-[420px] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[36px] border border-rose-300/15 bg-rose-400/10 px-6 py-16 text-center backdrop-blur-2xl">
        <h2 className="text-2xl font-semibold text-white">
          Nie znaleziono zlecenia
        </h2>
        <p className="mt-3 text-sm leading-7 text-rose-100/85">
          To zlecenie nie istnieje lub nie zostało jeszcze poprawnie zapisane.
        </p>
        <div className="mt-8">
          <Link
            href="/panel/history"
            className="inline-flex items-center rounded-[20px] border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
          >
            Wróć do historii
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionTimeoutManager timeoutMinutes={30} warningSeconds={60} />
      {toast && (
        <div className="fixed right-5 top-5 z-[80] max-w-sm">
          <div
            className={`rounded-[22px] border px-5 py-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${getToastClasses()}`}
          >
            <p className="text-sm font-semibold leading-6">{toast.message}</p>
          </div>
        </div>
      )}

      {participantToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-5 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b1220]/95 p-7 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-rose-200/70">
              Potwierdzenie akcji
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Usunąć uczestnika?
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Za chwilę usuniesz z listy uczestnika{" "}
              <span className="font-semibold text-white">
                {participantToDelete.firstName} {participantToDelete.lastName}
              </span>
              . Ta operacja nie cofnie się automatycznie.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="inline-flex items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteParticipant}
                className="inline-flex items-center justify-center rounded-[18px] border border-rose-300/15 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15"
              >
                Usuń uczestnika
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvUpload}
      />

      <input
        ref={participantScanInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleParticipantScanUpload}
      />

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,243,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(128,170,255,0.10),transparent_24%)]" />
          <div className="relative z-10">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/panel/history"
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
                  >
                    ← Historia
                  </Link>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusMeta ? getToneClasses(statusMeta.tone) : ""
                    }`}
                  >
                    {statusMeta?.label}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                  {order.examTemplate?.title || "Usunięty pakiet egzaminacyjny"}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
                  <span>ID: {order.id.split("-")[0]}</span>
                  <span>Utworzono: {formatDate(order.createdAt)}</span>
                  <span>Uczestnicy: {order.workflow.stats.participantCount}</span>
                  <span>Dokumenty: {order.workflow.stats.documentsCount}</span>
                </div>

                {order.examTemplate?.description && (
                  <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300">
                    {order.examTemplate.description}
                  </p>
                )}
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-4 xl:max-w-[320px]">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Postęp
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {order.workflow.progressPercent}%
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Certyfikaty
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-200">
                    {order.workflow.stats.certificatesReadyCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">Pasek postępu</span>
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
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
              Co musisz zrobić teraz
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {order.workflow.nextActionTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {order.workflow.nextActionDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-[18px] border border-blue-300/15 bg-blue-400/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-60"
              >
                {isUploading ? "Trwa wysyłka..." : "Dodaj dokument / skan"}
              </button>

              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={isAddingParticipant}
                className="inline-flex items-center justify-center rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-60"
              >
                Import uczestników CSV
              </button>

              {order.workflow.stats.testsReady &&
                order.examTemplate?.questions &&
                order.examTemplate.questions.length > 0 && (
                  <button
                    type="button"
                    onClick={generatePrintableSheets}
                    className="inline-flex items-center justify-center rounded-[18px] border border-violet-300/15 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/15"
                  >
                    Pobierz arkusze
                  </button>
                )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-slate-500">
              Checklista braków
            </p>

            {order.workflow.missingItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {order.workflow.missingItems.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-[18px] border px-4 py-4 ${
                      item.isBlocking
                        ? "border-rose-300/15 bg-rose-400/10"
                        : "border-yellow-300/15 bg-yellow-400/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            item.isBlocking ? "text-rose-100" : "text-yellow-100"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`mt-1 text-xs leading-6 ${
                            item.isBlocking
                              ? "text-rose-100/80"
                              : "text-yellow-100/80"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-100">
                  Wszystkie kluczowe elementy są kompletne.
                </p>
                <p className="mt-1 text-xs leading-6 text-emerald-100/80">
                  To zlecenie wygląda profesjonalnie i jest domknięte procesowo.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
                  Dokumenty i materiały
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Wszystko w jednym miejscu
                </h2>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  Faktura
                </p>
                {order.invoiceUrl ? (
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center rounded-[16px] border border-emerald-300/15 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                  >
                    Pobierz fakturę
                  </a>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    Faktura nie została jeszcze udostępniona.
                  </p>
                )}
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  Materiały egzaminacyjne
                </p>
                {order.workflow.stats.testsReady ? (
                  <div className="mt-4 flex flex-col gap-3">
                    {order.generatedTestUrl && (
                      <a
                        href={order.generatedTestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-[16px] border border-blue-300/15 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                      >
                        Otwórz przygotowany plik
                      </a>
                    )}

                    {order.examTemplate?.questions &&
                      order.examTemplate.questions.length > 0 && (
                        <button
                          type="button"
                          onClick={generatePrintableSheets}
                          className="inline-flex items-center rounded-[16px] border border-violet-300/15 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/15"
                        >
                          Wygeneruj arkusz do druku
                        </button>
                      )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    Materiały nie są jeszcze gotowe.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Dokumenty przesłane do zlecenia
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Tutaj znajdziesz wszystkie pliki dodane przez Twój ośrodek.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center justify-center rounded-[18px] border border-blue-300/15 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-60"
                >
                  Dodaj plik
                </button>
              </div>

              {order.documents.length > 0 ? (
                <div className="mt-5 space-y-3">
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
                <div className="mt-5 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                  Nie dodano jeszcze żadnych dokumentów do tego zlecenia.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
              Oś czasu zlecenia
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Status i historia procesu
            </h2>

            <div className="mt-7 space-y-4">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="relative pl-12">
                  {index < timelineEvents.length - 1 && (
                    <div className="absolute left-[15px] top-8 h-[calc(100%+10px)] w-px bg-white/10" />
                  )}

                  <div
                    className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border ${
                      event.isDone
                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.05] text-slate-400"
                    }`}
                  >
                    {event.isDone ? "✓" : index + 1}
                  </div>

                  <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-white">
                        {event.title}
                      </p>
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
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
                Uczestnicy zlecenia
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Lista osób i status certyfikatów
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={isAddingParticipant}
                className="inline-flex items-center justify-center rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-60"
              >
                Import CSV
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">
                Dodaj uczestnika ręcznie
              </h3>

              <form onSubmit={handleAddParticipant} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Imię
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jan"
                    className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Nazwisko
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Kowalski"
                    className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Data urodzenia
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Miejsce urodzenia
                  </label>
                  <input
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Kielce"
                    className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingParticipant}
                  className="inline-flex w-full items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                >
                  {isAddingParticipant ? "Zapisywanie..." : "+ Dodaj pojedynczo"}
                </button>
              </form>

              <div className="mt-6 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <h4 className="text-sm font-semibold text-white">
                  Masowy import z Excela (CSV)
                </h4>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Format pliku:
                </p>
                <code className="mt-2 inline-block rounded bg-white/10 px-3 py-2 text-xs text-slate-300">
                  Imię;Nazwisko;Data ur(YYYY-MM-DD);Miejsce ur
                </code>

                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isAddingParticipant}
                  className="mt-4 inline-flex items-center justify-center rounded-[16px] border border-emerald-300/15 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-60"
                >
                  Wgraj plik CSV
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              {order.participants.length > 0 ? (
                <div className="overflow-x-auto rounded-[20px] border border-white/8">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/[0.03] text-left text-slate-500">
                        <th className="p-4 font-medium">Uczestnik</th>
                        <th className="p-4 font-medium">Wynik</th>
                        <th className="p-4 font-medium">Certyfikat</th>
                        <th className="p-4 font-medium text-right">Akcje</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/8">
                      {order.participants.map((participant) => {
                        const scoreText =
                          participant.score !== null && participant.maxScore !== null
                            ? `${participant.score} / ${participant.maxScore}`
                            : "Oczekuje";

                        return (
                          <tr
                            key={participant.id}
                            className="transition hover:bg-white/[0.03]"
                          >
                            <td className="p-4 align-top">
                              <p className="font-semibold text-white">
                                {participant.firstName} {participant.lastName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                ur. {formatShortDate(participant.birthDate)} •{" "}
                                {participant.birthPlace || "brak miejsca"}
                              </p>
                            </td>

                            <td className="p-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                  participant.score !== null &&
                                  participant.maxScore !== null
                                    ? "border-blue-300/15 bg-blue-400/10 text-blue-200"
                                    : "border-white/10 bg-white/[0.05] text-slate-300"
                                }`}
                              >
                                {scoreText}
                              </span>
                            </td>

                            <td className="p-4 align-top">
                              {participant.certificateUrl ? (
                                <a
                                  href={participant.certificateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                                >
                                  Pobierz certyfikat
                                </a>
                              ) : (
                                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
                                  Brak certyfikatu
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right align-top">
                              <div className="flex flex-wrap justify-end gap-2">
                                <a
                                  href={`/exam/${order.id}?participantId=${participant.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-[14px] border border-blue-300/15 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-400/15"
                                >
                                  Otwórz egzamin
                                </a>

                                <button
                                  type="button"
                                  onClick={() => copyOrderExamLink(participant.id)}
                                  className="inline-flex items-center justify-center rounded-[14px] border border-violet-300/15 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-400/15"
                                >
                                  Kopiuj link
                                </button>

                                <button
                                  type="button"
                                  onClick={() => triggerParticipantScan(participant.id)}
                                  disabled={isUploading}
                                  className="inline-flex items-center justify-center rounded-[14px] border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                                >
                                  Wgraj skan
                                </button>

                                <button
                                  type="button"
                                  onClick={() => confirmDeleteParticipant(participant)}
                                  className="inline-flex items-center justify-center rounded-[14px] border border-rose-300/15 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/15"
                                >
                                  Usuń
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/10 px-4 py-14 text-center">
                  <p className="text-lg font-semibold text-white">
                    Lista uczestników jest pusta
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Dodaj pierwszą osobę ręcznie albo wczytaj zbiorczy plik CSV.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}