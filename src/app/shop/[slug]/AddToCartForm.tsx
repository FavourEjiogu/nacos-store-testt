'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export function AddToCartForm({ product }: { product: any }) {
  const supabase = createClient();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-select first options if available
  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0 && product.product_option_groups) {
      const initial: Record<string, string> = {};
      product.product_option_groups.forEach((group: any) => {
        if (group.product_option_values?.length > 0) {
          initial[group.id] = group.product_option_values[0].id;
        }
      });
      setSelectedOptions(initial);
    }
  }, [product, selectedOptions]);

  // Find the variant that matches selected options
  const selectedVariant = useMemo(() => {
    if (!product.product_variants) return null;
    
    // If no option groups, there should be only 1 variant (the default)
    if (!product.product_option_groups || product.product_option_groups.length === 0) {
      return product.product_variants[0];
    }

    return product.product_variants.find((variant: any) => {
      // Get all option value IDs for this variant
      const variantOptionIds = variant.variant_option_values.map((vov: any) => vov.option_value_id);
      
      // Check if it has exactly the same option values as selected
      const selectedOptionIds = Object.values(selectedOptions);
      
      if (variantOptionIds.length !== selectedOptionIds.length) return false;
      
      return selectedOptionIds.every((id) => variantOptionIds.includes(id as string));
    });
  }, [product, selectedOptions]);


  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("You must be logged in to add to cart.");
      }
      
      if (!selectedVariant && product.product_variants.length > 0) {
        throw new Error("Please select all options before adding to cart.");
      }

      // 1. Get active campaign
      const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .select('id')
        .in('status', ['SCHEDULED', 'LIVE'])
        .limit(1)
        .single();
        
      if (campError || !campaign) {
         throw new Error("No active campaign found. Cart is closed.");
      }

      // 2. Get or create cart for user in this campaign
      let cartId;
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('id, status')
        .eq('user_id', userData.user.id)
        .eq('campaign_id', campaign.id)
        .maybeSingle();

      if (existingCart) {
        if (existingCart.status !== 'OPEN') {
           throw new Error("Your cart is frozen and cannot be modified.");
        }
        cartId = existingCart.id;
      } else {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: userData.user.id, campaign_id: campaign.id })
          .select('id')
          .single();
          
        if (newCartError) throw newCartError;
        cartId = newCart.id;
      }

      // 3. Upsert cart item
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', product.id)
        .eq('variant_id', selectedVariant?.id || null)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            quantity: 1
          });
        if (insertError) throw insertError;
      }

      setSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add to cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Options */}
      {product.product_option_groups?.map((group: any) => (
        <div key={group.id} className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-3">
            {group.product_option_values?.map((val: any) => {
              const isSelected = selectedOptions[group.id] === val.id;
              return (
                <button
                  key={val.id}
                  onClick={() => setSelectedOptions(prev => ({ ...prev, [group.id]: val.id }))}
                  className={`h-12 px-6 border-2 font-bold transition-colors ${
                    isSelected 
                      ? 'border-black bg-black text-white' 
                      : 'border-border-main hover:border-black bg-bg text-black'
                  }`}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Price Display */}
      <div className="pt-4 border-t border-border-main">
        {selectedVariant ? (
          <div className="flex items-end gap-3">
            <span className="text-4xl font-display font-bold tabular-nums tracking-tighter">
              {selectedVariant.coin_price}
            </span>
            <span className="text-lg font-bold text-nacos-green mb-1 uppercase tracking-widest">Coins</span>
          </div>
        ) : (
          <p className="text-text-muted">Select options to see price</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 text-sm font-bold border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-nacos-green p-4 text-sm font-bold border border-nacos-green/30 flex items-center justify-between">
          <span>Added to cart successfully!</span>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/cart'}>View Cart</Button>
        </div>
      )}

      {/* Action */}
      <Button 
        size="lg" 
        className="w-full sm:w-auto min-w-[200px]" 
        onClick={handleAddToCart}
        disabled={loading || (!selectedVariant && product.product_variants?.length > 0)}
      >
        {loading ? "ADDING..." : "ADD TO CART"}
      </Button>
    </div>
  );
}
