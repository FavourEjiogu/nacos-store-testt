import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border-main py-12 bg-bg-subtle mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="space-y-4">
          <p className="font-display font-bold text-lg">NACOS / 100</p>
          <p className="text-text-muted">100 coins. 14 days. Your choice. A new way to handle campus merch.</p>
        </div>
        
        <div className="space-y-4">
          <p className="font-bold uppercase tracking-widest text-xs text-text-faint">Shop</p>
          <ul className="space-y-2">
            <li><Link href="/shop" className="hover:underline">All Products</Link></li>
            <li><Link href="/marketplace" className="hover:underline">NACOSite Market</Link></li>
            <li><Link href="/faq" className="hover:underline">How it Works</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="font-bold uppercase tracking-widest text-xs text-text-faint">Legal</p>
          <ul className="space-y-2">
            <li><Link href="/legal/terms" className="hover:underline">Terms & Conditions</Link></li>
            <li><Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/legal/cookies" className="hover:underline">Cookie Notice</Link></li>
            <li><Link href="/legal/refunds" className="hover:underline">Returns & Refunds</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="font-bold uppercase tracking-widest text-xs text-text-faint">Support</p>
          <ul className="space-y-2">
            <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
            <li><a href="mailto:support@nacos.org" className="hover:underline">support@nacos.org</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-border-main text-center text-text-faint text-xs">
        <p>&copy; {new Date().getFullYear()} NACOS. All rights reserved.</p>
      </div>
    </footer>
  );
}
