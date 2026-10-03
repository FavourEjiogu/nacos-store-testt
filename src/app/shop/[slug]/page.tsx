import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { AddToCartForm } from './AddToCartForm';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      product_media ( public_url, is_primary ),
      product_option_groups (
        id, name, display_type,
        product_option_values ( id, label, value )
      ),
      product_variants (
        id, sku, coin_price, cash_price_kobo, stock_quantity, stock_policy,
        variant_option_values ( option_value_id )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !product) {
    notFound();
  }

  const images = product.product_media || [];
  const primaryImage = images.find((m: any) => m.is_primary)?.public_url || images[0]?.public_url || 'https://placehold.co/600x600/e4e4e4/0a0a0a?text=NACOS';

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Media Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-2xl overflow-hidden border-2 border-border-strong bg-bg-subtle">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Thumbnails could go here if multiple images exist */}
        </div>

        {/* Product Info & Actions */}
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight leading-none">
              {product.name}
            </h1>
            <p className="text-lg text-text-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="h-px bg-border-main w-full" />

          {/* Client-side form for selecting variants and adding to cart */}
          <AddToCartForm product={product} />

        </div>
      </div>
    </main>
  );
}
