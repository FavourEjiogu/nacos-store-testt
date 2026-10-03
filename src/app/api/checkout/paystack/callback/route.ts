// feat: handle paystack webhook verification and order status update
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // trxref and reference are sent by Paystack on redirect
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  // 1. Verify transaction with Paystack
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    if (data.data.status === 'success') {
      const orderId = data.data.metadata.order_id;
      
      const supabase = await createClient();

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'PAID' })
        .eq('id', orderId);
        
      if (error) {
        console.error('Failed to update order status:', error);
      }

      // Redirect to success page
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/account/orders?payment=success`);
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/cart?payment=failed`);
    }

  } catch (error) {
    console.error('Paystack verification error:', error);
    return NextResponse.json({ error: 'Verification error' }, { status: 500 });
  }
}
