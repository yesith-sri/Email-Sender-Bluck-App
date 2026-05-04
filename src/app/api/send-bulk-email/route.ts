import { Resend } from 'resend';

interface SendEmailRequest {
  emails: string[];
  subject: string;
  html: string;
  type?: 'invitation' | 'certificate';
  certificate?: string;
  recipientName?: string;
  attachments?: { name: string; data: string }[];
}

interface EmailResult {
  email: string;
  success: boolean;
  error?: string;
  id?: string;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const resend = (() => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured');
    return null;
  }
  return new Resend(apiKey);
})();

function extractBase64(data: string): string {
  if (!data) return '';
  const parts = data.split(',');
  return parts.length > 1 ? parts[1] : data;
}

async function sendSingleEmail(params: {
  to: string;
  subject: string;
  html: string;
  type?: string;
  certificate?: string;
  recipientName?: string;
  attachments?: { name: string; data: string }[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const basePayload = {
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };

    if (params.type === 'certificate' && params.certificate) {
      const base64Data = extractBase64(params.certificate);
      if (!base64Data) return { success: false, error: 'Invalid certificate data' };

      const buffer = Buffer.from(base64Data, 'base64');
      const { data, error } = await resend.emails.send({
        ...basePayload,
        attachments: [{
          filename: `Certificate - ${params.recipientName || 'Recipient'}.png`,
          content: buffer.toString('base64'),
        }],
      });

      return error ? { success: false, error: error.message } : { success: true, id: data?.id };
    }

    const emailAttachments = params.attachments?.map(att => ({
      filename: att.name,
      content: extractBase64(att.data),
    }));

    const { data, error } = await resend.emails.send({
      ...basePayload,
      attachments: emailAttachments?.length ? emailAttachments : undefined,
    });

    return error ? { success: false, error: error.message } : { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send' };
  }
}

export async function POST(request: Request) {
  try {
    const body: SendEmailRequest = await request.json();

    if (!body.emails?.length || !Array.isArray(body.emails)) {
      return Response.json({ error: 'No emails provided' }, { status: 400 });
    }

    if (!resend) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const results: EmailResult[] = [];

    for (const email of body.emails) {
      const result = await sendSingleEmail({
        to: email,
        subject: body.subject,
        html: body.html,
        type: body.type,
        certificate: body.certificate,
        recipientName: body.recipientName,
        attachments: body.attachments,
      });

      results.push({ email, success: result.success, id: result.id, error: result.error });
    }

    return Response.json({ results });
  } catch (error: any) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
