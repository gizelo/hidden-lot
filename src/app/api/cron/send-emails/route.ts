import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmail,
  outbidEmail,
  auctionWonEmail,
  auctionEndedSellerEmail,
} from "@/lib/email";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pending, error: fetchError } = await supabase
    .from("email_outbox")
    .select("id, to_email, type, payload, attempts")
    .is("sent_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of pending ?? []) {
    const built = buildEmail(row.type, row.payload);
    if (!built) {
      await supabase
        .from("email_outbox")
        .update({
          attempts: row.attempts + 1,
          last_error: `Unknown type: ${row.type}`,
        })
        .eq("id", row.id);
      failed++;
      continue;
    }

    const result = await sendEmail({
      to: row.to_email,
      subject: built.subject,
      html: built.html,
    });

    if (result.ok) {
      await supabase
        .from("email_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      await supabase
        .from("email_outbox")
        .update({
          attempts: row.attempts + 1,
          last_error: result.error,
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, processed: (pending ?? []).length });
}

function buildEmail(
  type: string,
  payload: unknown
): { subject: string; html: string } | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  const lotId = String(p.lot_id ?? "");
  const lotTitle = String(p.lot_title ?? "");

  switch (type) {
    case "outbid":
      return outbidEmail({
        lotId,
        lotTitle,
        newAmountCents: Number(p.new_amount_cents ?? 0),
      });
    case "auction_won":
      return auctionWonEmail({
        lotId,
        lotTitle,
        finalAmountCents: Number(p.final_amount_cents ?? 0),
      });
    case "auction_ended_seller":
      return auctionEndedSellerEmail({
        lotId,
        lotTitle,
        finalAmountCents: Number(p.final_amount_cents ?? 0),
      });
    default:
      return null;
  }
}
