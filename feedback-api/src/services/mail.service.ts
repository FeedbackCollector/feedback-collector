const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function sendMail(to: string, toName: string, subject: string, text: string, html: string): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.MAIL_FROM_EMAIL;
    if (!apiKey || !senderEmail) {
        console.warn(`BREVO_API_KEY or MAIL_FROM_EMAIL is not set: skipping email "${subject}"`);
        return;
    }

    const response = await fetch(BREVO_URL, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            sender: { name: process.env.MAIL_FROM_NAME ?? 'Feedback Collector', email: senderEmail },
            to: [{ email: to, name: toName }],
            subject,
            textContent: text,
            htmlContent: html,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(`Brevo responded ${response.status}: ${body.message ?? 'unknown error'}`);
    }
}

export async function sendPendingApprovalEmail(to: string, name: string): Promise<void> {
    await sendMail(
        to,
        name,
        'Your account is pending approval',
        `Hi ${name},\n\nYour registration was received. A director must approve your account before you can log in. You will be able to log in once it is approved.\n\nFeedback Collector`,
        `<p>Hi ${escapeHtml(name)},</p><p>Your registration was received. A director must approve your account before you can log in. You will be able to log in once it is approved.</p><p>Feedback Collector</p>`,
    );
}

export async function sendAccountApprovedEmail(to: string, name: string): Promise<void> {
    const appUrl = process.env.APP_URL?.replace(/\/+$/, '');
    const textLink = appUrl ? `\n\nLog in here: ${appUrl}` : '';
    const htmlLink = appUrl ? `<p><a href="${escapeHtml(appUrl)}">Log in to Feedback Collector</a></p>` : '';

    await sendMail(
        to,
        name,
        'Your account has been approved',
        `Hi ${name},\n\nGood news: a director approved your account. You can now log in.${textLink}\n\nFeedback Collector`,
        `<p>Hi ${escapeHtml(name)},</p><p>Good news: a director approved your account. You can now log in.</p>${htmlLink}<p>Feedback Collector</p>`,
    );
}
