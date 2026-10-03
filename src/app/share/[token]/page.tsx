// feat: setup public view for order share token
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export const metadata = {
  title: 'NACOS 100 Picks',
};

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = await createClient();
  const token = params.token;

  // Ideally, look up share token in DB.
  // For demo, we'll pretend token == order_number
  
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, coin_total, cash_total_kobo, created_at,
      order_items ( id, product_name_snapshot, variant_label_snapshot, quantity, coin_total )
    `)
    .eq('order_number', token)
    .maybeSingle();

  if (!order) {
    // If not order number, perhaps we just say it's an invalid token for now.
    notFound();
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">
            MY NACOS 100 PICKS
          </h1>
          <p className="text-text-muted mt-2 uppercase font-bold text-sm tracking-widest">
            {order.order_items?.length} items selected
          </p>
        </div>

        <div className="space-y-4 text-left">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="border-2 border-border-main p-4 rounded-xl bg-bg flex flex-col gap-2">
              <h3 className="font-bold text-lg">{item.product_name_snapshot}</h3>
              <p className="text-sm text-text-muted uppercase">Option: {item.variant_label_snapshot || 'Standard'}</p>
              <p className="text-sm font-bold">QTY: {item.quantity}</p>
            </div>
          ))}
        </div>

        <div className="py-8 border-t-2 border-border-main mt-8">
          <p className="text-xl font-bold uppercase">100 COINS. 14 DAYS. YOUR CHOICE.</p>
          <a href="/" className="inline-block mt-4 bg-black text-white px-6 py-3 rounded-md font-bold uppercase text-sm">
            GET YOURS NOW
          </a>
        </div>
      </div>
    </main>
  );
}
