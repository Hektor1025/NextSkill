"use client";

import React, { useEffect, useRef, useState } from "react";
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

type NotificationsCenterProps = {
  panelBasePath: "/dashboard" | "/panel";
};

export default function NotificationsCenter({
  panelBasePath,
}: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadSession = async () => {
    try {
      const session = await getSession();
      const id = (session?.user as { id?: string } | undefined)?.id ?? null;
      setUserId(id);
    } catch (error) {
      console.error("Błąd sesji powiadomień:", error);
    }
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
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ notificationId }),
      });

      await fetchNotifications(userId);
    } catch (error) {
      console.error("Błąd oznaczania jako przeczytane:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ markAll: true }),
      });

      await fetchNotifications(userId);
    } catch (error) {
      console.error("Błąd oznaczania wszystkich jako przeczytane:", error);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-400/10 px-1.5 py-1 text-[11px] font-bold text-cyan-100">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-[90] w-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220]/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Notification center
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Powiadomienia
              </h3>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-cyan-200 transition hover:text-white"
            >
              Oznacz wszystkie
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {isLoading ? (
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                Wczytywanie...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Brak powiadomień.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const content = (
                    <div
                      className={`rounded-[18px] border px-4 py-4 transition ${
                        notification.isRead
                          ? "border-white/8 bg-white/[0.03]"
                          : "border-cyan-300/12 bg-cyan-400/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {notification.title}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-slate-300">
                            {notification.message}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-300" />
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500">
                          {formatDate(notification.createdAt)}
                        </span>

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-[11px] font-semibold text-cyan-200 transition hover:text-white"
                          >
                            Oznacz jako przeczytane
                          </button>
                        )}
                      </div>
                    </div>
                  );

                  if (notification.href) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                          setIsOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notification.id}>{content}</div>;
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <Link
              href={`${panelBasePath}/notifications`}
              className="text-sm font-semibold text-cyan-200 transition hover:text-white"
            >
              Zobacz pełną historię →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}