'use client';
// feat: admin product creation matching the normalized database schema
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

type OptionGroup = {
  id: string; // temp id for UI
  name: string;
  display_type: 'BUTTON' | 'SWATCH' | 'DROPDOWN';
  values: { id: string; label: string; value: string }[];
};

type Variant = {
  id: string; // temp id
  optionValueIds: string[]; // references option value temp ids
  sku: string;
  coin_price: number;
  cash_price_kobo: number;
  pricing_mode: 'COINS_ONLY' | 'CASH_ONLY' | 'COINS_PLUS_CASH';
  stock_quantity: number;
  stock_policy: 'PREORDER' | 'UNLIMITED' | 'LIMITED_STOCK';
};

export default function NewProductForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    type: 'PHYSICAL',
  });

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<File[]>([]);

  // Helpers to generate temp IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { id: generateId(), name: '', display_type: 'BUTTON', values: [] }]);
  };

  const updateOptionGroup = (index: number, field: string, val: string) => {
    const updated = [...optionGroups];
    updated[index] = { ...updated[index], [field]: val };
    setOptionGroups(updated);
  };

  const addOptionValue = (groupIndex: number) => {
    const updated = [...optionGroups];
    updated[groupIndex].values.push({ id: generateId(), label: '', value: '' });
    setOptionGroups(updated);
  };

  const updateOptionValue = (groupIndex: number, valueIndex: number, field: string, val: string) => {
    const updated = [...optionGroups];
    updated[groupIndex].values[valueIndex] = { ...updated[groupIndex].values[valueIndex], [field]: val };
    setOptionGroups(updated);
  };

  const generateVariants = () => {
    if (optionGroups.length === 0) return;
    
    // Cartesian product of option values
    const generateCombinations = (groups: OptionGroup[], currentIndex = 0): {id: string, label: string}[] => {
      if (currentIndex === groups.length) return [];
      
      const currentValues = groups[currentIndex].values.filter(v => v.label.trim() !== '');
      if (currentValues.length === 0) return generateCombinations(groups, currentIndex + 1);

      const nextCombinations = generateCombinations(groups, currentIndex + 1);
      
      if (nextCombinations.length === 0) {
        return currentValues.map(v => ({ id: v.id, label: v.label }));
      }

      const combos: {id: string, label: string}[] = [];
      for (const val of currentValues) {
        for (const next of nextCombinations) {
          // Flattening the combination
          combos.push({
            id: val.id + ',' + next.id,
            label: val.label + ' / ' + next.label
          });
        }
      }
      return combos;
    };

    const combinations = generateCombinations(optionGroups);
    
    const newVariants: Variant[] = combinations.map(combo => ({
      id: generateId(),
      optionValueIds: combo.id.split(','),
      sku: formData.slug + '-' + combo.label.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      coin_price: 100,
      cash_price_kobo: 0,
      pricing_mode: 'COINS_ONLY',
      stock_quantity: 100,
      stock_policy: 'LIMITED_STOCK'
    }));

    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: string, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
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
          short_description: formData.short_description,
          type: formData.type,
          status: 'PUBLISHED'
        })
        .select('id')
        .single();

      if (productError) throw productError;

      const productId = productData.id;

      // 1.5 Upload Images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split('.').pop();
        const fileName = `${productId}-${Date.now()}-${i}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
          
        const { error: mediaError } = await supabase
          .from('product_media')
          .insert({
            product_id: productId,
            storage_path: fileName,
            public_url: publicUrlData.publicUrl,
            is_primary: i === 0,
            sort_order: i
          });
          
        if (mediaError) throw mediaError;
      }

      // 2. Insert Option Groups and Values
      // We need to map our temp IDs to real DB UUIDs so variants can link correctly.
      const valueIdMap: Record<string, string> = {}; // tempId -> real UUID

      for (let i = 0; i < optionGroups.length; i++) {
        const group = optionGroups[i];
        if (group.values.length === 0) continue;

        const { data: groupData, error: groupError } = await supabase
          .from('product_option_groups')
          .insert({
            product_id: productId,
            name: group.name,
            display_type: group.display_type,
            sort_order: i
          })
          .select('id')
          .single();
        
        if (groupError) throw groupError;

        const valuesToInsert = group.values.map((v, vIdx) => ({
          group_id: groupData.id,
          label: v.label,
          value: v.value || v.label.toLowerCase(),
          sort_order: vIdx
        }));

        const { data: insertedValues, error: valuesError } = await supabase
          .from('product_option_values')
          .insert(valuesToInsert)
          .select('id, label');

        if (valuesError) throw valuesError;

        // Map real IDs back to temp IDs based on label (assuming labels are unique within a group)
        for (const inserted of insertedValues) {
          const tempVal = group.values.find(v => v.label === inserted.label);
          if (tempVal) {
            valueIdMap[tempVal.id] = inserted.id;
          }
        }
      }

      // 3. Insert Variants
      for (const v of variants) {
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: v.sku,
            coin_price: v.coin_price,
            cash_price_kobo: v.cash_price_kobo,
            pricing_mode: v.pricing_mode,
            stock_quantity: v.stock_quantity,
            stock_policy: v.stock_policy
          })
          .select('id')
          .single();

        if (variantError) throw variantError;

        // 4. Insert Variant Option Values relations
        const relationsToInsert = v.optionValueIds.map(tempId => ({
          variant_id: variantData.id,
          option_value_id: valueIdMap[tempId]
        })).filter(r => r.option_value_id); // Ensure we don't insert undefined

        if (relationsToInsert.length > 0) {
          const { error: relError } = await supabase
            .from('variant_option_values')
            .insert(relationsToInsert);
          
          if (relError) throw relError;
        }
      }

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
      
      {/* Product Identity */}
      <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
        <h2 className="font-bold text-xl uppercase border-b-2 border-border-main pb-2 mb-4">Product Identity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Product Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full border-2 border-border-main p-3 rounded-md focus:outline-none focus:border-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Slug</label>
            <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full border-2 border-border-main p-3 rounded-md bg-gray-100 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Short Description</label>
          <input type="text" value={formData.short_description} onChange={(e) => setFormData({...formData, short_description: e.target.value})} className="w-full border-2 border-border-main p-3 rounded-md focus:outline-none focus:border-brand-green" />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Full Description</label>
          <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-border-main p-3 rounded-md focus:outline-none focus:border-brand-green"></textarea>
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
        <h2 className="font-bold text-xl uppercase border-b-2 border-border-main pb-2 mb-4">Product Media</h2>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={(e) => setImages(Array.from(e.target.files || []))} 
          className="w-full border-2 border-dashed border-border-main p-8 text-center rounded-md cursor-pointer hover:bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nacos-green file:text-white hover:file:bg-nacos-green-bright" 
        />
        {images.length > 0 && (
          <div className="flex gap-4 overflow-x-auto py-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 flex-shrink-0 border border-border-main rounded-md overflow-hidden">
                <img src={URL.createObjectURL(img)} alt={`upload-${idx}`} className="object-cover w-full h-full" />
                {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black text-white text-[10px] text-center font-bold">PRIMARY</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Option Groups */}
      <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b-2 border-border-main pb-2 mb-4">
          <h2 className="font-bold text-xl uppercase">Option Groups</h2>
          <button type="button" onClick={addOptionGroup} className="text-brand-green font-bold text-sm uppercase hover:underline">+ Add Option Group (e.g. Size)</button>
        </div>
        
        {optionGroups.map((group, gIdx) => (
          <div key={group.id} className="p-4 border border-border-main rounded-md space-y-4 bg-gray-50">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase mb-1">Group Name</label>
                <input type="text" placeholder="e.g. Colour" required value={group.name} onChange={(e) => updateOptionGroup(gIdx, 'name', e.target.value)} className="w-full border-2 border-border-main p-2 rounded bg-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase mb-1">Display Type</label>
                <select value={group.display_type} onChange={(e) => updateOptionGroup(gIdx, 'display_type', e.target.value)} className="w-full border-2 border-border-main p-2 rounded bg-white">
                  <option value="BUTTON">Button</option>
                  <option value="SWATCH">Swatch</option>
                  <option value="DROPDOWN">Dropdown</option>
                </select>
              </div>
            </div>

            <div className="pl-4 border-l-2 border-brand-green space-y-2">
              <h3 className="text-xs font-bold uppercase text-text-muted">Option Values</h3>
              {group.values.map((val, vIdx) => (
                <div key={val.id} className="flex gap-2">
                  <input type="text" placeholder="Label (e.g. Black)" required value={val.label} onChange={(e) => updateOptionValue(gIdx, vIdx, 'label', e.target.value)} className="flex-1 border border-border-main p-2 rounded text-sm" />
                  <input type="text" placeholder="Value (e.g. #000000)" value={val.value} onChange={(e) => updateOptionValue(gIdx, vIdx, 'value', e.target.value)} className="flex-1 border border-border-main p-2 rounded text-sm" />
                </div>
              ))}
              <button type="button" onClick={() => addOptionValue(gIdx)} className="text-xs font-bold uppercase text-brand-green hover:underline mt-2">+ Add Value</button>
            </div>
          </div>
        ))}

        {optionGroups.length > 0 && (
          <div className="pt-4">
            <Button type="button" onClick={generateVariants} variant="secondary" className="w-full">Generate Variants from Options</Button>
          </div>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="bg-bg border-2 border-border-main p-6 rounded-xl space-y-4">
          <h2 className="font-bold text-xl uppercase border-b-2 border-border-main pb-2 mb-4">Generated Variants</h2>
          
          <div className="space-y-4">
            {variants.map((v, idx) => {
              // Reconstruct label for display
              const label = v.optionValueIds.map(tid => {
                for (const g of optionGroups) {
                  const val = g.values.find(val => val.id === tid);
                  if (val) return val.label;
                }
                return '';
              }).join(' / ');

              return (
                <div key={v.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-4 border border-border-main rounded-md bg-white">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase mb-1 text-text-muted">Variant</label>
                    <div className="font-bold text-sm">{label}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Pricing Mode</label>
                    <select value={v.pricing_mode} onChange={(e) => updateVariant(idx, 'pricing_mode', e.target.value)} className="w-full border border-border-main p-1 rounded text-xs">
                      <option value="COINS_ONLY">Coins Only</option>
                      <option value="CASH_ONLY">Cash Only</option>
                      <option value="COINS_PLUS_CASH">Coins + Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Coins</label>
                    <input type="number" min="0" required value={v.coin_price} onChange={(e) => updateVariant(idx, 'coin_price', parseInt(e.target.value))} className="w-full border border-border-main p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Cash (Kobo)</label>
                    <input type="number" min="0" required value={v.cash_price_kobo} onChange={(e) => updateVariant(idx, 'cash_price_kobo', parseInt(e.target.value))} className="w-full border border-border-main p-1 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Stock</label>
                    <input type="number" min="0" required value={v.stock_quantity} onChange={(e) => updateVariant(idx, 'stock_quantity', parseInt(e.target.value))} className="w-full border border-border-main p-1 rounded text-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full py-6 text-lg"
        size="lg"
      >
        {loading ? 'Creating...' : 'Create Product'}
      </Button>
    </form>
  );
}
