import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Cart | NACOS 100',
};

export default async function CartPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect('/login');
  }

  // Fetch active campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, status, ends_at')
    .in('status', ['SCHEDULED', 'LIVE'])
    .limit(1)
    .single();

  if (!campaign) {
    return (
      <main className="flex-1 container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-display font-bold uppercase">Store is Closed</h1>
        <p className="text-text-muted mt-4">There is no active campaign at the moment.</p>
      </main>
    );
  }

  // Fetch wallet balance
  const { data: ledgerEntries } = await supabase
    .from('coin_ledger')
    .select('amount, direction')
    .eq('user_id', userData.user.id)
    .eq('campaign_id', campaign.id);

  const balance = (ledgerEntries || []).reduce((acc: number, entry: any) => {
    return entry.direction === 'CREDIT' ? acc + entry.amount : acc - entry.amount;
  }, 0);

  // Fetch cart & items
  const { data: cart } = await supabase
    .from('carts')
    .select(`
      id, status,
      cart_items (
        id, quantity,
        products ( id, name, slug, product_media(public_url, is_primary) ),
        product_variants ( id, sku, coin_price, cash_price_kobo )
      )
    `)
    .eq('user_id', userData.user.id)
    .eq('campaign_id', campaign.id)
    .maybeSingle();

  const items = cart?.cart_items || [];
  
  const totalCoins = items.reduce((acc: number, item: any) => {
    return acc + (item.quantity * (item.product_variants?.coin_price || 0));
  }, 0);

  const exceedsBalance = totalCoins > balance;
  const coinsToPay = Math.min(totalCoins, balance);
  const remainingCoinsToPayAsCash = exceedsBalance ? totalCoins - balance : 0;
  
  // Example conversion: 1 NACOS Coin = 100 NGN (Wait, the user said "any additional cost handled via payment", let's say 1 coin = 100 NGN for demo)
  const cashTotalNGN = remainingCoinsToPayAsCash * 100;

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Your Cart</h1>
          <p className="text-text-muted mt-2">
            You have <span className="font-bold text-nacos-green">{balance} COINS</span> available in your wallet.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border-main rounded-xl space-y-6">
            <p className="text-lg text-text-faint font-bold uppercase tracking-widest">Your cart is empty</p>
            <Link href="/shop">
              <Button>BROWSE MERCH</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item: any) => {
                const product = item.products;
                const variant = item.product_variants;
                const images = product.product_media || [];
                const img = images.find((m: any) => m.is_primary)?.public_url || images[0]?.public_url || 'https://placehold.co/100x100/e4e4e4/0a0a0a';

                return (
                  <div key={item.id} className="flex gap-4 border-2 border-border-main p-4 rounded-xl bg-bg-subtle">
                    <div className="h-24 w-24 relative rounded-md overflow-hidden bg-bg border border-border-main flex-shrink-0">
                      <Image src={img} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold">{product.name}</h3>
                        {variant?.sku && <p className="text-xs text-text-muted">SKU: {variant.sku}</p>}
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-sm font-bold text-nacos-green">
                          {variant?.coin_price || 0} COINS
                        </p>
                        <p className="text-xs font-bold uppercase text-text-faint">QTY: {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-bg border-2 border-border-strong p-6 rounded-xl space-y-6 h-fit sticky top-24">
              <h2 className="font-display font-bold text-xl uppercase">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Cart Total (Coins)</span>
                  <span className="font-bold tabular-nums">{totalCoins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Wallet Balance</span>
                  <span className="font-bold tabular-nums text-nacos-green">{balance}</span>
                </div>
                
                <div className="h-px bg-border-main my-4" />

                <div className="flex justify-between font-bold">
                  <span>Deduction from Wallet</span>
                  <span className="tabular-nums">-{coinsToPay} COINS</span>
                </div>

                {exceedsBalance && (
                  <div className="flex justify-between font-bold text-red-500">
                    <span>Cash Payment Required</span>
                    <span className="tabular-nums">₦{cashTotalNGN.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="bg-nacos-green/10 p-4 rounded-lg text-xs text-nacos-green font-bold">
                Carts will be automatically frozen on: <br/>
                <span className="text-black">{new Date(campaign.ends_at).toLocaleString()}</span>
              </div>

              <div className="space-y-3 pt-4">
                {exceedsBalance ? (
                  <form action="/api/checkout/paystack" method="POST">
                    <input type="hidden" name="cart_id" value={cart?.id || ''} />
                    <Button type="submit" className="w-full">PAY & RESERVE</Button>
                  </form>
                ) : (
                  <form action="/api/checkout/confirm" method="POST">
                    <input type="hidden" name="cart_id" value={cart?.id || ''} />
                    <Button type="submit" className="w-full">CONFIRM SELECTION</Button>
                  </form>
                )}
                <p className="text-center text-xs text-text-faint font-bold">
                  {exceedsBalance ? 'Redirects to Paystack' : 'Finalizes your choices'}
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
