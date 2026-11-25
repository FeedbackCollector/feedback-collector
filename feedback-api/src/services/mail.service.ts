import { readFileSync } from 'node:fs';

const RESEND_URL = 'https://api.resend.com/emails';
const LOGO_CID = 'telus-digital-logo';

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function sendMail(to: string, toName: string, subject: string, text: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.MAIL_FROM_EMAIL;
    if (!apiKey || !senderEmail) {
        console.warn(`RESEND_API_KEY or MAIL_FROM_EMAIL is not set: skipping email "${subject}"`);
        return;
    }

    const senderName = process.env.MAIL_FROM_NAME ?? 'Feedback Collector';
    const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [`${toName} <${to}>`],
            subject,
            text,
            html,
            attachments: [
                {
                    filename: 'telus-digital-logo.jpg',
                    content: readFileSync(new URL('../../assets/telus-digital-logo.jpg', import.meta.url)).toString('base64'),
                    content_id: LOGO_CID,
                },
            ],
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(`Resend responded ${response.status}: ${body.message ?? 'unknown error'}`);
    }
}

const BRAND_PURPLE = '#4B286D';
const BRAND_GREEN = '#66CC00';

// The logo is served by this API (/assets). It needs a public https URL to render in mail clients.
function logoUrl(): string | undefined {
    const base = (process.env.PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    return base ? `${base}/assets/telus-digital-logo.jpg` : undefined;
}

function renderLayout(name: string, paragraphs: string[], button?: { label: string; url: string }): string {
    const logo = logoUrl();
    const logoHtml = logo
        ? `<img src="${escapeHtml(logo)}" width="160" alt="TELUS Digital" style="display:block;margin:0 auto;border:0;height:auto;">`
        : `<span style="font-size:22px;font-weight:bold;color:${BRAND_PURPLE};">TELUS Digital</span>`;
    const body = paragraphs.map((p) => `<p style="margin:0 0 16px;">${p}</p>`).join('');
    const buttonHtml = button
        ? `<p style="margin:24px 0;text-align:center;"><a href="${escapeHtml(button.url)}" style="display:inline-block;background:${BRAND_PURPLE};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;">${escapeHtml(button.label)}</a></p>`
        : '';

    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#2b2b2b;">
<tr><td style="padding:24px 32px 16px;text-align:center;">${logoHtml}</td></tr>
<tr><td style="height:4px;background:${BRAND_GREEN};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;">
<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:${BRAND_PURPLE};">Hi ${escapeHtml(name)},</p>
${body}${buttonHtml}
</td></tr>
<tr><td style="padding:16px 32px 24px;font-size:12px;color:#777777;border-top:1px solid #eeeeee;">
Feedback Collector &middot; TELUS Digital<br>This is an automated message, please do not reply.
</td></tr>
</table>
</td></tr></table></body></html>`;
}

export async function sendPendingApprovalEmail(to: string, name: string): Promise<void> {
    await sendMail(
        to,
        name,
        'Your account is pending approval',
        `Hi ${name},\n\nThanks for registering. A director needs to approve your account before you can log in. We will email you as soon as it is approved.\n\nFeedback Collector - TELUS Digital`,
        renderLayout(name, [
            'Thanks for registering.',
            'A director needs to approve your account before you can log in. We will email you as soon as it is approved.',
        ]),
    );
}

export async function sendAccountApprovedEmail(to: string, name: string): Promise<void> {
    const appUrl = process.env.APP_URL?.replace(/\/+$/, '');
    const textLink = appUrl ? `\n\nLog in here: ${appUrl}` : '';

    await sendMail(
        to,
        name,
        'Your account has been approved',
        `Hi ${name},\n\nGood news: your account has been approved and you can now log in.${textLink}\n\nFeedback Collector - TELUS Digital`,
        renderLayout(
            name,
            ['Good news: your account has been approved and you can now log in.'],
            appUrl ? { label: 'Log in to Feedback Collector', url: appUrl } : undefined,
        ),
    );
}
