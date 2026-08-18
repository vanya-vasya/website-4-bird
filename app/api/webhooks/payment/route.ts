import { transporter } from "@/config/nodemailer";
import prismadb from "@/lib/prismadb";
import { generatePdfReceipt } from "@/lib/receiptGeneration";
import { PUBLIC_KEY } from "@/constants/index";
import { createPublicKey, verify } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Функция для форматирования публичного ключа
function chunkSplit(str: string, length: number) {
  const chunked = [];
  for (let i = 0; i < str.length; i += length) {
    chunked.push(str.slice(i, i + length));
  }
  return chunked.join("\n");
}

export async function POST(req: Request) {
  try {
    const headersList = headers();
    // Env-first: SECURE_PROCESSOR_PUBLIC_KEY is managed in Vercel; constant kept as legacy fallback
    const shopPublicKey = process.env.SECURE_PROCESSOR_PUBLIC_KEY || PUBLIC_KEY;

    const signature = headersList.get("content-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing signature." },
        { status: 403 }
      );
    }

    // Форматирование публичного ключа
    const formattedPublicKey = `-----BEGIN PUBLIC KEY-----\n${chunkSplit(
      shopPublicKey,
      64
    )}\n-----END PUBLIC KEY-----`;
    const publicKey = createPublicKey(formattedPublicKey);

    // Получение необработанного тела запроса
    const rawBody = await req.text();

    const isVerified = verify(
      "sha256",
      Buffer.from(rawBody), // Используем тело как строку, а не JSON
      publicKey,
      Buffer.from(signature, "base64")
    );
    if (isVerified) {
      const body = JSON.parse(rawBody); // Теперь можем парсить тело
      if (body?.transaction?.status === "successful") {
        const userId = body?.transaction?.tracking_id;

        const user = await prismadb.user.findUnique({
          where: {
            clerkId: userId,
          },
          select: {
            usedGenerations: true,
            availableGenerations: true,
          },
        });

        if (!user) {
          return NextResponse.json(
            { success: false, message: "User not found." },
            { status: 403 }
          );
        }

        const text = body?.transaction?.description;
        const match = text.match(/\((\d+)\sTokens\)/);

        if (!match) {
          return NextResponse.json(
            { success: false, message: "Generations not found." },
            { status: 403 }
          );
        }
        const number = parseInt(match[1]);

        await prismadb.user.update({
          where: {
            clerkId: userId,
          },
          data: {
            availableGenerations:
              user?.availableGenerations - user?.usedGenerations + number,
            usedGenerations: 0,
          },
        });

        const transaction = body.transaction;

        await prismadb.transaction.create({
          data: {
            tracking_id: transaction.tracking_id,
            userId: userId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
            type: transaction.type,
            payment_method_type: transaction.payment_method_type,
            message: transaction.message,
            paid_at: transaction.paid_at ? new Date(transaction.paid_at) : null,
            receipt_url: transaction.receipt_url,
          },
        });

        try {
          const pdfBuffer = await generatePdfReceipt(
            String(body.transaction.uid).split("-").pop() ?? "",
            body.transaction.customer.email,
            new Date(Date.now()).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
            number,
            body.transaction.description,
            body.transaction.amount,
            body.transaction.currency
          );

          await transporter.sendMail({
            from: process.env.OUTBOX_EMAIL,
            to: body.transaction.customer.email,
            subject: `Receipt #${
              String(body.transaction.uid).split("-").pop() || "42f7fj3u48rh"
            } - Yum-Mi Tokens Purchase`,
            text: `Hi there,

We're excited to welcome you to Yum-Mi — thanks so much for your recent order on yum-mi.com!

You’ll find your transaction receipt attached to this message. Be sure to keep it in case you need it later.

If you run into any issues, have questions about your token usage, or need guidance, our support team is just an email away at support@yum-mi.com. We're always ready to help.

We’re honored to be part of your creative journey.

With appreciation,
The Yum-Mi Team
yum-mi.com
support@yum-mi.com`,
            attachments: [
              {
                filename:
                  `receipt-${String(body.transaction.uid)
                    .split("-")
                    .pop()}.pdf` || "receipt.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
        } catch (emailError) {
          console.error("Failed to send receipt email:", emailError);
        }

        return NextResponse.json(
          { success: true, message: "Success Response" },
          { status: 200 }
        );
      } else {
        console.log("Transaction was not successful.");
        return NextResponse.json(
          { success: false, message: "Transaction was not successful" },
          { status: 200 }
        );
      }
    } else {
      console.log("Invalid signature.");
      return NextResponse.json(
        { success: false, message: "Invalid signature." },
        { status: 403 }
      );
    }
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { success: false, error: "Internal Error." },
      { status: 500 }
    );
  }
}
