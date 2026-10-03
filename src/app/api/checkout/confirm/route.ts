import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const cartId = formData.get('cart_id') as string;

    if (!cartId) {
      return NextResponse.redirect(new URL('/cart?error=missing_cart', request.url));
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Call RPC to convert cart to order
    // Since complex transactional logic is best handled in postgres, we should have an RPC.
    // For now, let's just update the cart status to FROZEN for demo purposes,
    // assuming a batch job processes frozen carts at campaign end.
    
    const { error: updateError } = await supabase
      .from('carts')
      .update({ status: 'FROZEN', frozen_at: new Date().toISOString() })
      .eq('id', cartId)
      .eq('user_id', userData.user.id)
      .eq('status', 'OPEN');

    if (updateError) {
      console.error(updateError);
      return NextResponse.redirect(new URL('/cart?error=checkout_failed', request.url));
    }

    return NextResponse.redirect(new URL('/account/orders', request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/cart?error=unknown', request.url));
  }
}
