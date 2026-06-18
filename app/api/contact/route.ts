import { mailOptions, transporter } from "@/config/nodemailer";
import axios from "axios";
import { NextResponse } from "next/server";

const CONTACT_MESSAGE_FIELDS: { [key: string]: string } = {
  name: "Name:",
  email: "Email:",
  topic: "Topic:",
  message: "Message:",
};

interface ContactMessageFields {
  name: string;
  email: string;
  topic?: string;
  message: string;
  captchaToken?: string;
}

const generateEmailContent = (data: ContactMessageFields) => {
  const stringData = Object.entries(data).reduce((str, [key, val]) => {
    const fieldLabel =
      CONTACT_MESSAGE_FIELDS[key as keyof ContactMessageFields];
    return (str += `${fieldLabel}: \n${val} \n \n`);
  }, "");

  const htmlData = Object.entries(data).reduce((str, [key, val]) => {
    const fieldLabel =
      CONTACT_MESSAGE_FIELDS[key as keyof ContactMessageFields];
    return (str += `<h3 class="form-heading" align="left">${fieldLabel}</h3><p class="form-answer" align="left">${val}</p>`);
  }, "");

  return {
    text: stringData,
    html: `<!DOCTYPE html><html> <head> <title></title> <meta charset="utf-8"/> <meta name="viewport" content="width=device-width, initial-scale=1"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <style type="text/css"> body, table, td, a{-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}table{border-collapse: collapse !important;}body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}@media screen and (max-width: 525px){.wrapper{width: 100% !important; max-width: 100% !important;}.responsive-table{width: 100% !important;}.padding{padding: 10px 5% 15px 5% !important;}.section-padding{padding: 0 15px 50px 15px !important;}}.form-container{margin-bottom: 24px; padding: 20px; border: 1px dashed #ccc;}.form-heading{color: #2a2a2a; font-family: "Helvetica Neue", "Helvetica", "Arial", sans-serif; font-weight: 400; text-align: left; line-height: 20px; font-size: 18px; margin: 0 0 8px; padding: 0;}.form-answer{color: #2a2a2a; font-family: "Helvetica Neue", "Helvetica", "Arial", sans-serif; font-weight: 300; text-align: left; line-height: 20px; font-size: 16px; margin: 0 0 24px; padding: 0;}div[style*="margin: 16px 0;"]{margin: 0 !important;}</style> </head> <body style="margin: 0 !important; padding: 0 !important; background: #fff"> <div style=" display: none; font-size: 1px; color: #fefefe; line-height: 1px;  max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; " ></div><table border="0" cellpadding="0" cellspacing="0" width="100%"> <tr> <td bgcolor="#ffffff" align="center" style="padding: 10px 15px 30px 15px" class="section-padding" > <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px" class="responsive-table" > <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" > <tr> <td style=" padding: 0 0 0 0; font-size: 16px; line-height: 25px; color: #232323; " class="padding message-content" > <h2>New Contact Message</h2> <div class="form-container">${htmlData}</div></td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </body></html>`,
  };
};

async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

  const response = await axios.post<{ success: boolean }>(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      },
    }
  );

  return response.data.success;
}

export const maxDuration = 60;

export async function POST(req: Request): Promise<NextResponse> {
  if (req.method === "POST") {
    const data: ContactMessageFields = await req.json();
    if (!data || !data.name || !data.email || !data.message) {
      return new NextResponse("Bad request", { status: 400 });
    }

    // reCAPTCHA is only enforced when a secret key is configured.
    if (process.env.RECAPTCHA_SECRET_KEY && data.captchaToken) {
      const isCaptchaValid = await verifyRecaptchaToken(data.captchaToken);
      if (!isCaptchaValid) {
        return new NextResponse("Invalid reCAPTCHA", { status: 400 });
      }
    }

    // TODO: configure OUTBOX_EMAIL / OUTBOX_EMAIL_PASSWORD / INBOX_EMAIL to send
    // real mail. Without SMTP creds we log the submission and return success.
    if (!process.env.OUTBOX_EMAIL || !process.env.INBOX_EMAIL) {
      console.info("[contact] stubbed submission:", {
        name: data.name,
        email: data.email,
        topic: data.topic,
      });
      return new NextResponse("Message received", { status: 200 });
    }

    try {
      await transporter.sendMail({
        ...mailOptions,
        ...generateEmailContent(data),
        subject: `New Contact Message${data.topic ? ` — ${data.topic}` : ""}`,
      });
      return new NextResponse("Message sent successfully", { status: 200 });
    } catch (err) {
      console.log(err);
      return NextResponse.json(
        { message: "Some error, try again later" },
        { status: 400 }
      );
    }
  }
  return NextResponse.json({ message: "Bad request" }, { status: 400 });
}
