export type WorkflowTone = "yellow" | "blue" | "violet" | "emerald" | "slate";

export type WorkflowParticipant = {
  id: string;
  certificateUrl?: string | null;
  score?: number | null;
  maxScore?: number | null;
  testFinished?: boolean | null;
  scannedTestUrl?: string | null;
};

export type WorkflowDocument = {
  id: string;
  fileType?: string | null;
  createdAt?: string | Date | null;
};

export type WorkflowStepKey =
  | "order"
  | "participants"
  | "tests"
  | "scans"
  | "verification"
  | "certificates";

export type WorkflowStep = {
  key: WorkflowStepKey;
  label: string;
  description: string;
  isDone: boolean;
  isCurrent: boolean;
};

export type WorkflowMissingItemKey =
  | "invoice"
  | "participants"
  | "tests"
  | "scans"
  | "grades"
  | "certificates";

export type WorkflowMissingItem = {
  key: WorkflowMissingItemKey;
  label: string;
  description: string;
  isBlocking: boolean;
};

export type OrderWorkflow = {
  progressPercent: number;
  currentStepKey: WorkflowStepKey;
  currentStepLabel: string;
  nextActionTitle: string;
  nextActionDescription: string;
  steps: WorkflowStep[];
  missingItems: WorkflowMissingItem[];
  stats: {
    participantCount: number;
    documentsCount: number;
    gradedParticipantsCount: number;
    certificatesReadyCount: number;
    testsReady: boolean;
    scansUploaded: boolean;
    invoiceAvailable: boolean;
  };
};

export type WorkflowOrderInput = {
  status: string;
  invoiceUrl?: string | null;
  generatedTestUrl?: string | null;
  participants?: WorkflowParticipant[];
  documents?: WorkflowDocument[];
};

const STEP_DEFINITIONS: Array<{
  key: WorkflowStepKey;
  label: string;
  description: string;
}> = [
  {
    key: "order",
    label: "Zamówienie",
    description: "Zlecenie zostało utworzone w systemie.",
  },
  {
    key: "participants",
    label: "Uczestnicy",
    description: "Dodanie listy osób do egzaminu.",
  },
  {
    key: "tests",
    label: "Arkusze",
    description: "Przygotowanie materiałów i testów.",
  },
  {
    key: "scans",
    label: "Skany",
    description: "Odesłanie rozwiązanych arkuszy.",
  },
  {
    key: "verification",
    label: "Weryfikacja",
    description: "Ocena wyników i zamknięcie sprawdzania.",
  },
  {
    key: "certificates",
    label: "Certyfikaty",
    description: "Udostępnienie dokumentów końcowych.",
  },
];

export function getOrderStatusMeta(status: string): {
  label: string;
  tone: WorkflowTone;
} {
  switch (status) {
    case "NEW":
      return {
        label: "Nowe zlecenie",
        tone: "yellow",
      };
    case "CONFIRMED":
      return {
        label: "Oczekuje na uczestników",
        tone: "blue",
      };
    case "TEST_READY":
      return {
        label: "Arkusze gotowe",
        tone: "blue",
      };
    case "SCANS_UPLOADED":
      return {
        label: "Weryfikacja w toku",
        tone: "violet",
      };
    case "COMPLETED":
      return {
        label: "Zakończone",
        tone: "emerald",
      };
    default:
      return {
        label: "W toku",
        tone: "slate",
      };
  }
}

export function getToneClasses(tone: WorkflowTone): string {
  switch (tone) {
    case "yellow":
      return "border-yellow-300/15 bg-yellow-400/10 text-yellow-200";
    case "blue":
      return "border-blue-300/15 bg-blue-400/10 text-blue-200";
    case "violet":
      return "border-violet-300/15 bg-violet-400/10 text-violet-200";
    case "emerald":
      return "border-emerald-300/15 bg-emerald-400/10 text-emerald-200";
    default:
      return "border-white/10 bg-white/[0.06] text-slate-200";
  }
}

export function computeOrderWorkflow(
  input: WorkflowOrderInput
): OrderWorkflow {
  const participants = input.participants ?? [];
  const documents = input.documents ?? [];

  const participantCount = participants.length;
  const documentsCount = documents.length;

  const gradedParticipantsCount = participants.filter(
    (participant) =>
      participant.score !== null &&
      participant.score !== undefined &&
      participant.maxScore !== null &&
      participant.maxScore !== undefined
  ).length;

  const certificatesReadyCount = participants.filter(
    (participant) => !!participant.certificateUrl
  ).length;

  const invoiceAvailable = Boolean(input.invoiceUrl);
  const testsReady =
    Boolean(input.generatedTestUrl) ||
    ["TEST_READY", "SCANS_UPLOADED", "COMPLETED"].includes(input.status);

  const scansUploaded =
    documentsCount > 0 ||
    gradedParticipantsCount > 0 ||
    participants.some(
      (participant) => !!participant.scannedTestUrl || !!participant.testFinished
    ) ||
    ["SCANS_UPLOADED", "COMPLETED"].includes(input.status);

  const verificationDone =
    participantCount > 0 &&
    (gradedParticipantsCount === participantCount || input.status === "COMPLETED");

  const certificatesDone =
    participantCount > 0 &&
    (certificatesReadyCount === participantCount || input.status === "COMPLETED");

  const stepCompletion: Record<WorkflowStepKey, boolean> = {
    order: true,
    participants: participantCount > 0,
    tests: testsReady,
    scans: scansUploaded,
    verification: verificationDone,
    certificates: certificatesDone,
  };

  const firstIncompleteStep =
    STEP_DEFINITIONS.find((step) => !stepCompletion[step.key]) ??
    STEP_DEFINITIONS[STEP_DEFINITIONS.length - 1];

  const steps: WorkflowStep[] = STEP_DEFINITIONS.map((step) => ({
    ...step,
    isDone: stepCompletion[step.key],
    isCurrent:
      step.key === firstIncompleteStep.key && !stepCompletion[firstIncompleteStep.key],
  }));

  const doneStepsCount = steps.filter((step) => step.isDone).length;
  const progressPercent = Math.round((doneStepsCount / steps.length) * 100);

  const missingItems: WorkflowMissingItem[] = [];

  if (!invoiceAvailable) {
    missingItems.push({
      key: "invoice",
      label: "Brak faktury",
      description: "Faktura nie została jeszcze udostępniona w zleceniu.",
      isBlocking: false,
    });
  }

  if (participantCount === 0) {
    missingItems.push({
      key: "participants",
      label: "Brak uczestników",
      description: "Nie dodano jeszcze żadnych osób do zamówienia.",
      isBlocking: true,
    });
  }

  if (participantCount > 0 && !testsReady) {
    missingItems.push({
      key: "tests",
      label: "Brak arkuszy",
      description: "Materiały egzaminacyjne nie są jeszcze gotowe.",
      isBlocking: false,
    });
  }

  if (participantCount > 0 && testsReady && !scansUploaded) {
    missingItems.push({
      key: "scans",
      label: "Brak skanów",
      description: "Nie odesłano jeszcze skanów lub dokumentów do weryfikacji.",
      isBlocking: true,
    });
  }

  if (participantCount > 0 && scansUploaded && !verificationDone) {
    missingItems.push({
      key: "grades",
      label: "Brak ocen",
      description: "Nie wszyscy uczestnicy mają jeszcze zamkniętą ocenę.",
      isBlocking: false,
    });
  }

  if (participantCount > 0 && verificationDone && !certificatesDone) {
    missingItems.push({
      key: "certificates",
      label: "Brak certyfikatów",
      description: "Nie wszystkie certyfikaty zostały jeszcze udostępnione.",
      isBlocking: false,
    });
  }

  let nextActionTitle = "Proces zamknięty";
  let nextActionDescription =
    "To zlecenie jest kompletne. Wszystkie główne etapy zostały już zamknięte.";

  if (participantCount === 0) {
    nextActionTitle = "Dodaj uczestników";
    nextActionDescription =
      "Uzupełnij listę osób, aby administrator mógł przejść do dalszych etapów obsługi.";
  } else if (!testsReady) {
    nextActionTitle = "Poczekaj na arkusze";
    nextActionDescription =
      "Administrator przygotowuje materiały egzaminacyjne. Gdy będą gotowe, zobaczysz je w sekcji dokumentów.";
  } else if (!scansUploaded) {
    nextActionTitle = "Odeślij skany";
    nextActionDescription =
      "Po przeprowadzeniu egzaminu wgraj skany lub dokumenty, aby uruchomić weryfikację.";
  } else if (!verificationDone) {
    nextActionTitle = "Trwa weryfikacja";
    nextActionDescription =
      "System lub administrator kończy ocenianie. Na tym etapie nie musisz wykonywać dodatkowej akcji.";
  } else if (!certificatesDone) {
    nextActionTitle = "Odbierz certyfikaty";
    nextActionDescription =
      "Weryfikacja została zakończona. Sprawdź, czy certyfikaty są już dostępne dla uczestników.";
  }

  return {
    progressPercent,
    currentStepKey: firstIncompleteStep.key,
    currentStepLabel: firstIncompleteStep.label,
    nextActionTitle,
    nextActionDescription,
    steps,
    missingItems,
    stats: {
      participantCount,
      documentsCount,
      gradedParticipantsCount,
      certificatesReadyCount,
      testsReady,
      scansUploaded,
      invoiceAvailable,
    },
  };
}