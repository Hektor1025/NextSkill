"use client";

import React, { useEffect, useRef, useState } from "react";
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
  examTemplate: {
    id: string;
    title: string;
    description: string;
    learningOutcomes?: string | null;
    questions?: Question[];
  } | null;
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
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/client-orders/${orderId}`);
      if (res.ok) setOrder(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingParticipant(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, firstName, lastName, birthDate, birthPlace }),
      });

      if (res.ok) {
        setFirstName("");
        setLastName("");
        setBirthDate("");
        setBirthPlace("");
        fetchOrderDetails();
      } else {
        alert("Błąd podczas dodawania.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAddingParticipant(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim() !== "");
        const newParticipants = [];

        for (let i = 1; i < lines.length; i++) {
          const [fName, lName, bDate, bPlace] = lines[i]
            .split(";")
            .map((s) => s.trim().replace(/"/g, ""));

          if (fName && lName && bDate) {
            newParticipants.push({
              orderId,
              firstName: fName,
              lastName: lName,
              birthDate: bDate,
              birthPlace: bPlace || "-",
            });
          }
        }

        if (newParticipants.length > 0) {
          const res = await fetch("/api/participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participants: newParticipants }),
          });

          if (res.ok) {
            alert(`Sukces! Zaimportowano ${newParticipants.length} kursantów z pliku.`);
            fetchOrderDetails();
          } else {
            alert("Wystąpił błąd podczas zapisywania masowego importu w bazie.");
          }
        } else {
          alert(
            "Nie znaleziono poprawnych danych w pliku. Upewnij się, że rozdzieliłeś dane średnikiem (;) w formacie: Imię;Nazwisko;Data urodzenia;Miejsce"
          );
        }
      } catch (e) {
        alert("Błąd przetwarzania pliku CSV.");
      } finally {
        setIsAddingParticipant(false);
        if (csvInputRef.current) csvInputRef.current.value = "";
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę osobę?")) return;
    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchOrderDetails();
    } catch (error) {
      console.error(error);
    }
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

      if (file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        const majorVersion = parseInt(pdfjsLib.version.split(".")[0], 10);
        const workerExt = majorVersion >= 4 ? "mjs" : "js";
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${workerExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (ctx) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const blob = await new Promise<Blob | null>((res) =>
              canvas.toBlob(res, "image/jpeg", 0.9)
            );
            if (blob) blobsToUpload.push(blob);
          }
        }
      } else {
        blobsToUpload.push(file);
      }

      if (blobsToUpload.length === 0) throw new Error("Nie odczytano pliku");

      const uploadedUrls: string[] = [];
      for (let i = 0; i < blobsToUpload.length; i++) {
        const safeFileName = `skan-${activeScanParticipantId}-${Date.now()}-strona${i + 1}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("scans")
          .upload(safeFileName, blobsToUpload[i]);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("scans")
          .getPublicUrl(safeFileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const res = await fetch(`/api/grade-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: activeScanParticipantId,
          fileUrls: uploadedUrls,
          examTemplateId: order.examTemplate.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresManualGrading) alert(data.message);
        else alert("Skan oceniony pomyślnie przez AI!");
        fetchOrderDetails();
      } else {
        alert("Błąd AI. Administrator oceni skan ręcznie.");
        fetchOrderDetails();
      }
    } catch (error) {
      alert("Błąd przetwarzania pliku.");
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
      const fileExt = file.name.split(".").pop();
      const safeFileName = `${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scans")
        .upload(safeFileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("scans")
        .getPublicUrl(safeFileName);

      const res = await fetch(`/api/client-orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: publicUrlData.publicUrl,
          fileType: file.type || "unknown",
        }),
      });

      if (res.ok) {
        alert("Plik przesłany!");
        fetchOrderDetails();
      }
    } catch (error) {
      alert("Błąd wgrywania.");
    } finally {
      setIsUploading(false);
    }
  };

  const copyTestLink = (participantId: string) => {
    const testLink = `${window.location.origin}/exam/${orderId}/${participantId}`;
    navigator.clipboard.writeText(testLink);
    alert("Skopiowano link do testu!");
  };

  const generateClientPDF = () => {
    if (!order?.examTemplate?.questions || order.examTemplate.questions.length === 0) {
      alert("Ten test nie ma pytań.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Zezwól na wyskakujące okienka.");
      return;
    }

    const letters = ["A", "B", "C", "D"];
    const htmlContent = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Arkusz - ${order.examTemplate.title}</title><style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5; } .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; } .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; } .student-info { display: flex; justify-content: space-between; margin-top: 30px; font-size: 16px; } .info-line { border-bottom: 1px dotted #000; width: 300px; display: inline-block; } .question-block { margin-bottom: 30px; page-break-inside: avoid; } .question-text { font-weight: bold; font-size: 16px; margin-bottom: 12px; } .options { list-style-type: none; padding-left: 0; margin: 0; } .option { margin-bottom: 8px; font-size: 15px; display: flex; } .option-letter { font-weight: bold; margin-right: 10px; } @media print { body { padding: 0; } }</style></head><body><div class="header"><div class="title">${order.examTemplate.title}</div><div style="font-size: 14px; color: #555;">Test weryfikujący wiedzę</div><div class="student-info"><div>Imię i nazwisko: <span class="info-line"></span></div><div>Data: <span class="info-line" style="width: 150px;"></span></div></div></div><div class="questions">${order.examTemplate.questions
      .map(
        (q, index) =>
          `<div class="question-block"><div class="question-text">${index + 1}. ${q.content}</div><ul class="options">${q.options
            .map(
              (opt, optIndex) =>
                `<li class="option"><span class="option-letter">${letters[optIndex]}.</span> <span>${opt}</span></li>`
            )
            .join("")}</ul></div>`
      )
      .join("")}</div><script>window.onload = function() { window.print(); }</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const generateOfficialDocuments = () => {
    if (!order || !order.participants || order.participants.length === 0) return;

    const bgProtocolUrl =
      "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/3.png";
    const bgCertFrontUrl =
      "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/1.png";
    const bgCertBackUrl =
      "https://pkvirteukvstznybgjfd.supabase.co/storage/v1/object/public/scans/2.png";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Zezwól na wyskakujące okienka.");
      return;
    }

    const dzisiaj = new Date().toLocaleDateString("pl-PL");
    const shortId = order.id.split("-")[0].toUpperCase();
    const courseName = order.examTemplate?.title || "Szkolenie Zawodowe";
    const ocenieni = order.participants.filter(
      (p) => p.testFinished && p.maxScore && p.maxScore > 0
    );
    const zdani = ocenieni.filter(
      (p) => p.score && p.maxScore && p.score / p.maxScore >= 0.51
    );
    const sourceText =
      order.examTemplate?.learningOutcomes || order.examTemplate?.description || "";

    const efektyUczenia = sourceText
      ? sourceText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map(
            (line, index) =>
              `<div style="margin-bottom: 6px; text-align: justify;">${index + 1}. ${line}</div>`
          )
          .join("")
      : "<div>Brak wprowadzonych efektów.</div>";

    let htmlContent = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Dokumenty - #${shortId}</title><style>body { font-family: 'Times New Roman', Times, serif; background: #525659; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000; } .page { width: 210mm; height: 297mm; background: white; margin: 20px auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5); page-break-after: always; overflow: hidden; } .page:last-child { page-break-after: auto; } .bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: cover; } .text-layer { position: absolute; z-index: 2; color: #000; } @media print { body { background: white; margin: 0; padding: 0; } .page { margin: 0; box-shadow: none; border: none; } } .proto-numer { top: 60mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-cel { top: 67mm; left: 105mm; transform: translateX(-50%); font-size: 16px; text-align: center; width: 170mm; line-height: 1.4; } .proto-opis-dnia { top: 82mm; left: 25mm; font-size: 16px; width: 160mm; line-height: 1.4; text-align: left; } .proto-kurs { top: 94mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-tytul-listy { top: 106mm; left: 105mm; transform: translateX(-50%); font-size: 16px; font-weight: bold; width: 170mm; text-align: center; } .proto-lista { top: 116mm; left: 25mm; width: 160mm; font-size: 16px; line-height: 1.6; } .cert-dla { top: 88mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-imie-nazwisko { top: 98mm; left: 105mm; transform: translateX(-50%); font-size: 26px; font-weight: bold; width: 190mm; text-align: center; } .cert-urodzony { top: 110mm; left: 105mm; transform: translateX(-50%); font-size: 16px; width: 190mm; text-align: center; } .cert-po-odbyciu { top: 130mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-kurs { top: 142mm; left: 105mm; transform: translateX(-50%); font-size: 22px; font-weight: bold; width: 180mm; text-align: center; } .cert-wynik-tekst { top: 166mm; left: 105mm; transform: translateX(-50%); font-size: 16px; } .cert-wynik-box { top: 174mm; left: 105mm; transform: translateX(-50%); font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; } .cert-kielce-dnia { top: 215mm; left: 25mm; font-size: 16px; } .cert-numer-cvziu { top: 240mm; left: 115mm; font-size: 16px; font-weight: bold; } .cert-efekty-lista { top: 60mm; left: 25mm; width: 160mm; font-size: 15px; line-height: 1.5; } .cert-stopka-rewers { bottom: 15mm; left: 25mm; width: 160mm; font-size: 12px; text-align: left; }</style></head><body>`;

    htmlContent += `<div class="page"><img src="${bgProtocolUrl}" class="bg-image" /><div class="text-layer proto-numer">Protokół nr CVZIU${shortId}</div><div class="text-layer proto-cel">z przeprowadzenia walidacji (egzaminu) efektów uczenia się<br/>w celu potwierdzenia nabycia kwalifikacji</div><div class="text-layer proto-opis-dnia">Dnia ${dzisiaj} przeprowadzono walidację (egzamin) sprawdzającą przyswojenie przez<br/>uczestników szkolenia wiedzy z zakresu:</div><div class="text-layer proto-kurs">${courseName}</div><div class="text-layer proto-tytul-listy">Lista obecności oraz wyniki osób egzaminowanych</div><div class="text-layer proto-lista">${
      ocenieni.length > 0
        ? ocenieni
            .map((p, i) => {
              const proc =
                p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
              const wynik = proc >= 51 ? "pozytywna" : "negatywna";
              return `<div style="margin-bottom: 6px;">${i + 1}. ${p.lastName} ${p.firstName} urodzony(a) ${p.birthDate} walidacja ${wynik}</div>`;
            })
            .join("")
        : "<div>Brak.</div>"
    }</div></div>`;

    zdani.forEach((p) => {
      const certId = `CVZIU${shortId}${p.id.substring(0, 4).toUpperCase()}`;
      htmlContent += `<div class="page"><img src="${bgCertFrontUrl}" class="bg-image" /><div class="text-layer cert-dla">dla</div><div class="text-layer cert-imie-nazwisko">Pan(i) ${p.firstName} ${p.lastName}</div><div class="text-layer cert-urodzony">urodzony(a) w dn. ${p.birthDate} w ${p.birthPlace || "-"}</div><div class="text-layer cert-po-odbyciu">po odbyciu kursu pt.:</div><div class="text-layer cert-kurs">"${courseName}"</div><div class="text-layer cert-wynik-tekst">w wyniku przeprowadzonej walidacji zdał(a) egzamin</div><div class="text-layer cert-wynik-box"><span style="font-family: Arial;">☑</span> wynikiem pozytywnym</div><div class="text-layer cert-kielce-dnia">Kielce, dnia ${dzisiaj}</div><div class="text-layer cert-numer-cvziu">Nr: ${certId}</div></div><div class="page"><img src="${bgCertBackUrl}" class="bg-image" /><div class="text-layer cert-efekty-lista">${efektyUczenia}</div><div class="text-layer cert-stopka-rewers">Załącznik do certyfikatu nr: ${certId} | Uczestnik: ${p.firstName} ${p.lastName}</div></div>`;
    });

    htmlContent += `<script>window.onload = function() { setTimeout(() => { window.print(); }, 800); }</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!order || order.participants.length === 0) return;

    const headers = [
      "Imię",
      "Nazwisko",
      "Data Urodzenia",
      "Miejsce Urodzenia",
      "Zdobyte Punkty",
      "Maks. Punkty",
      "Procent",
      "Wynik Walidacji",
    ];

    const rows = order.participants.map((p) => {
      const proc =
        p.score && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : 0;
      return [
        p.firstName,
        p.lastName,
        p.birthDate,
        p.birthPlace || "-",
        p.score ?? "-",
        p.maxScore ?? "-",
        p.testFinished ? `${proc}%` : "-",
        p.testFinished ? (proc >= 51 ? "Pozytywny" : "Negatywny") : "-",
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
    link.setAttribute("download", `Wyniki_${order.id.split("-")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusAlert = (status: string) => {
    switch (status) {
      case "NEW":
        return (
          <div className="rounded-[24px] border border-yellow-300/15 bg-yellow-400/10 p-5">
            <h3 className="text-lg font-semibold text-yellow-100">
              Etap 1: Nowe zlecenie
            </h3>
            <p className="mt-2 text-sm text-yellow-100/80">
              Zlecenie zostało przesłane i oczekuje na potwierdzenie.
            </p>
          </div>
        );
      case "CONFIRMED":
        return (
          <div className="rounded-[24px] border border-blue-300/15 bg-blue-400/10 p-5">
            <h3 className="text-lg font-semibold text-blue-100">
              Etap 2: Potwierdzenie zlecenia
            </h3>
            <p className="mt-2 text-sm text-blue-100/80">
              Wprowadź uczestników poniżej lub skorzystaj z importu CSV.
            </p>
          </div>
        );
      case "TEST_READY":
        return (
          <div className="rounded-[24px] border border-indigo-300/15 bg-indigo-400/10 p-5">
            <h3 className="text-lg font-semibold text-indigo-100">
              Etap 3: Przeprowadzenie egzaminu
            </h3>
            <p className="mt-2 text-sm text-indigo-100/80">
              Wgraj skany egzaminów przy nazwiskach uczestników lub skopiuj linki do testu online.
            </p>
          </div>
        );
      case "SCANS_UPLOADED":
        return (
          <div className="rounded-[24px] border border-purple-300/15 bg-purple-400/10 p-5">
            <h3 className="text-lg font-semibold text-purple-100">
              Etap: Oczekuje na akceptację
            </h3>
            <p className="mt-2 text-sm text-purple-100/80">
              Przesłane materiały są aktualnie weryfikowane.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-white">
            Wczytywanie szczegółów...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Trwa pobieranie danych zlecenia
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
    <div className="mx-auto max-w-7xl pb-12">
      <input
        type="file"
        ref={participantScanInputRef}
        onChange={handleParticipantScanUpload}
        className="hidden"
        accept=".pdf, image/jpeg, image/png, image/webp"
      />
      <input
        type="file"
        ref={csvInputRef}
        onChange={handleCsvImport}
        className="hidden"
        accept=".csv"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.jpg,.png,.jpeg,.webp"
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/panel/history"
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
          Wróć do listy
        </Link>

        <div className="flex flex-wrap gap-3">
          {order.invoiceUrl &&
            (order.status === "CONFIRMED" ||
              order.status === "TEST_READY" ||
              order.status === "COMPLETED") && (
              <a
                href={order.invoiceUrl}
                target="_blank"
                className="inline-flex items-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
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
                Pobierz fakturę
              </a>
            )}
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/70 p-8">
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Order details
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            {order.examTemplate?.title || "Brak nazwy"}
          </h1>
          <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-xs font-bold text-slate-300">
            #{order.id.split("-")[0]}
          </div>
        </div>

        {order.status === "COMPLETED" ? (
          <div className="p-8 pb-4">
            <div className="rounded-[28px] border border-emerald-300/15 bg-emerald-400/10 p-8 text-center">
              <h2 className="text-3xl font-semibold text-emerald-100">
                Wszystko gotowe 🎉
              </h2>
              <p className="mt-4 text-base text-emerald-100/85">
                Walidacja została zakończona. Możesz pobrać gotowe certyfikaty oraz raport wyników.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  onClick={generateOfficialDocuments}
                  className="inline-flex items-center justify-center rounded-[20px] border border-emerald-300/15 bg-emerald-500/20 px-8 py-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Pobierz certyfikaty
                </button>

                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.05] px-8 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Eksport CSV
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 pb-4">
            {getStatusAlert(order.status)}

            {order.status === "TEST_READY" && (
              <div className="mt-6 rounded-[28px] border border-indigo-300/15 bg-indigo-400/10 p-6 text-center">
                <h3 className="text-xl font-semibold text-indigo-100">
                  Tradycyjny egzamin
                </h3>
                <p className="mt-3 text-sm text-indigo-100/80">
                  Wydrukuj arkusze dla uczestników lub przeprowadź egzamin online.
                </p>

                {order.examTemplate?.questions?.length ? (
                  <button
                    onClick={generateClientPDF}
                    className="mt-6 inline-flex items-center justify-center rounded-[18px] border border-indigo-300/15 bg-indigo-500/20 px-8 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/25"
                  >
                    Generuj arkusz PDF
                  </button>
                ) : (
                  <span className="mt-6 inline-block text-sm text-slate-400">
                    Brak pytań w pakiecie egzaminacyjnym.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="px-8 pb-8 mt-4">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Participants
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Zgłoszeni uczestnicy
              </h2>
            </div>

            {order.status === "TEST_READY" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {isUploading ? "Wgrywanie..." : "Dodaj plik do zlecenia"}
              </button>
            )}
          </div>

          {order.status === "CONFIRMED" && (
            <div className="mb-6 rounded-[28px] border border-blue-300/10 bg-blue-400/5 p-6">
              <form
                onSubmit={handleAddParticipant}
                className="mb-6 border-b border-white/10 pb-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/80">
                      Imię
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-[52px] w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none focus:border-cyan-300/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/80">
                      Nazwisko
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-[52px] w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none focus:border-cyan-300/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/80">
                      Data ur.
                    </label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-[52px] w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none focus:border-cyan-300/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/80">
                      Miejsce ur.
                    </label>
                    <input
                      type="text"
                      required
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="h-[52px] w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none focus:border-cyan-300/40"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingParticipant}
                    className="inline-flex items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
                  >
                    + Dodaj pojedynczo
                  </button>
                </div>
              </form>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Masowy import z Excela (CSV)
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Format:{" "}
                    <code className="rounded bg-white/10 px-2 py-1 text-slate-300">
                      Imię;Nazwisko;Data ur(YYYY-MM-DD);Miejsce ur
                    </code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isAddingParticipant}
                  className="inline-flex items-center justify-center rounded-[18px] border border-emerald-300/15 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-60"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Wgraj plik CSV
                </button>
              </div>
            </div>
          )}

          {order.participants?.length > 0 ? (
            <div className="overflow-x-auto rounded-[24px] border border-white/8">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.03] text-left text-slate-500">
                    <th className="p-4 font-medium">Imię i nazwisko</th>
                    <th className="p-4 text-center font-medium">Wynik</th>
                    <th className="p-4 text-right font-medium">Akcje</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/8">
                  {order.participants.map((p) => (
                    <tr key={p.id} className="transition hover:bg-white/[0.03]">
                      <td className="p-4">
                        <p className="font-semibold text-white">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {p.birthDate} • {p.birthPlace || "-"}
                        </p>
                      </td>

                      <td className="p-4 text-center">
                        {p.testFinished ? (
                          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-200">
                            {p.score}/{p.maxScore}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {order.status === "CONFIRMED" ? (
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="inline-flex items-center justify-center rounded-xl border border-red-400/15 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
                          >
                            Usuń
                          </button>
                        ) : order.status === "TEST_READY" && !p.testFinished ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => triggerParticipantScan(p.id)}
                              className="inline-flex items-center justify-center rounded-xl border border-purple-300/15 bg-purple-400/10 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-400/15"
                            >
                              Wgraj skan
                            </button>
                            <button
                              onClick={() => copyTestLink(p.id)}
                              className="inline-flex items-center justify-center rounded-xl border border-blue-300/15 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-400/15"
                            >
                              Link online
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">Brak akcji</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] py-10 text-center text-slate-400">
              Brak osób na liście.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}