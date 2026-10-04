// feat: wire checkout confirm to the transactional checkout_cart RPC
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const cartId = formData.get('cart_id') as string;

    if (!cartId) {
      return NextResponse.redirect(new URL('/cart?error=missing_cart', request.url), 303);
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.redirect(new URL('/login', request.url), 303);
    }

    // Get the campaign_id from the cart — we need it for the RPC
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, campaign_id, status')
      .eq('id', cartId)
      .eq('user_id', userData.user.id)
      .eq('status', 'OPEN')
      .single();

    if (cartError || !cart) {
      console.error('Cart lookup error:', cartError);
      return NextResponse.redirect(new URL('/cart?error=cart_not_found', request.url), 303);
    }

    // Call the transactional RPC — this atomically: validates balance,
    // debits ledger, creates order snapshot, and closes cart.
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

    return NextResponse.redirect(new URL(`/account/orders?confirmed=${orderId}`, request.url), 303);
  } catch (error) {
    console.error('Unexpected checkout error:', error);
    return NextResponse.redirect(new URL('/cart?error=unknown', request.url), 303);
  }
}
