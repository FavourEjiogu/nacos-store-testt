// feat: integrate paystack initialization for mixed coin/cash orders
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const orderId = formData.get('order_id') as string;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  // 1. Fetch order details from Supabase
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userData.user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.cash_total_kobo <= 0) {
    return NextResponse.json({ error: 'No cash payment required for this order' }, { status: 400 });
  }

  if (order.payment_status === 'PAID') {
    return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
  }

  // 2. Initialize Paystack Transaction
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
     return NextResponse.json({ error: 'Server configuration error (Paystack)' }, { status: 500 });
  }

  const payload = {
    email: userData.user.email,
    amount: order.cash_total_kobo,
    reference: `nacos_${order.order_number}_${Date.now()}`,
    metadata: {
      order_id: order.id,
      user_id: userData.user.id
    },
    // The callback route needs to verify the transaction
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/paystack/callback`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cart`
  };

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Paystack Initialization Failed:', data);
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
    }

    // 3. Redirect user to the Paystack checkout URL
    return NextResponse.redirect(data.data.authorization_url, 303);

  } catch (err) {
    console.error('Paystack request error:', err);
    return NextResponse.json({ error: 'Payment initialization error' }, { status: 500 });
  }
}
