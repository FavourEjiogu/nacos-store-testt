import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Shop | NACOS 100',
  description: 'Spend your 100 NACOS coins here.',
};

export default async function ShopPage() {
  const supabase = await createClient();

  // Fetch all published products with their primary image and base pricing
  // Using an explicit select to join the related tables
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      short_description,
      product_media ( public_url ),
      product_variants ( coin_price, cash_price_kobo )
    `)
    .eq('status', 'PUBLISHED')
    .eq('visibility', 'PUBLIC')
    .eq('product_media.is_primary', true);

  if (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">The Drop</h1>
        <p className="text-text-muted">Choose your merch. You have 100 Coins to spend.</p>
      </div>

      {!products || products.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border-main rounded-xl">
          <p className="text-lg text-text-faint font-bold uppercase tracking-widest">No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: any) => {
            const primaryImage = product.product_media?.[0]?.public_url || 'https://placehold.co/600x600/e4e4e4/0a0a0a?text=NACOS';
            // Compute starting price
            const variants = product.product_variants || [];
            const startingCoins = Math.min(...variants.map((v: any) => v.coin_price));
            
            return (
              <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                <div className="border-2 border-border-strong rounded-xl overflow-hidden bg-bg hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md">
                  <div className="aspect-square relative bg-bg-subtle border-b-2 border-border-strong">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-text-muted line-clamp-2">{product.short_description}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="inline-flex items-center justify-center bg-nacos-green-bright/20 text-nacos-green-bright font-bold px-3 py-1 rounded-full text-sm">
                        {startingCoins === Infinity ? 0 : startingCoins} COINS
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-text-faint group-hover:text-black transition-colors">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
