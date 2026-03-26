import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { SecurityEventType } from "@prisma/client";
import { createSecurityLog, getRequestMeta } from "../../../../lib/security";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Brak credentials");
            return null;
          }

          const rawEmail = credentials.email.trim();
          const normalizedEmail = rawEmail.toLowerCase();
          const { ipAddress, userAgent } = getRequestMeta(req as unknown as Request);

          let user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail,
            },
          });

          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                email: {
                  equals: rawEmail,
                  mode: "insensitive",
                },
              },
            });
          }

          if (!user) {
            console.log("[AUTH] Nie znaleziono użytkownika:", normalizedEmail);

            await createSecurityLog({
              email: normalizedEmail,
              eventType: SecurityEventType.LOGIN_FAILURE,
              success: false,
              ipAddress,
              userAgent,
              message: "Nieudana próba logowania dla nieistniejącego konta.",
            });

            return null;
          }

          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.log("[AUTH] Konto zablokowane:", user.email, user.lockedUntil);

            await createSecurityLog({
              userId: user.id,
              email: user.email,
              eventType: SecurityEventType.ACCOUNT_LOCKED,
              success: false,
              ipAddress,
              userAgent,
              message: "Próba logowania do zablokowanego konta.",
            });

            throw new Error("ACCOUNT_LOCKED");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("[AUTH] Złe hasło dla:", user.email);

            const nextFailedCount = user.failedLoginAttempts + 1;
            const shouldLock = nextFailedCount >= MAX_FAILED_LOGIN_ATTEMPTS;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: shouldLock ? 0 : nextFailedCount,
                lockedUntil: shouldLock
                  ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000)
                  : null,
              },
            });

            await createSecurityLog({
              userId: user.id,
              email: user.email,
              eventType: shouldLock
                ? SecurityEventType.ACCOUNT_LOCKED
                : SecurityEventType.LOGIN_FAILURE,
              success: false,
              ipAddress,
              userAgent,
              message: shouldLock
                ? "Konto zostało czasowo zablokowane po wielu błędnych próbach logowania."
                : "Nieudana próba logowania z powodu błędnego hasła.",
            });

            if (shouldLock) {
              throw new Error("ACCOUNT_LOCKED");
            }

            return null;
          }

          if (user.email !== normalizedEmail) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  email: normalizedEmail,
                },
              });
            } catch (error) {
              console.warn("[AUTH] Nie udało się znormalizować e-maila:", error);
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          });

          await createSecurityLog({
            userId: user.id,
            email: normalizedEmail,
            eventType: SecurityEventType.LOGIN_SUCCESS,
            success: true,
            ipAddress,
            userAgent,
            message: "Pomyślne logowanie do systemu.",
          });

          console.log("[AUTH] Logowanie OK:", normalizedEmail);

          return {
            id: user.id,
            email: normalizedEmail,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH] authorize error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = (user as { id?: string }).id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
});

export { handler as GET, handler as POST };