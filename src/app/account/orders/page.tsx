import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'My Orders | NACOS 100',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect('/login');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, coin_total, cash_total_kobo, created_at,
      order_items ( id, product_name_snapshot, quantity, coin_total )
    `)
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Your Orders</h1>
          <p className="text-text-muted mt-2">Manage your purchases from the current and past campaigns.</p>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border-main rounded-xl space-y-6">
            <p className="text-lg text-text-faint font-bold uppercase tracking-widest">No orders found.</p>
            <Link href="/shop">
              <Button>START SHOPPING</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="border-2 border-border-main rounded-xl overflow-hidden bg-bg">
                <div className="bg-bg-subtle p-4 border-b-2 border-border-main flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-xs uppercase font-bold text-text-faint">Order Number</p>
                    <p className="font-bold">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-text-faint">Date</p>
                    <p className="font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-text-faint">Status</p>
                    <p className="font-bold">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-text-faint">Payment</p>
                    <p className="font-bold">{order.payment_status}</p>
                  </div>
                  <div className="text-right">
                    <Button variant="outline" size="sm">View Receipt</Button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center border-b border-border-main pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold">{item.product_name_snapshot}</p>
                        <p className="text-sm text-text-muted">QTY: {item.quantity}</p>
                      </div>
                      <p className="font-bold">{item.coin_total} COINS</p>
                    </div>
                  ))}
                  
                  <div className="pt-4 flex justify-end gap-6 text-sm">
                    {order.cash_total_kobo > 0 && (
                      <div className="text-right">
                        <span className="text-text-muted">Cash Total:</span>
                        <span className="ml-2 font-bold tabular-nums">₦{(order.cash_total_kobo / 100).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-text-muted">Coin Total:</span>
                      <span className="ml-2 font-bold tabular-nums">{order.coin_total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
