// feat: admin campaign finalization logic
// feat: implement api for campaign end finalization and order extraction
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // In a real application, ensure only admins or a valid CRON secret can trigger this.
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  // Basic auth check (can be replaced with a CRON secret check for automated triggering)
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all distinct users with items in their cart
    const { data: cartUsers, error: usersError } = await supabase
      .from('cart_items')
      .select('user_id')
      .not('user_id', 'is', null);
      
    if (usersError) throw usersError;

    // Deduplicate user IDs
    const userIds = Array.from(new Set(cartUsers.map(u => u.user_id)));

    const results = [];

    // 2. For each user, finalize their cart into an order if they have enough coins
    for (const userId of userIds) {
      // Fetch full cart for user with variant details
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select(`
          id, quantity,
          product_variants (
            id, label, coin_price, cash_price_kobo,
            products ( name )
          )
        `)
        .eq('user_id', userId);

      if (!cartItems || cartItems.length === 0) continue;

      let totalCoins = 0;
      let totalCash = 0;

      for (const item of cartItems) {
        const variant: any = item.product_variants;
        if (variant) {
          totalCoins += variant.coin_price * item.quantity;
          totalCash += variant.cash_price_kobo * item.quantity;
        }
      }

      // Check user's available coins (approximate via ledger sum)
      const { data: ledger } = await supabase
        .from('coin_ledger')
        .select('amount')
        .eq('user_id', userId);

      const availableCoins = ledger?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

      // If user has enough coins, auto-checkout their cart
      if (availableCoins >= totalCoins) {
        const orderNumber = `NAC100-${Math.floor(100000 + Math.random() * 900000)}`;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            order_number: orderNumber,
            status: 'CONFIRMED', // or DRAFT
            payment_status: totalCash > 0 ? 'PENDING' : 'PAID',
            coin_total: totalCoins,
            cash_total_kobo: totalCash
          })
          .select('id')
          .single();

        if (orderError) continue;

        // Insert order items
        const orderItemsToInsert = cartItems.map(item => {
          const v: any = item.product_variants;
          const pName = v.products?.name || v.products?.[0]?.name || 'Unknown Product';
          return {
          order_id: order.id,
          product_variant_id: v.id,
          product_name_snapshot: pName,
          variant_label_snapshot: v.label,
          quantity: item.quantity,
          coin_price_snapshot: v.coin_price,
          cash_price_kobo_snapshot: v.cash_price_kobo,
          coin_total: v.coin_price * item.quantity,
          cash_total_kobo: v.cash_price_kobo * item.quantity
        }});

        await supabase.from('order_items').insert(orderItemsToInsert);

        // Debit coins
        if (totalCoins > 0) {
          await supabase.from('coin_ledger').insert({
            user_id: userId,
            amount: -totalCoins,
            reason: 'AUTO_CHECKOUT_CAMPAIGN_END',
            reference_type: 'order_id',
            reference_id: order.id,
            idempotency_key: `campaign-end-${order.id}`
          });
        }

        // Clear cart
        await supabase.from('cart_items').delete().eq('user_id', userId);

        results.push({ userId, status: 'success', orderId: order.id });
      } else {
        // Insufficient coins. Log failure or email user.
        results.push({ userId, status: 'insufficient_coins' });
      }
    }

    // Audit Log
    await supabase.from('audit_logs').insert({
      user_id: userData.user.id,
      action: 'FINALIZE_CAMPAIGN',
      entity_type: 'campaigns',
      details: { results: results.length }
    });

    return NextResponse.json({ message: 'Campaign finalized', results }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
