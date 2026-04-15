import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  process.env.FROM_EMAIL ||
  'onboarding@resend.dev';

function extractBase64(data: string): string {
  if (!data) return '';
  const parts = data.split(',');
  return parts.length > 1 ? parts[1] : data;
}

export async function POST(request: Request) {
  try {
    const { emails, subject, html, type, certificate, recipientName, attachments } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'No emails provided' }, { status: 400 });
    }

    if (!resend) {
      console.error('RESEND_API_KEY is not set');
      return Response.json({ error: 'RESEND_API_KEY is not configured on server' }, { status: 500 });
    }

    const results = [];

    for (const email of emails) {
      try {
        if (certificate && type === 'certificate') {
          const base64Data = extractBase64(certificate);
          if (!base64Data) {
            results.push({ email, success: false, error: 'Invalid certificate data' });
            continue;
          }
          const buffer = Buffer.from(base64Data, 'base64');

          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: subject,
            html: html,
            attachments: [
              {
                filename: `Certificate - ${recipientName || 'Recipient'}.png`,
                content: buffer.toString('base64'),
              },
            ],
          });

          if (error) {
            console.error('Resend certificate error:', error);
            results.push({ email, success: false, error: error.message });
          } else {
            console.log('Certificate sent to', email, 'ID:', data?.id);
            results.push({ email, success: true, id: data?.id });
          }
        } else {
          const emailAttachments = attachments && attachments.length > 0
            ? attachments.map((att: { name: string; data: string }) => ({
                filename: att.name,
                content: extractBase64(att.data),
              }))
            : [];

          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: subject,
            html: html,
            attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
          });

          if (error) {
            console.error('Resend error:', error);
            results.push({ email, success: false, error: error.message });
          } else {
            console.log('Email sent to', email, 'ID:', data?.id);
            results.push({ email, success: true, id: data?.id });
          }
        }
      } catch (err: any) {
        console.error('Send error for', email, err);
        results.push({ email, success: false, error: err.message || 'Failed to send' });
      }
    }

    return Response.json({ results });

  } catch (error: any) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
