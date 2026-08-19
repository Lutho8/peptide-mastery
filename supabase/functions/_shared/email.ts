// Transactional email sender, replacing `npm:@lovable.dev/email-js`
// (which posted to https://api.lovable.dev using LOVABLE_API_KEY).
//
// Provider-agnostic on purpose: the queue, retry, DLQ and rate-limit handling
// in process-email-queue stay identical, and only this file knows who actually
// delivers the mail.
//
// Configure with Supabase secrets:
//   EMAIL_PROVIDER   "resend" | "none"   (default: "resend" if RESEND_API_KEY is
//                                         set, otherwise "none")
//   RESEND_API_KEY   required when EMAIL_PROVIDER=resend
//   EMAIL_FROM       fallback From address when a payload omits one
//
// With EMAIL_PROVIDER=none the sender logs what it *would* have sent and
// reports success, so the queue drains cleanly instead of backing up while a
// provider is being chosen. Nothing is delivered in that mode.

export type EmailMessage = {
  run_id?: string;
  to: string;
  from?: string;
  sender_domain?: string;
  subject: string;
  html?: string;
  text?: string;
  purpose?: string;
  label?: string;
  idempotency_key?: string;
  unsubscribe_token?: string;
  message_id?: string;
};

/**
 * Carries the upstream HTTP status so existing 429 handling keeps working —
 * process-email-queue checks `error.status === 429` to back off.
 */
export class EmailSendError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "EmailSendError";
    this.status = status;
  }
}

function resolveProvider(): "resend" | "none" {
  const explicit = Deno.env.get("EMAIL_PROVIDER")?.toLowerCase();
  if (explicit === "resend" || explicit === "none") return explicit;
  return Deno.env.get("RESEND_API_KEY") ? "resend" : "none";
}

/** True when a real provider is wired up. Used for startup config checks. */
export function isEmailConfigured(): boolean {
  const provider = resolveProvider();
  if (provider === "none") return true; // intentionally a no-op, not a misconfiguration
  return Boolean(Deno.env.get("RESEND_API_KEY"));
}

export function emailProviderName(): string {
  return resolveProvider();
}

async function sendViaResend(msg: EmailMessage): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new EmailSendError("RESEND_API_KEY is not configured", 500);
  }

  const from = msg.from ?? Deno.env.get("EMAIL_FROM");
  if (!from) {
    throw new EmailSendError("No From address: set EMAIL_FROM or include `from` in the payload", 500);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  // Resend de-duplicates on this header, which preserves the queue's
  // at-least-once delivery guarantee without sending twice on retry.
  if (msg.idempotency_key) headers["Idempotency-Key"] = msg.idempotency_key;

  const body: Record<string, unknown> = {
    from,
    to: [msg.to],
    subject: msg.subject,
  };
  if (msg.html) body.html = msg.html;
  if (msg.text) body.text = msg.text;
  if (msg.unsubscribe_token) {
    const base = Deno.env.get("PUBLIC_SITE_URL") ?? "https://peptide-south-africa.co.za";
    body.headers = {
      "List-Unsubscribe": `<${base}/unsubscribe?token=${encodeURIComponent(msg.unsubscribe_token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new EmailSendError(
      `Resend rejected the message (${res.status}): ${detail.slice(0, 300)}`,
      res.status,
    );
  }
}

/**
 * Sends one transactional email. Throws EmailSendError on failure so the
 * caller's retry / DLQ logic is unchanged.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const provider = resolveProvider();

  if (provider === "none") {
    console.warn("[email] no provider configured — message not delivered", {
      to: msg.to,
      subject: msg.subject,
      purpose: msg.purpose,
      label: msg.label,
      message_id: msg.message_id,
    });
    return;
  }

  await sendViaResend(msg);
}
