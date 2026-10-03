// feat: implement order printing view without prices
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export const metadata = {
  title: 'Order Print | NACOS 100',
};

export default async function OrderPrintPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, created_at,
      order_items ( id, product_name_snapshot, variant_label_snapshot, quantity )
    `)
    .eq('id', params.id)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen text-black p-8 max-w-3xl mx-auto font-body">
      <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-2xl uppercase">NACOS 100</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-1">Order Packing List</p>
        </div>
        <div className="text-right text-sm">
          <p><span className="font-bold uppercase">Order No:</span> {order.order_number}</p>
          <p><span className="font-bold uppercase">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between items-start border-b border-gray-200 py-4">
            <div>
              <p className="font-bold text-lg">{item.product_name_snapshot}</p>
              <p className="text-sm text-gray-600 mt-1 uppercase">Option: {item.variant_label_snapshot || 'Standard'}</p>
            </div>
            <p className="font-bold text-xl tabular-nums">× {item.quantity}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center text-sm font-bold uppercase text-gray-400">
        <p>DOES NOT INCLUDE COST BREAKDOWN PER REQUIREMENTS</p>
      </div>

      {/* Auto print dialog on load */}
      <script dangerouslySetInnerHTML={{ __html: 'window.print();' }} />
    </div>
  );
}
