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
  const cartId = formData.get('cart_id') as string;

  if (!cartId) {
    return NextResponse.redirect(new URL('/cart?error=missing_cart', request.url), 303);
  }

  // 1. Get the cart and campaign_id
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id, campaign_id, status')
    .eq('id', cartId)
    .eq('user_id', userData.user.id)
    .eq('status', 'OPEN')
    .single();

  if (cartError || !cart) {
    return NextResponse.redirect(new URL('/cart?error=cart_not_found', request.url), 303);
  }

  // 2. First run the checkout RPC to create the order atomically
  // This debits coins, creates the order, and closes the cart.
  const { data: orderId, error: rpcError } = await supabase
    .rpc('checkout_cart', {
      p_campaign_id: cart.campaign_id,
      p_user_id: userData.user.id,
    });

  if (rpcError) {
    console.error('Checkout RPC error:', rpcError.message);
    const msg = encodeURIComponent(rpcError.message || 'checkout_failed');
    return NextResponse.redirect(new URL(`/cart?error=${msg}`, request.url), 303);
  }

  // 3. Fetch the newly created order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, cash_total_kobo, payment_status, currency')
    .eq('id', orderId)
    .eq('user_id', userData.user.id)
    .single();

  if (orderError || !order) {
    console.error('Order fetch error:', orderError);
    // Order created but can't fetch — redirect to orders page
    return NextResponse.redirect(new URL('/account/orders', request.url), 303);
  }

  // If no cash payment needed, redirect to orders
  if (order.cash_total_kobo <= 0 || order.payment_status === 'PAID') {
    return NextResponse.redirect(new URL(`/account/orders?confirmed=${order.id}`, request.url), 303);
  }

  // 4. Initialize Paystack transaction for the cash portion
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.redirect(new URL('/cart?error=payment_config_error', request.url), 303);
  }

  const reference = `nacos-${order.order_number}-${Date.now()}`;

  const payload = {
    email: userData.user.email,
    amount: order.cash_total_kobo,
    currency: order.currency || 'NGN',
    reference,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      user_id: userData.user.id,
    },
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/paystack/callback`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/orders`,
  };

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Paystack initialization failed:', data);
      return NextResponse.redirect(new URL('/cart?error=payment_init_failed', request.url), 303);
    }

    // Store the payment reference for webhook correlation
    await supabase.from('payments').insert({
      order_id: order.id,
      provider: 'PAYSTACK',
      reference,
      amount_kobo: order.cash_total_kobo,
      currency: order.currency || 'NGN',
      status: 'PENDING',
    });

    return NextResponse.redirect(data.data.authorization_url, 303);
  } catch (err) {
    console.error('Paystack request error:', err);
    return NextResponse.redirect(new URL('/cart?error=payment_error', request.url), 303);
  }
}
