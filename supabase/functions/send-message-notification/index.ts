import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { supabase } from './supabase.ts';

const smtp = new SMTPClient({
  host: Deno.env.get('SMTP_HOST') || '',
  port: Number(Deno.env.get('SMTP_PORT')) || 587,
  username: Deno.env.get('SMTP_USERNAME') || '',
  password: Deno.env.get('SMTP_PASSWORD') || '',
  tls: true,
});

serve(async (req) => {
  const { record } = await req.json();

  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        products (
          title,
          creatorid,
          users (
            email,
            displayName
          )
        )
      `)
      .eq('id', record.orderid)
      .single();

    if (orderError) throw orderError;

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('email, displayname')
      .eq('id', record.senderid)
      .single();

    if (senderError) throw senderError;

    // Send email notification
    await smtp.send({
      from: Deno.env.get('SMTP_FROM') || 'noreply@linknest.com',
      to: record.recipientid.includes('@') ? record.recipientid : sender.email,
      subject: `New message regarding order #${order.id}`,
      html: `
        <h2>You have a new message</h2>
        <p><strong>From:</strong> ${sender.displayname}</p>
        <p><strong>Regarding:</strong> ${order.products.title}</p>
        <p><strong>Message:</strong></p>
        <p>${record.content}</p>
        <p><a href="${req.headers.get('origin')}/dashboard/orders">View in Dashboard</a></p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});