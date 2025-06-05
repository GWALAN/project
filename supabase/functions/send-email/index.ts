import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const smtp = new SMTPClient({
  host: Deno.env.get('SMTP_HOST') || '',
  port: Number(Deno.env.get('SMTP_PORT')) || 587,
  username: Deno.env.get('SMTP_USERNAME') || '',
  password: Deno.env.get('SMTP_PASSWORD') || '',
  tls: true,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const templates = {
  orderConfirmation: (data: any) => `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">Thank you for your purchase!</h2>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #1a1a1a; margin-top: 0;">Order Details</h3>
        <p style="color: #4b5563; margin-bottom: 10px;">Order ID: ${data.orderId}</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Product: ${data.productTitle}</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Amount: ${(data.amount / 100).toFixed(2)} USD</p>
        <p style="color: #4b5563;">Date: ${new Date().toLocaleDateString()}</p>
      </div>

      ${data.downloadUrl ? `
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #166534; margin-top: 0;">Download Your Purchase</h3>
          <p style="color: #166534; margin-bottom: 15px;">Your download is ready! Click the button below to access your files.</p>
          <a href="${data.downloadUrl}" 
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Download Now
          </a>
          <p style="color: #166534; font-size: 14px; margin-top: 15px;">
            This download link will expire in 24 hours for security.
          </p>
        </div>
      ` : `
        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #075985; margin-top: 0;">Next Steps</h3>
          <p style="color: #075985;">
            The creator will contact you shortly with further details about your purchase.
          </p>
        </div>
      `}

      <div style="background: #faf5ff; border-radius: 8px; padding: 20px;">
        <h3 style="color: #6b21a8; margin-top: 0;">Need Help?</h3>
        <p style="color: #6b21a8; margin-bottom: 15px;">
          Have questions about your order? You can message the creator directly:
        </p>
        <a href="${data.messageUrl}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Message Creator
        </a>
      </div>
    </div>
  `,
  
  newOrder: (data: any) => `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">You've Got a New Order! 🎉</h2>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #1a1a1a; margin-top: 0;">Order Details</h3>
        <p style="color: #4b5563; margin-bottom: 10px;">Order ID: ${data.orderId}</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Product: ${data.productTitle}</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Buyer: ${data.buyerEmail}</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Amount: ${(data.amount / 100).toFixed(2)} USD</p>
        <p style="color: #4b5563; margin-bottom: 10px;">Platform Fee: ${(data.platformFee / 100).toFixed(2)} USD</p>
        <p style="color: #4b5563;">Your Earnings: ${((data.amount - data.platformFee) / 100).toFixed(2)} USD</p>
      </div>

      ${!data.isDigitalProduct ? `
        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #075985; margin-top: 0;">Action Required</h3>
          <p style="color: #075985; margin-bottom: 15px;">
            Please contact the buyer to arrange delivery of your service.
          </p>
          <a href="${data.dashboardUrl}" 
             style="display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Order Details
          </a>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.dashboardUrl}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Go to Dashboard
        </a>
      </div>
    </div>
  `,

  newMessage: (data: any) => `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">New Message Received</h2>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #4b5563; margin-bottom: 10px;"><strong>From:</strong> ${data.senderName}</p>
        <p style="color: #4b5563; margin-bottom: 10px;"><strong>Regarding:</strong> ${data.productTitle}</p>
        <div style="background: white; border-radius: 6px; padding: 15px; margin-top: 15px;">
          <p style="color: #1a1a1a; margin: 0;">${data.message}</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.replyUrl}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Reply to Message
        </a>
      </div>
    </div>
  `,
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, template, data }: EmailData = await req.json();

    // Get template function
    const templateFn = templates[template as keyof typeof templates];
    if (!templateFn) {
      throw new Error('Invalid template');
    }

    // Send email
    await smtp.send({
      from: Deno.env.get('SMTP_FROM') || 'noreply@linknest.com',
      to,
      subject,
      html: templateFn(data),
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});