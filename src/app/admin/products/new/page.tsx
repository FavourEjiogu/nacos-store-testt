// feat: form to add new products and variants
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewProductForm from './NewProductForm';

export const metadata = {
  title: 'Add Product | NACOS 100 Admin',
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-8">Add New Product</h1>
      <NewProductForm />
    </main>
  );
}
