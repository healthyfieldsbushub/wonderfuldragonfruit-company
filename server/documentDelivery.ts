/**
 * Delivery of invoice and quotation PDFs to customers.
 *
 * Two channels, with different real-world constraints that this module surfaces
 * honestly rather than hiding:
 *
 *   EMAIL  - works end to end. The PDF is attached to the message.
 *
 *   WHATSAPP - the PDF must reach the customer as a WhatsApp document message.
 *     Meta rejects free-form messages (including documents) with error 131070
 *     "another app is controlling this thread now" whenever a different app owns
 *     the conversation thread for that customer. This was verified against both
 *     the direct Cloud API and the Cloudflare Worker bridge. Templates are NOT
 *     affected and still deliver.
 *
 *     Because of that, a WhatsApp send reports the real outcome: either the
 *     message id Meta returned, or a specific, actionable reason it could not be
 *     sent. It never reports success for a message Meta did not accept.
 */

export type DeliveryResult = {
  channel: "email" | "whatsapp";
  ok: boolean;
  /** Provider message id when the provider accepted the message. */
  messageId?: string;
  /** Human-readable outcome, always populated. */
  detail: string;
  /** Set when the provider returned a structured error code. */
  errorCode?: string | number;
  /** True when retrying later could plausibly succeed. */
  retryable?: boolean;
};

export type EmailAttachment = { filename: string; content: Buffer; contentType?: string };

/** Normalises a South African or international number to Meta's digits-only form. */
export function normalisePhone(input: string): string {
  const digits = String(input || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits.replace(/^\+/, "");
}

export async function sendDocumentEmail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachment: EmailAttachment;
  replyTo?: string;
}): Promise<DeliveryResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return {
      channel: "email",
      ok: false,
      detail: "Email is not configured: SMTP_HOST, SMTP_USER and SMTP_PASS must all be set.",
      retryable: false,
    };
  }
  if (!options.to || !/.+@.+\..+/.test(options.to)) {
    return { channel: "email", ok: false, detail: "The customer has no valid email address on file.", retryable: false };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE ?? "true") !== "false",
      auth: { user, pass },
    });
    const info = await transport.sendMail({
      from: `"Wonderful Dragon Fruit South Africa" <${from}>`,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: [
        { filename: options.attachment.filename, content: options.attachment.content, contentType: options.attachment.contentType || "application/pdf" },
      ],
    });
    const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
    return {
      channel: "email",
      ok: accepted > 0,
      messageId: info.messageId,
      detail: accepted > 0
        ? `Email accepted by ${host} for ${options.to} (${String(info.response || "").slice(0, 80)})`
        : `The mail server rejected ${options.to}`,
      retryable: accepted === 0,
    };
  } catch (error) {
    return {
      channel: "email",
      ok: false,
      detail: error instanceof Error ? error.message : "Email delivery failed",
      retryable: true,
    };
  }
}

/**
 * Sends a PDF as a WhatsApp document message.
 *
 * Requires a publicly reachable HTTPS URL for the PDF: Meta fetches the file
 * itself and will not accept an inline upload on the message endpoint.
 */
export async function sendDocumentWhatsApp(options: {
  to: string;
  pdfUrl: string;
  filename: string;
  caption?: string;
}): Promise<DeliveryResult> {
  const token = process.env.META_WHATSAPP_TOKEN || process.env.FACEBOOK_GRAPH_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      channel: "whatsapp",
      ok: false,
      detail: "WhatsApp is not configured: META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID must be set.",
      retryable: false,
    };
  }
  if (!/^https:\/\//i.test(options.pdfUrl || "")) {
    return {
      channel: "whatsapp",
      ok: false,
      detail: "WhatsApp document delivery needs a public HTTPS URL for the PDF; Meta fetches the file itself.",
      retryable: false,
    };
  }

  const to = normalisePhone(options.to);
  if (!to) {
    return { channel: "whatsapp", ok: false, detail: "The customer has no WhatsApp number on file.", retryable: false };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: { link: options.pdfUrl, filename: options.filename, caption: options.caption },
      }),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.ok) {
      const messages = (body.messages as Array<{ id?: string }>) || [];
      return {
        channel: "whatsapp",
        ok: true,
        messageId: messages[0]?.id,
        detail: `WhatsApp accepted the document for ${to}`,
      };
    }

    const error = (body.error || {}) as Record<string, unknown>;
    const code = error.code as string | number | undefined;
    const metaMessage = String(error.message || `HTTP ${response.status}`);
    const details = String((error.error_data as Record<string, unknown> | undefined)?.details || "");

    // 131070 is the thread-ownership conflict. Explain it in plain language,
    // because "Caller is not thread owner" gives an administrator nothing to act on.
    if (Number(code) === 131070) {
      return {
        channel: "whatsapp",
        ok: false,
        errorCode: code,
        retryable: true,
        detail:
          "Meta refused the document because another app currently owns this customer's conversation thread " +
          "(error 131070). This is a Meta Business configuration state, not a site fault. Fix it by having the " +
          "thread-owning app release the thread, or deliver the invoice through an approved template that carries " +
          "a document header. Templates are unaffected and continue to deliver.",
      };
    }

    return {
      channel: "whatsapp",
      ok: false,
      errorCode: code,
      retryable: true,
      detail: `${metaMessage}${details ? ` — ${details}` : ""}`,
    };
  } catch (error) {
    return {
      channel: "whatsapp",
      ok: false,
      detail: error instanceof Error ? error.message : "WhatsApp delivery failed",
      retryable: true,
    };
  }
}

/** Shared, branded email body for invoices and quotations. */
export function documentEmailBody(kind: "invoice" | "quotation", options: {
  documentNumber: string;
  contactName: string;
  total: string;
  dueDate?: string | null;
}) {
  const label = kind === "invoice" ? "Invoice" : "Quotation";
  const lines = [
    `Dear ${options.contactName || "Customer"},`,
    "",
    `Please find attached ${label.toLowerCase()} ${options.documentNumber} for ${options.total}.`,
  ];
  if (kind === "invoice" && options.dueDate) lines.push(`Payment is due by ${options.dueDate}.`);
  lines.push(
    "",
    "Please use the document number as your payment reference.",
    "No refunds. Free shipping is never offered; live courier rates apply.",
    "",
    "Wonderful Dragon Fruit South Africa",
    "dfsa.africa@proagrisa.co.za  ·  +27 83 447 4639",
  );
  const text = lines.join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1c2b24;line-height:1.6">
  <p>Dear ${options.contactName || "Customer"},</p>
  <p>Please find attached <strong>${label.toLowerCase()} ${options.documentNumber}</strong> for <strong>${options.total}</strong>.</p>
  ${kind === "invoice" && options.dueDate ? `<p>Payment is due by <strong>${options.dueDate}</strong>.</p>` : ""}
  <p>Please use the document number as your payment reference.</p>
  <p style="color:#6b7a72;font-size:13px">No refunds. Free shipping is never offered; live courier rates apply.</p>
  <hr style="border:none;border-top:1px solid #dfe5e1" />
  <p style="font-size:13px;color:#14532d"><strong>Wonderful Dragon Fruit South Africa</strong><br />
  dfsa.africa@proagrisa.co.za &middot; +27 83 447 4639</p>
</div>`;
  return { text, html, subject: `${label} ${options.documentNumber} — Wonderful Dragon Fruit South Africa` };
}
