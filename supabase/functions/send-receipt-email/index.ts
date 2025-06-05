import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, productTitle, contentLink, orderDetails } = await req.json();

    await smtp.send({
      from: Deno.env.get('SMTP_FROM') || 'noreply@linknest.com',
      to,
      subject: `Your Purchase: ${productTitle}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Thank you for your purchase!</h2>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1a1a1a; margin-top: 0;">Order Details</h3>
            <p style="color: #4b5563; margin-bottom: 10px;">Order ID: ${orderDetails.id}</p>
            <p style="color: #4b5563; margin-bottom: 10px;">Product: ${productTitle}</p>
            <p style="color: #4b5563; margin-bottom: 10px;">Amount: ${(orderDetails.amount / 100).toFixed(2)} USD</p>
            <p style="color: #4b5563;">Date: ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #166534; margin-top: 0;">Access Your Purchase</h3>
            <p style="color: #166534; margin-bottom: 15px;">Your content is ready! Click the button below to access it.</p>
            <a href="${contentLink}" 
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              View Content
            </a>
          </div>

          <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
            <p>If you have any questions about your purchase, please contact support@linknest.com</p>
          </div>
        </div>
      `,
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