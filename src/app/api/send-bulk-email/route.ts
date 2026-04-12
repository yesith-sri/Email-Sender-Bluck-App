import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const IS_DEMO_MODE = !process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  try {
    const { emails, subject, html, type, certificate, recipientName, demoMode, attachments } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'No emails provided' }, { status: 400 });
    }

    const isDemo = demoMode || IS_DEMO_MODE;

    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = emails.map((email: string) => ({
        email,
        success: Math.random() > 0.2,
        error: Math.random() > 0.8 ? 'Demo error (simulated)' : undefined
      }));

      return Response.json({
        success: true,
        demo: true,
        message: 'Demo mode - emails not actually sent',
        total: emails.length,
        successful: results.filter((r: any) => r.success).length,
        failed: results.filter((r: any) => !r.success).length,
        results
      });
    }

    const email = emails[0];

    if (certificate && type === 'certificate') {
      const base64Data = certificate.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await resend!.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
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
        return Response.json({
          results: [{ email, success: false, error: error.message }]
        }, { status: 200 });
      }

      return Response.json({
        success: true,
        results: [{ email, success: true, id: data?.id }]
      });
    }

    const emailAttachments = attachments && attachments.length > 0
      ? attachments.map((att: { name: string; data: string }) => ({
          filename: att.name,
          content: att.data.split(',')[1],
        }))
      : [];

    const { data, error } = await resend!.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: html,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (error) {
      return Response.json({
        results: [{ email, success: false, error: error.message }]
      }, { status: 200 });
    }

    return Response.json({
      success: true,
      results: [{ email, success: true, id: data?.id }]
    });

  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
