import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const signature = request.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const rawBody = await request.text();
    
    // Verify HMAC SHA-512 signature
    const hash = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');
    
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, metadata, amount, currency } = event.data;
      const orderId = metadata?.order_id;

      if (!orderId) {
        return NextResponse.json({ error: 'Missing order_id in metadata' }, { status: 400 });
      }

      const supabase = await createClient();

      // Ensure idempotency and correctness by checking order first
      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status, cash_total_kobo, currency')
        .eq('id', orderId)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.payment_status === 'PAID') {
        // Already processed
        return NextResponse.json({ status: 'success' }, { status: 200 });
      }

      if (order.cash_total_kobo !== amount || order.currency !== currency) {
        return NextResponse.json({ error: 'Amount or currency mismatch' }, { status: 400 });
      }

      // Update payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'PAID' })
        .eq('id', orderId);
        
      // Record payment event
      await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          provider: 'PAYSTACK',
          reference: reference,
          amount_kobo: amount,
          currency: currency,
          status: 'SUCCESS',
          provider_transaction_id: String(event.data.id),
          metadata: event.data
        });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
