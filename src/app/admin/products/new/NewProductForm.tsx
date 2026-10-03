'use client';
// feat: client form logic for admin product creation
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewProductForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    pricing_mode: 'COINS_ONLY'
  });

  const [variants, setVariants] = useState([
    { label: 'Standard', coin_price: 100, cash_price_kobo: 0, stock: 100 }
  ]);

  const addVariant = () => {
    setVariants([...variants, { label: '', coin_price: 100, cash_price_kobo: 0, stock: 100 }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Insert product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          image_urls: formData.image_url ? [formData.image_url] : [],
          pricing_mode: formData.pricing_mode
        })
        .select('id')
        .single();

      if (productError) throw productError;

      // 2. Insert variants
      const variantsToInsert = variants.map(v => ({
        product_id: productData.id,
        label: v.label,
        coin_price: v.coin_price,
        cash_price_kobo: v.cash_price_kobo,
        stock: v.stock
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantsError) throw variantsError;

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the product');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="p-4 bg-red-100 text-red-800 rounded font-bold">{error}</div>}
      
      <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
        <h2 className="font-bold text-xl uppercase border-b-2 border-border-main pb-2 mb-4">General Info</h2>
        
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Product Name</label>
          <input 
            type="text" 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
            className="w-full border-2 border-border-main p-3 rounded-md bg-white focus:outline-none focus:border-brand-green"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Slug</label>
          <input 
            type="text" 
            required 
            value={formData.slug} 
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            className="w-full border-2 border-border-main p-3 rounded-md bg-gray-100 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Description</label>
          <textarea 
            required 
            rows={4}
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border-2 border-border-main p-3 rounded-md bg-white focus:outline-none focus:border-brand-green"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Image URL</label>
          <input 
            type="text" 
            value={formData.image_url} 
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://..."
            className="w-full border-2 border-border-main p-3 rounded-md bg-white focus:outline-none focus:border-brand-green"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Pricing Mode</label>
          <select 
            value={formData.pricing_mode}
            onChange={(e) => setFormData({...formData, pricing_mode: e.target.value})}
            className="w-full border-2 border-border-main p-3 rounded-md bg-white focus:outline-none focus:border-brand-green"
          >
            <option value="COINS_ONLY">Coins Only</option>
            <option value="CASH_ONLY">Cash Only</option>
            <option value="COINS_PLUS_CASH">Coins + Cash</option>
          </select>
        </div>
      </div>

      <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b-2 border-border-main pb-2 mb-4">
          <h2 className="font-bold text-xl uppercase">Variants</h2>
          <button type="button" onClick={addVariant} className="text-brand-green font-bold text-sm uppercase hover:underline">+ Add Variant</button>
        </div>
        
        {variants.map((variant, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md bg-white">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Label (e.g. Black / L)</label>
              <input type="text" required value={variant.label} onChange={(e) => updateVariant(idx, 'label', e.target.value)} className="w-full border-2 border-border-main p-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Coins</label>
              <input type="number" min="0" required value={variant.coin_price} onChange={(e) => updateVariant(idx, 'coin_price', parseInt(e.target.value))} className="w-full border-2 border-border-main p-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Cash (Kobo)</label>
              <input type="number" min="0" required value={variant.cash_price_kobo} onChange={(e) => updateVariant(idx, 'cash_price_kobo', parseInt(e.target.value))} className="w-full border-2 border-border-main p-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Stock</label>
              <input type="number" min="0" required value={variant.stock} onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value))} className="w-full border-2 border-border-main p-2 rounded" />
            </div>
          </div>
        ))}
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-black text-white font-bold uppercase py-4 rounded-md disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
