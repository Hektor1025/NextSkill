"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getOrderStatusMeta,
  getToneClasses,
  type OrderWorkflow,
} from "../../../lib/order-workflow";

type Order = {
  id: string;
  status: string;
  createdAt: string;
  invoiceUrl: string | null;
  generatedTestUrl: string | null;
  client: {
    email: string;
    companyName?: string | null;
  };
  examTemplate: {
    title: string;
  } | null;
  participants?: {
    id: string;
    certificateUrl?: string | null;
    score?: number | null;
    maxScore?: number | null;
    testFinished?: boolean | null;
    scannedTestUrl?: string | null;
  }[];
  workflow: OrderWorkflow;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const PAGE_SIZE = 8;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<ToastState>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3200);
  };

  const fetchOrders = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin-orders");

      if (!res.ok) {
        throw new Error("Nie udało się pobrać listy zleceń.");
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Błąd pobierania:", error);
      showToast("error", "Nie udało się pobrać zleceń.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let result = [...orders];

    if (normalizedQuery) {
      result = result.filter((order) => {
        const company = order.client.companyName?.toLowerCase() || "";
        const email = order.client.email.toLowerCase();
        const examTitle = order.examTemplate?.title?.toLowerCase() || "";
        const shortId = order.id.split("-")[0].toLowerCase();

        return (
          company.includes(normalizedQuery) ||
          email.includes(normalizedQuery) ||
          examTitle.includes(normalizedQuery) ||
          shortId.includes(normalizedQuery)
        );
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter((order) => order.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sortBy === "progress-desc") {
        return b.workflow.progressPercent - a.workflow.progressPercent;
      }

      if (sortBy === "progress-asc") {
        return a.workflow.progressPercent - b.workflow.progressPercent;
      }

      if (sortBy === "participants-desc") {
        return (
          b.workflow.stats.participantCount - a.workflow.stats.participantCount
        );
      }

      return a.workflow.stats.participantCount - b.workflow.stats.participantCount;
    });

    return result;
  }, [orders, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((order) => order.status !== "COMPLETED").length;
    const certificates = orders.reduce(
      (sum, order) => sum + order.workflow.stats.certificatesReadyCount,
      0
    );
    const missingBlocking = orders.reduce(
      (sum, order) =>
        sum +
        order.workflow.missingItems.filter((item) => item.isBlocking).length,
      0
    );

    return {
      total,
      active,
      certificates,
      missingBlocking,
    };
  }, [orders]);

  const confirmDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin-orders/${orderToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się usunąć zlecenia.");
      }

      showToast(
        "success",
        `Zlecenie #${orderToDelete.id.split("-")[0].toUpperCase()} zostało usunięte.`
      );
      setOrderToDelete(null);
      await fetchOrders();
    } catch (error) {
      console.error("Błąd usuwania:", error);
      showToast("error", "Wystąpił błąd podczas usuwania zlecenia.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

  return (
    <>
      {toast && (
        <div className="fixed right-5 top-5 z-[80] max-w-sm">
          <div
            className={`rounded-[22px] border px-5 py-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${getToastClasses()}`}
          >
            <p className="text-sm font-semibold leading-6">{toast.message}</p>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-5 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b1220]/95 p-7 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-rose-200/70">
              Potwierdzenie usunięcia
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Usunąć zlecenie?
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Usuniesz z systemu zlecenie{" "}
              <span className="font-semibold text-white">
                #{orderToDelete.id.split("-")[0].toUpperCase()}
              </span>
              , listę uczestników i dokumenty powiązane z tym rekordem.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="inline-flex items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-[18px] border border-rose-300/15 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15 disabled:opacity-60"
              >
                {isDeleting ? "Usuwanie..." : "Usuń zlecenie"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,243,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(128,170,255,0.10),transparent_24%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
                Panel administracyjny
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Zarządzanie zleceniami
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                Widok administracyjny pokazuje nie tylko status, ale pełny stan procesu:
                postęp, blokery i poziom kompletności dokumentacji.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Wszystkie zlecenia
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{summary.total}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Aktywne
            </p>
            <p className="mt-4 text-4xl font-semibold text-cyan-200">{summary.active}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Certyfikaty
            </p>
            <p className="mt-4 text-4xl font-semibold text-emerald-200">
              {summary.certificates}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Blokery procesu
            </p>
            <p className="mt-4 text-4xl font-semibold text-rose-200">
              {summary.missingBlocking}
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.5fr_0.5fr]">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Wyszukiwarka
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po kliencie, e-mailu, egzaminie lub ID..."
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Filtr statusu
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
              >
                <option value="ALL">Wszystkie</option>
                <option value="NEW">NEW</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="TEST_READY">TEST_READY</option>
                <option value="SCANS_UPLOADED">SCANS_UPLOADED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Sortowanie
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-cyan-300/30"
              >
                <option value="newest">Najnowsze</option>
                <option value="oldest">Najstarsze</option>
                <option value="progress-desc">Najwyższy postęp</option>
                <option value="progress-asc">Najniższy postęp</option>
                <option value="participants-desc">Najwięcej uczestników</option>
                <option value="participants-asc">Najmniej uczestników</option>
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl"
              >
                <div className="h-6 w-72 animate-pulse rounded-full bg-white/10" />
                <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-white/10" />
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="h-24 animate-pulse rounded-[24px] bg-white/10" />
                  <div className="h-24 animate-pulse rounded-[24px] bg-white/10" />
                  <div className="h-24 animate-pulse rounded-[24px] bg-white/10" />
                </div>
              </div>
            ))}
          </section>
        ) : paginatedOrders.length === 0 ? (
          <section className="rounded-[36px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <h3 className="text-2xl font-semibold text-white">
              Brak wyników dla obecnych filtrów
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
              Zmień kryteria wyszukiwania lub wyczyść filtry, aby zobaczyć pełną listę zleceń.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {paginatedOrders.map((order) => {
              const statusMeta = getOrderStatusMeta(order.status);

              return (
                <article
                  key={order.id}
                  className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.28)]"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold text-white">
                          {order.examTemplate?.title || "Usunięty pakiet egzaminacyjny"}
                        </h2>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getToneClasses(
                            statusMeta.tone
                          )}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
                        <span>ID: {order.id.split("-")[0]}</span>
                        <span>
                          Klient: {order.client.companyName || order.client.email}
                        </span>
                        <span>Utworzono: {formatDate(order.createdAt)}</span>
                        <span>
                          Uczestnicy: {order.workflow.stats.participantCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                      >
                        Zarządzaj
                      </Link>

                      <button
                        type="button"
                        onClick={() => confirmDeleteOrder(order)}
                        className="inline-flex items-center rounded-[20px] border border-rose-300/15 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>

                  <div className="mt-7">
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
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/65">
                        Następny etap operacyjny
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-white">
                        {order.workflow.nextActionTitle}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {order.workflow.nextActionDescription}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
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
                          Zlecenie nie ma aktualnie braków krytycznych.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {filteredOrders.length > 0 && (
          <section className="flex flex-col items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-2xl sm:flex-row">
            <p className="text-sm text-slate-400">
              Strona {currentPage} z {totalPages} • wyników: {filteredOrders.length}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Poprzednia
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Następna
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}