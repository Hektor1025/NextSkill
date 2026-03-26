"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SessionTimeoutManager from "../../../components/security/SessionTimeoutManager";
import { maskEmail } from "../../../lib/masking";

type SecurityLog = {
  id: string;
  email: string | null;
  eventType: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    role: "ADMIN" | "CLIENT";
    companyName?: string | null;
  } | null;
};

export default function SecurityPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [successFilter, setSuccessFilter] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/security-logs?limit=100");
      const data = await res.json();

      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Błąd pobierania logów:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const eventOk =
        eventTypeFilter === "ALL" ? true : log.eventType === eventTypeFilter;

      const successOk =
        successFilter === "ALL"
          ? true
          : successFilter === "SUCCESS"
          ? log.success
          : !log.success;

      return eventOk && successOk;
    });
  }, [logs, eventTypeFilter, successFilter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      success: logs.filter((log) => log.success).length,
      failures: logs.filter((log) => !log.success).length,
      locked: logs.filter((log) => log.eventType === "ACCOUNT_LOCKED").length,
    };
  }, [logs]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <SessionTimeoutManager timeoutMinutes={30} warningSeconds={60} />

      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-200"
          >
            ← Wróć do dashboardu
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
            Security center
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Logi bezpieczeństwa
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Tutaj widzisz historię logowań, nieudanych prób, blokad konta i zdarzeń
            związanych z resetem hasła.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Wszystkie logi
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{stats.total}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Udane
            </p>
            <p className="mt-4 text-4xl font-semibold text-emerald-200">
              {stats.success}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Nieudane
            </p>
            <p className="mt-4 text-4xl font-semibold text-rose-200">
              {stats.failures}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Blokady kont
            </p>
            <p className="mt-4 text-4xl font-semibold text-yellow-200">
              {stats.locked}
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Typ zdarzenia
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none"
              >
                <option value="ALL">Wszystkie</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
                <option value="PASSWORD_RESET_REQUESTED">
                  PASSWORD_RESET_REQUESTED
                </option>
                <option value="PASSWORD_RESET_COMPLETED">
                  PASSWORD_RESET_COMPLETED
                </option>
                <option value="REGISTER_SUCCESS">REGISTER_SUCCESS</option>
                <option value="REGISTER_FAILURE">REGISTER_FAILURE</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Wynik
              </label>
              <select
                value={successFilter}
                onChange={(e) => setSuccessFilter(e.target.value)}
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-white outline-none"
              >
                <option value="ALL">Wszystkie</option>
                <option value="SUCCESS">Udane</option>
                <option value="FAILURE">Nieudane</option>
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold text-white">Historia bezpieczeństwa</h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                Wczytywanie logów...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Brak logów dla wybranych filtrów.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              log.success
                                ? "border-emerald-300/15 bg-emerald-400/10 text-emerald-200"
                                : "border-rose-300/15 bg-rose-400/10 text-rose-200"
                            }`}
                          >
                            {log.success ? "SUCCESS" : "FAILURE"}
                          </span>

                          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                            {log.eventType}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-white">
                          {log.message}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span>
                            Konto: {maskEmail(log.email || log.user?.email || "—")}
                          </span>
                          <span>
                            Rola: {log.user?.role || "—"}
                          </span>
                          <span>
                            IP: {log.ipAddress || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}