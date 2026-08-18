import type { SendMailOptions } from "nodemailer";

// Current single eSIM offering. Values provided by the plan supplier;
// replace with per-order values when eSIM provisioning becomes dynamic.
export const ESIM_PLAN = {
  size: "20 GB",
  validity: "30 DAY",
  iccid: "8965012605230250373",
  smDpAddress: "dp.esimdigi.com",
  activationCode: "LUI57-H1D6J-V302B-11J0J",
  apn: "e-ideas",
};

const LPA_CODE = `LPA:1$${ESIM_PLAN.smDpAddress}$${ESIM_PLAN.activationCode}`;

const SUPPORT_EMAIL = "support@myfastbird.com";

interface EsimInstallEmailParams {
  to: string;
  from: string;
  orderId: string;
  receiptId: string;
  receiptPdf: Buffer;
  qrPng: Buffer | null;
}

const buildText = (orderId: string): string => `How to Install Your FastBird eSIM

Hi!

Thank you for your purchase of the following eSIM plan:

Size: ${ESIM_PLAN.size}
Validity: ${ESIM_PLAN.validity}
ICCID: ${ESIM_PLAN.iccid}

You can find your order confirmation in the attachment.

Now here's how you get connected! Make sure you're connected to Wi-Fi or have stable data connection.

INSTALL YOUR ESIM

Start here: QR Code Installation — scan the attached QR code with your phone camera.

Manual Installation
If you are experiencing issues with the QR code, you can try installing manually. Please follow the guide and enter the following when prompted:

iOS
SM-DP+ Address: ${ESIM_PLAN.smDpAddress}
Activation Code: ${ESIM_PLAN.activationCode}

Android
Code: ${LPA_CODE}

Windows Laptop
Activation Code: ${LPA_CODE}

WHEN YOU'RE READY TO USE DATA

1. Go to Settings > Cellular and turn this line on
2. Make sure "Data Roaming" is toggled on and you are selecting the FastBird eSIM for "Cellular Data"
3. This eSIM is automatically activated / started once you connect to the local network at your destination. Note that some eSIMs are activated / started differently.
4. You can check your data usage on the FastBird web portal (myfastbird.com/dashboard).

PLEASE NOTE
The expiry of the plan will not start until the data plan on your eSIM is activated / started.

STILL HAVING ISSUES? MAKE SURE THAT...

1. The eSIM is turned "ON" and selected as "Primary" for mobile data
2. Data Roaming is turned "ON" in your Cellular Settings
3. Check your APN settings. Please note your plan's APN settings is: ${ESIM_PLAN.apn}
4. Manually select the network that your eSIM should connect to.

It may take up to 10-15 min to get connected for the first time. If it takes longer than that, please contact customer support.

REMEMBER:
DO NOT remove this eSIM! This eSIM can only be installed once. Please do not remove it from your phone once installed.

If you have further questions, please contact customer support at ${SUPPORT_EMAIL} and be sure to quote your Order ID, which is: ${orderId}.

The FastBird Team
myfastbird.com`;

const sectionTitle = (title: string): string =>
  `<h2 style="margin:32px 0 12px;font-size:18px;color:#30313d;">${title}</h2>`;

const codeBox = (code: string): string =>
  `<div style="background:#f6f8fa;border:1px solid #e6ebf1;border-radius:6px;padding:10px 14px;font-family:SFMono-Regular,Consolas,Menlo,monospace;font-size:13px;color:#30313d;word-break:break-all;">${code}</div>`;

const buildHtml = (orderId: string, hasQr: boolean): string => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#30313d;line-height:1.55;">

    <h1 style="margin:0 0 20px;font-size:24px;color:#30313d;">How to Install Your FastBird eSIM</h1>

    <p style="margin:0 0 16px;">Hi!</p>
    <p style="margin:0 0 16px;">Thank you for your purchase of the following eSIM plan:</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;color:#687385;width:35%;">Size:</td>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;font-weight:bold;">${ESIM_PLAN.size}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;color:#687385;">Validity:</td>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;font-weight:bold;">${ESIM_PLAN.validity}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;color:#687385;">ICCID:</td>
        <td style="padding:8px 0;border-bottom:1px solid #e6ebf1;font-weight:bold;">${ESIM_PLAN.iccid}</td>
      </tr>
    </table>

    <p style="margin:0 0 16px;">You can find your order confirmation in the attachment.</p>
    <p style="margin:0 0 8px;">Now here's how you get connected! Make sure you're connected to Wi-Fi or have stable data connection.</p>

    ${sectionTitle("Install Your eSIM")}
    <p style="margin:0 0 8px;">Start here:</p>
    <h3 style="margin:0 0 12px;font-size:15px;color:#30313d;">QR Code Installation</h3>
    ${
      hasQr
        ? `<div style="text-align:center;margin:0 0 24px;">
      <img src="cid:esim-install-qr" alt="eSIM installation QR code" width="240" style="width:240px;height:auto;border:1px solid #e6ebf1;border-radius:8px;" />
    </div>`
        : `<p style="margin:0 0 24px;">Scan the QR code attached to this email with your phone camera.</p>`
    }

    <h3 style="margin:0 0 8px;font-size:15px;color:#30313d;">Manual Installation</h3>
    <p style="margin:0 0 12px;">If you are experiencing issues with the QR code, you can try installing manually. Please follow the guide and enter the following when prompted:</p>

    <p style="margin:0 0 6px;font-weight:bold;">iOS</p>
    <p style="margin:0 0 4px;color:#687385;font-size:13px;">SM-DP+ Address:</p>
    ${codeBox(ESIM_PLAN.smDpAddress)}
    <p style="margin:8px 0 4px;color:#687385;font-size:13px;">Activation Code:</p>
    ${codeBox(ESIM_PLAN.activationCode)}

    <p style="margin:16px 0 6px;font-weight:bold;">Android</p>
    <p style="margin:0 0 4px;color:#687385;font-size:13px;">Code:</p>
    ${codeBox(LPA_CODE)}

    <p style="margin:16px 0 6px;font-weight:bold;">Windows Laptop</p>
    <p style="margin:0 0 4px;color:#687385;font-size:13px;">Activation Code:</p>
    ${codeBox(LPA_CODE)}

    ${sectionTitle("When You're Ready to Use Data")}
    <ol style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:8px;">Go to Settings &gt; Cellular and turn this line on</li>
      <li style="margin-bottom:8px;">Make sure "Data Roaming" is toggled on and you are selecting the FastBird eSIM for "Cellular Data"</li>
      <li style="margin-bottom:8px;">This eSIM is automatically activated / started once you connect to the local network at your destination. Note that some eSIMs are activated / started differently.</li>
      <li style="margin-bottom:8px;">You can check your data usage on the <a href="https://myfastbird.com/dashboard" style="color:#625afa;">FastBird web portal</a>.</li>
    </ol>

    <div style="background:#f6f8fa;border-radius:6px;padding:12px 16px;margin:0 0 16px;">
      <p style="margin:0;font-weight:bold;">Please Note</p>
      <p style="margin:4px 0 0;">The expiry of the plan will not start until the data plan on your eSIM is activated / started.</p>
    </div>

    ${sectionTitle("Still Having Issues? Make Sure That&hellip;")}
    <ol style="margin:0 0 12px;padding-left:20px;">
      <li style="margin-bottom:8px;">The eSIM is turned "ON" and selected as "Primary" for mobile data</li>
      <li style="margin-bottom:8px;">Data Roaming is turned "ON" in your Cellular Settings</li>
      <li style="margin-bottom:8px;">Check your APN settings. Please note your plan's APN settings is: <strong>${ESIM_PLAN.apn}</strong></li>
      <li style="margin-bottom:8px;">Manually select the network that your eSIM should connect to.</li>
    </ol>
    <p style="margin:0 0 16px;">It may take up to 10-15 min to get connected for the first time. If it takes longer than that, please contact customer support.</p>

    <div style="background:#fff6f6;border:1px solid #f5c6c6;border-radius:6px;padding:12px 16px;margin:0 0 24px;">
      <p style="margin:0;font-weight:bold;color:#b42318;">Remember: DO NOT remove this eSIM!</p>
      <p style="margin:4px 0 0;">This eSIM can only be installed once. Please do not remove it from your phone once installed.</p>
    </div>

    <p style="margin:0 0 24px;">If you have further questions, please contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#625afa;">customer support</a> and be sure to quote your Order ID, which is: <strong>${orderId}</strong>.</p>

    <p style="margin:0;color:#687385;font-size:13px;">The FastBird Team &middot; <a href="https://myfastbird.com" style="color:#625afa;">myfastbird.com</a> &middot; <a href="mailto:${SUPPORT_EMAIL}" style="color:#625afa;">${SUPPORT_EMAIL}</a></p>
  </div>
</body>
</html>`;

export const buildEsimInstallEmail = ({
  to,
  from,
  orderId,
  receiptId,
  receiptPdf,
  qrPng,
}: EsimInstallEmailParams): SendMailOptions => {
  const attachments: SendMailOptions["attachments"] = [
    {
      filename: `receipt-${receiptId}.pdf`,
      content: receiptPdf,
      contentType: "application/pdf",
    },
  ];

  if (qrPng) {
    attachments.unshift({
      filename: "esim-install-qr.png",
      content: qrPng,
      contentType: "image/png",
      cid: "esim-install-qr",
    });
  }

  return {
    from,
    to,
    subject: "How to Install Your FastBird eSIM",
    text: buildText(orderId),
    html: buildHtml(orderId, Boolean(qrPng)),
    attachments,
  };
};
