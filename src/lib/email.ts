import { Resend } from "resend";
import { formatPrice } from "./utils";

const FROM = "HiddenLot <noreply@hiddenlot.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiddenlot.dev";

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    resendClient = new Resend(key);
  }
  return resendClient;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

function lotLink(lotId: string): string {
  return `${SITE_URL}/lot/${lotId}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function emailContact(label: string, email?: string): string {
  if (!email) return "";
  const safeEmail = escapeHtml(email);
  return `<p>${label}: <a href="mailto:${safeEmail}">${safeEmail}</a></p>`;
}

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0a0a0a">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
${bodyHtml}
<p style="color:#737373;font-size:13px;margin-top:32px">— HiddenLot</p>
</body></html>`;
}

export function outbidEmail(args: {
  lotTitle: string;
  lotId: string;
  newAmountCents: number;
}): { subject: string; html: string } {
  const subject = `You've been outbid on "${args.lotTitle}"`;
  const lotTitle = escapeHtml(args.lotTitle);
  const html = shell(
    "You've been outbid",
    `<p>Someone just bid <strong>${formatPrice(args.newAmountCents)}</strong> on <em>${lotTitle}</em>.</p>
<p><a href="${lotLink(args.lotId)}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px">View lot &amp; bid back</a></p>`
  );
  return { subject, html };
}

export function auctionWonEmail(args: {
  lotTitle: string;
  lotId: string;
  finalAmountCents: number;
  sellerEmail?: string;
}): { subject: string; html: string } {
  const subject = `You won "${args.lotTitle}"`;
  const lotTitle = escapeHtml(args.lotTitle);
  const html = shell(
    "Congrats — you won!",
    `<p>You won <em>${lotTitle}</em> for <strong>${formatPrice(args.finalAmountCents)}</strong>.</p>
<p>This is alpha test mode — no real payment is taken.</p>
${emailContact("Seller contact for handover", args.sellerEmail)}
<p><a href="${lotLink(args.lotId)}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px">View lot</a></p>`
  );
  return { subject, html };
}

export function auctionEndedSellerEmail(args: {
  lotTitle: string;
  lotId: string;
  finalAmountCents: number;
  winnerEmail?: string;
}): { subject: string; html: string } {
  const subject = `Your lot "${args.lotTitle}" sold`;
  const lotTitle = escapeHtml(args.lotTitle);
  const html = shell(
    "Your lot sold",
    `<p><em>${lotTitle}</em> sold for <strong>${formatPrice(args.finalAmountCents)}</strong>.</p>
<p>This is alpha test mode — no real payment is processed.</p>
${emailContact("Winner contact for handover", args.winnerEmail)}
<p><a href="${lotLink(args.lotId)}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px">View lot</a></p>`
  );
  return { subject, html };
}
