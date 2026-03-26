"use client";

import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  const loadSession = async () => {
    const session = await getSession();
    const id = (session?.user as { id?: string } | undefined)?.id ?? null;
    setUserId(id);
  };

  const fetchNotifications = async (currentUserId: string) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/notifications", {
        headers: {
          "x-user-id": currentUserId,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl">
        <p className="text-[11px] uppercase tracking-[0.30em] text-cyan-200/65">
          Notifications
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Twoje powiadomienia
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Tu znajdziesz informacje o postępie zleceń, kolejnych krokach i gotowych
          materiałach.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl">
        {isLoading ? (
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
            Wczytywanie powiadomień...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
            Brak powiadomień.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-[22px] border px-5 py-5 ${
                  notification.isRead
                    ? "border-white/8 bg-white/[0.03]"
                    : "border-cyan-300/12 bg-cyan-400/10"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {notification.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {notification.message}
                    </p>

                    {notification.href && (
                      <Link
                        href={notification.href}
                        className="mt-4 inline-flex text-sm font-semibold text-cyan-200 transition hover:text-white"
                      >
                        Przejdź do szczegółów →
                      </Link>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}