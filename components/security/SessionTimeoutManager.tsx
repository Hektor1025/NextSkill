"use client";

import React, { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type SessionTimeoutManagerProps = {
  timeoutMinutes?: number;
  warningSeconds?: number;
};

export default function SessionTimeoutManager({
  timeoutMinutes = 30,
  warningSeconds = 60,
}: SessionTimeoutManagerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    timeoutRef.current = null;
    warningIntervalRef.current = null;
  };

  const startTimers = () => {
    clearTimers();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningSeconds * 1000;

    expiresAtRef.current = Date.now() + timeoutMs;
    setSecondsLeft(null);

    timeoutRef.current = setTimeout(async () => {
      clearTimers();
      setSecondsLeft(null);
      await signOut({ callbackUrl: "/" });
    }, timeoutMs);

    const warningStartMs = Math.max(0, timeoutMs - warningMs);

    window.setTimeout(() => {
      warningIntervalRef.current = setInterval(() => {
        if (!expiresAtRef.current) return;

        const diffSeconds = Math.max(
          0,
          Math.ceil((expiresAtRef.current - Date.now()) / 1000)
        );

        setSecondsLeft(diffSeconds);

        if (diffSeconds <= 0) {
          clearTimers();
        }
      }, 1000);
    }, warningStartMs);
  };

  useEffect(() => {
    const handleActivity = () => {
      startTimers();
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    startTimers();

    events.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true })
    );

    return () => {
      clearTimers();
      events.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity)
      );
    };
  }, [timeoutMinutes, warningSeconds]);

  if (secondsLeft === null) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[95] max-w-sm">
      <div className="rounded-[22px] border border-yellow-300/15 bg-yellow-400/10 px-5 py-4 text-yellow-100 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-sm font-semibold">Sesja wygaśnie z powodu braku aktywności.</p>
        <p className="mt-1 text-xs leading-6 text-yellow-100/85">
          Porusz myszką lub naciśnij klawisz. Automatyczne wylogowanie za około{" "}
          <span className="font-bold">{secondsLeft}s</span>.
        </p>
      </div>
    </div>
  );
}