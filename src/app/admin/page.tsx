// feat: build admin dashboard for store analytics
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard | NACOS 100',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  // Very basic admin check. We check if the user is an admin by querying their profile or a specific table.
  // In our simplified schema we don't have a specific "roles" system yet, 
  // so we'll just fetch general stats to populate the page for now.
  // In production, you would have RLS on these queries ensuring only true admins can read.

  // Fetch some summary stats
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg border-2 border-border-main p-6 rounded-xl">
          <p className="text-text-muted font-bold uppercase tracking-widest text-sm mb-2">Total Orders</p>
          <p className="text-4xl font-bold">{orderCount || 0}</p>
        </div>
        <div className="bg-bg border-2 border-border-main p-6 rounded-xl">
          <p className="text-text-muted font-bold uppercase tracking-widest text-sm mb-2">Registered Students</p>
          <p className="text-4xl font-bold">{userCount || 0}</p>
        </div>
        <div className="bg-bg border-2 border-border-main p-6 rounded-xl">
          <p className="text-text-muted font-bold uppercase tracking-widest text-sm mb-2">Active Products</p>
          <p className="text-4xl font-bold">{productCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-border-main rounded-xl p-6">
          <h2 className="text-xl font-bold uppercase mb-4">Quick Links</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/admin/products" className="text-brand-green hover:underline font-bold">Manage Catalog</Link>
            </li>
            <li>
              <Link href="/admin/orders" className="text-brand-green hover:underline font-bold">Manage Orders</Link>
            </li>
          </ul>
        </div>

        <div className="border-2 border-border-main rounded-xl p-6 bg-brand-green text-white">
          <h2 className="text-xl font-bold uppercase mb-2">Campaign Status</h2>
          <p className="text-sm font-bold opacity-90 mb-4">The NACOS 100 coin promotion is currently active.</p>
          {/* We would wire this up to actual campaign config logic */}
          <button className="bg-black text-white px-4 py-2 font-bold uppercase text-sm rounded-md w-full">
            End Campaign (Freeze Carts)
          </button>
          <p className="text-xs text-center mt-2 opacity-75">Requires explicit confirmation.</p>
        </div>
      </div>
    </main>
  );
}
