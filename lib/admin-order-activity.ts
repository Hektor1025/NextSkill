import type { WorkflowOrderInput } from "./order-workflow";

export type AdminOrderActivityEvent = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  isDone: boolean;
  tone: "emerald" | "cyan" | "violet" | "yellow" | "slate";
};

type ParticipantLike = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  certificateUrl?: string | null;
  score?: number | null;
  maxScore?: number | null;
  testFinished?: boolean | null;
  scannedTestUrl?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type DocumentLike = {
  id: string;
  fileName?: string | null;
  fileType?: string | null;
  createdAt?: string | Date | null;
};

type AdminActivityInput = WorkflowOrderInput & {
  createdAt: string | Date;
  participants?: ParticipantLike[];
  documents?: DocumentLike[];
};

function normalizeDate(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function getLatestDate(values: Array<string | Date | null | undefined>): string | null {
  const normalized = values
    .map((value) => normalizeDate(value))
    .filter(Boolean) as string[];

  if (normalized.length === 0) return null;

  return normalized.sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )[0];
}

export function buildAdminOrderActivity(input: AdminActivityInput): AdminOrderActivityEvent[] {
  const participants = input.participants ?? [];
  const documents = input.documents ?? [];

  const hasParticipants = participants.length > 0;
  const hasTests =
    Boolean(input.generatedTestUrl) ||
    ["TEST_READY", "SCANS_UPLOADED", "COMPLETED"].includes(input.status);

  const participantsWithScans = participants.filter(
    (participant) => !!participant.scannedTestUrl
  );

  const participantsGraded = participants.filter(
    (participant) =>
      participant.score !== null &&
      participant.score !== undefined &&
      participant.maxScore !== null &&
      participant.maxScore !== undefined
  );

  const participantsWithCertificates = participants.filter(
    (participant) => !!participant.certificateUrl
  );

  const events: AdminOrderActivityEvent[] = [
    {
      id: "created",
      title: "Utworzenie zlecenia",
      description: "Zlecenie zostało zapisane w systemie i jest gotowe do dalszej obsługi.",
      date: normalizeDate(input.createdAt),
      isDone: true,
      tone: "emerald",
    },
    {
      id: "invoice",
      title: "Faktura",
      description: input.invoiceUrl
        ? "Do zlecenia przypisano fakturę."
        : "Faktura nie została jeszcze dodana.",
      date: input.invoiceUrl ? normalizeDate(input.createdAt) : null,
      isDone: !!input.invoiceUrl,
      tone: input.invoiceUrl ? "cyan" : "slate",
    },
    {
      id: "participants",
      title: "Lista uczestników",
      description: hasParticipants
        ? `Dodano ${participants.length} uczestników do procesu egzaminacyjnego.`
        : "Brak przypisanych uczestników.",
      date: hasParticipants
        ? getLatestDate(participants.map((participant) => participant.createdAt))
        : null,
      isDone: hasParticipants,
      tone: hasParticipants ? "emerald" : "yellow",
    },
    {
      id: "tests",
      title: "Arkusze / testy",
      description: hasTests
        ? "Materiały egzaminacyjne są gotowe do użycia."
        : "Testy nie zostały jeszcze przygotowane.",
      date: hasTests ? normalizeDate(input.createdAt) : null,
      isDone: hasTests,
      tone: hasTests ? "violet" : "slate",
    },
    {
      id: "documents",
      title: "Dokumenty i skany",
      description:
        documents.length > 0 || participantsWithScans.length > 0
          ? `Dostarczono ${documents.length} dokumentów i ${participantsWithScans.length} skanów uczestników.`
          : "Brak wgranych dokumentów lub skanów.",
      date:
        documents.length > 0 || participantsWithScans.length > 0
          ? getLatestDate([
              ...documents.map((document) => document.createdAt),
              ...participants
                .filter((participant) => !!participant.scannedTestUrl)
                .map((participant) => participant.updatedAt ?? participant.createdAt),
            ])
          : null,
      isDone: documents.length > 0 || participantsWithScans.length > 0,
      tone:
        documents.length > 0 || participantsWithScans.length > 0
          ? "cyan"
          : "yellow",
    },
    {
      id: "grading",
      title: "Ocena i weryfikacja",
      description:
        participantsGraded.length > 0
          ? `Oceniono ${participantsGraded.length} z ${participants.length} uczestników.`
          : "Nie wprowadzono jeszcze ocen.",
      date:
        participantsGraded.length > 0
          ? getLatestDate(
              participantsGraded.map(
                (participant) => participant.updatedAt ?? participant.createdAt
              )
            )
          : null,
      isDone:
        participants.length > 0 && participantsGraded.length === participants.length,
      tone:
        participants.length > 0 && participantsGraded.length === participants.length
          ? "emerald"
          : participantsGraded.length > 0
          ? "violet"
          : "slate",
    },
    {
      id: "certificates",
      title: "Certyfikaty",
      description:
        participantsWithCertificates.length > 0
          ? `Udostępniono ${participantsWithCertificates.length} certyfikatów.`
          : "Certyfikaty nie zostały jeszcze przypisane.",
      date:
        participantsWithCertificates.length > 0
          ? getLatestDate(
              participantsWithCertificates.map(
                (participant) => participant.updatedAt ?? participant.createdAt
              )
            )
          : null,
      isDone:
        participants.length > 0 &&
        participantsWithCertificates.length === participants.length,
      tone:
        participants.length > 0 &&
        participantsWithCertificates.length === participants.length
          ? "emerald"
          : participantsWithCertificates.length > 0
          ? "cyan"
          : "slate",
    },
  ];

  return events;
}