import crypto from "crypto";
import { PrismaClient, SecurityEventType } from "@prisma/client";
import { prisma } from "./prisma";

export function validateStrongPassword(password: string) {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Hasło musi mieć co najmniej 12 znaków.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Hasło musi zawierać małą literę.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Hasło musi zawierać wielką literę.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Hasło musi zawierać cyfrę.");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Hasło musi zawierać znak specjalny.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateRawResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

type RequestLike =
  | Request
  | {
      headers?: Headers | Record<string, string | string[] | undefined>;
    }
  | undefined
  | null;

function readHeader(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  if (!headers) return null;

  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(key);
  }

  const record = headers as Record<string, string | string[] | undefined>;
  const value =
    record[key] ??
    record[key.toLowerCase()] ??
    record[key.toUpperCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getRequestMeta(req: RequestLike) {
  const forwardedFor =
    readHeader(req?.headers, "x-forwarded-for") ||
    readHeader(req?.headers, "x-real-ip") ||
    "";

  const ipAddress = forwardedFor.split(",")[0]?.trim() || null;
  const userAgent = readHeader(req?.headers, "user-agent") || null;

  return {
    ipAddress,
    userAgent,
  };
}

type SecurityLogInput = {
  prismaClient?: PrismaClient;
  userId?: string | null;
  email?: string | null;
  eventType: SecurityEventType;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  message: string;
};

export async function createSecurityLog(input: SecurityLogInput) {
  const client = input.prismaClient ?? prisma;

  return client.securityLog.create({
    data: {
      userId: input.userId ?? null,
      email: input.email ?? null,
      eventType: input.eventType,
      success: input.success,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      message: input.message,
    },
  });
}