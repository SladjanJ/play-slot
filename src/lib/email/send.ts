type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = {
  ok: boolean;
  skipped?: boolean;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return { ok: false, skipped: true };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "PlaySlot <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] send failed:", response.status, body);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] send error:", error);
    return { ok: false };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bookingEmailHtml({
  greeting,
  body,
  footer,
}: {
  greeting: string;
  body: string;
  footer: string;
}) {
  return `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(body)}</p>
      <p style="color: #666; font-size: 14px;">${escapeHtml(footer)}</p>
    </div>
  `;
}
