import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import nodemailer from "nodemailer";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: { select: { email: true } },
        examTemplate: {
          include: { questions: true }
        },
        documents: true,
        participants: true,
      }
    });
    if (!order) return NextResponse.json({ error: "Nie znaleziono zlecenia" }, { status: 404 });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error("Błąd pobierania:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, invoiceUrl, generatedTestUrl } = body;
    
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { client: true, examTemplate: true }
    });
    
    if (!existingOrder) {
      return NextResponse.json({ error: "Nie znaleziono zlecenia" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (invoiceUrl) updateData.invoiceUrl = invoiceUrl;
    if (generatedTestUrl) updateData.generatedTestUrl = generatedTestUrl;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });
    
    // --- WYSYŁKA POWIADOMIEŃ E-MAIL (Zoptymalizowana pod Onet) ---
    if (status && status !== existingOrder.status && existingOrder.client?.email) {
      let subject = "";
      let htmlMessage = "";
      const examTitle = existingOrder.examTemplate?.title || "Szkolenie Zawodowe";
      const shortId = existingOrder.id.split('-')[0].toUpperCase();
      
      if (status === 'CONFIRMED') {
        subject = `✅ Zlecenie #${shortId} zostało potwierdzone`;
        htmlMessage = `<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;"><div style="background: #1664a8; color: white; padding: 20px; text-align: center;"><h2 style="margin: 0;">Zlecenie Zaakceptowane</h2></div><div style="padding: 20px;"><p>Dzień dobry,</p><p>Twoje zlecenie na szkolenie <strong>${examTitle}</strong> przeszło do Etapu 2.</p><p>Zaloguj się do swojego panelu klienta, aby dodać listę uczestników biorących udział w walidacji.</p><div style="text-align: center; margin-top: 25px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/panel/history/${id}" style="display: inline-block; background: #1664a8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Przejdź do zlecenia</a></div></div></div>`;
      } else if (status === 'TEST_READY') {
         subject = `📝 Arkusze gotowe do pobrania - Zlecenie #${shortId}`;
         htmlMessage = `<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;"><div style="background: #4f46e5; color: white; padding: 20px; text-align: center;"><h2 style="margin: 0;">Arkusze egzaminacyjne są gotowe</h2></div><div style="padding: 20px;"><p>Dzień dobry,</p><p>Arkusze dla szkolenia <strong>${examTitle}</strong> czekają w systemie.</p><p>Możesz teraz skopiować linki do testów online dla swoich kursantów lub wygenerować arkusze PDF do druku.</p><div style="text-align: center; margin-top: 25px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/panel/history/${id}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Pobierz testy</a></div></div></div>`;
      } else if (status === 'COMPLETED') {
         subject = `🎓 Dokumenty końcowe gotowe! - Zlecenie #${shortId}`;
         htmlMessage = `<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;"><div style="background: #16a34a; color: white; padding: 20px; text-align: center;"><h2 style="margin: 0;">Walidacja zakończona sukcesem!</h2></div><div style="padding: 20px;"><p>Dzień dobry,</p><p>Weryfikacja wyników dla szkolenia <strong>${examTitle}</strong> została zakończona.</p><p>Zaloguj się do panelu, aby pobrać oficjalne certyfikaty i protokół dla swoich kursantów.</p><div style="text-align: center; margin-top: 25px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/panel/history/${id}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Odbierz certyfikaty</a></div></div></div>`;
      }

      if (htmlMessage !== "") {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.poczta.onet.pl", // Domyślnie Onet
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true, 
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          await transporter.sendMail({
            from: `"Wechsler System" <${process.env.EMAIL_USER}>`, 
            to: existingOrder.client.email, 
            subject: subject,
            html: htmlMessage,
          });
          console.log("Nodemailer: Wysłano powiadomienie e-mail do", existingOrder.client.email);
        } catch (emailError) {
          console.error("Błąd wysyłania e-maila (Nodemailer): Upewnij się, że masz poprawne hasło i adres w pliku .env. Szczegóły błędu:", emailError);
        }
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Błąd aktualizacji zlecenia:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// --- NOWOŚĆ: Funkcja usuwania całego zlecenia z bazy ---
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. Najpierw usuwamy dokumenty powiązane ze zleceniem (żeby baza nie wyrzuciła błędu klucza obcego)
    await prisma.document.deleteMany({
      where: { orderId: id }
    });

    // 2. Następnie usuwamy kursantów przypisanych do tego zlecenia
    await prisma.participant.deleteMany({
      where: { orderId: id }
    });

    // 3. Na końcu usuwamy samo zlecenie
    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Zlecenie zostało pomyślnie usunięte." });
  } catch (error) {
    console.error("Błąd usuwania zlecenia:", error);
    return NextResponse.json({ error: "Nie udało się usunąć zlecenia. Błąd serwera." }, { status: 500 });
  }
}