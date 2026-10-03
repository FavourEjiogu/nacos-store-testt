// feat: admin product management list view
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Manage Products | NACOS 100 Admin',
};

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, pricing_mode')
    .order('created_at', { ascending: false });

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight">Manage Products</h1>
        <Link href="/admin/products/new" className="bg-brand-green text-white px-4 py-2 rounded font-bold uppercase text-sm">
          + Add New Product
        </Link>
      </div>

      <div className="bg-bg border-2 border-border-main rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b-2 border-border-main">
            <tr>
              <th className="p-4 font-bold uppercase text-sm">Product Name</th>
              <th className="p-4 font-bold uppercase text-sm">Slug</th>
              <th className="p-4 font-bold uppercase text-sm">Pricing Mode</th>
              <th className="p-4 font-bold uppercase text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold">{product.name}</td>
                <td className="p-4 text-sm text-text-muted">{product.slug}</td>
                <td className="p-4 text-sm font-bold uppercase">{product.pricing_mode}</td>
                <td className="p-4 text-right">
                  {/* Edit functionality not fully fleshed in MVP, but button is here */}
                  <button className="text-brand-green font-bold text-sm uppercase hover:underline">Edit</button>
                </td>
              </tr>
            ))}
            {!products || products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-muted font-bold uppercase">
                  No products found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
