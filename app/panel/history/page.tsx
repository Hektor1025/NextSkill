"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
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
  examTemplate: {
    title: string;
  } | null;
  workflow: OrderWorkflow;
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const session = await getSession();
      const clientId = (session?.user as { id?: string } | undefined)?.id;

      if (!clientId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/client-orders?clientId=${clientId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Błąd pobierania historii:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "COMPLETED").length;
    const totalParticipants = orders.reduce(
      (sum, order) => sum + order.workflow.stats.participantCount,
      0
    );
    const readyCertificates = orders.reduce(
      (sum, order) => sum + order.workflow.stats.certificatesReadyCount,
      0
    );

    return {
      totalOrders: orders.length,
      activeOrders,
      totalParticipants,
      readyCertificates,
    };
  }, [orders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="h-8 w-56 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded-full bg-white/10" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl"
            >
              <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-10 w-16 animate-pulse rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,243,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(128,170,255,0.10),transparent_24%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.30em] text-cyan-200/65">
              Workflow klienta
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Historia i status zleceń
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Każde zlecenie pokazuje teraz rzeczywisty stan procesu: postęp,
              brakujące elementy i najbliższy krok do wykonania.
            </p>
          </div>

          <Link
            href="/panel/new-order"
            className="inline-flex items-center justify-center rounded-[20px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            + Nowe zlecenie
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Wszystkie zlecenia
          </p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {summary.totalOrders}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            W toku
          </p>
          <p className="mt-4 text-4xl font-semibold text-cyan-200">
            {summary.activeOrders}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Zgłoszeni uczestnicy
          </p>
          <p className="mt-4 text-4xl font-semibold text-blue-200">
            {summary.totalParticipants}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Gotowe certyfikaty
          </p>
          <p className="mt-4 text-4xl font-semibold text-emerald-200">
            {summary.readyCertificates}
          </p>
        </div>
      </section>

      {orders.length === 0 ? (
        <section className="rounded-[36px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
            <svg
              className="h-9 w-9 text-cyan-200/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>

          <h3 className="mt-6 text-2xl font-semibold text-white">
            Brak historii zleceń
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            Nie masz jeszcze żadnych aktywnych zamówień. Utwórz pierwsze zlecenie,
            aby uruchomić pełny proces egzaminacyjny.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/panel/new-order"
              className="inline-flex items-center rounded-[20px] border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Rozpocznij pierwsze zlecenie
            </Link>

            <Link
              href="/panel/profile"
              className="inline-flex items-center rounded-[20px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Uzupełnij profil ośrodka
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-5">
          {orders.map((order) => {
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
                      <span>Utworzono: {formatDate(order.createdAt)}</span>
                      <span>Uczestnicy: {order.workflow.stats.participantCount}</span>
                      <span>
                        Certyfikaty: {order.workflow.stats.certificatesReadyCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/panel/history/${order.id}`}
                      className="inline-flex items-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                    >
                      Otwórz centrum zlecenia
                    </Link>
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
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/65">
                      Co musisz zrobić teraz
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
                        Wszystkie kluczowe elementy zlecenia są kompletne.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}