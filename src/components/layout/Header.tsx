'use client';

import Link from 'next/link';
import { ShoppingBag, MagnifyingGlass, User } from '@phosphor-icons/react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-main bg-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tighter">
          NACOS <span className="text-text-muted">/ 100</span>
        </Link>

        {/* Desktop Timer (optional) or just Nav */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-bold">
          <Link href="/shop" className="hover:text-nacos-green transition-colors">SHOP ALL</Link>
          <Link href="/marketplace" className="hover:text-nacos-green transition-colors">NACOSITE MARKET</Link>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-bg-subtle rounded-full transition-colors" aria-label="Search">
            <MagnifyingGlass size={20} weight="bold" />
          </button>
          <Link href="/account" className="p-2 hover:bg-bg-subtle rounded-full transition-colors" aria-label="Account">
            <User size={20} weight="bold" />
          </Link>
          <Link href="/cart" className="p-2 hover:bg-bg-subtle rounded-full transition-colors relative" aria-label="Cart">
            <ShoppingBag size={20} weight="bold" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-nacos-green-bright rounded-full border border-bg"></span>
          </Link>
        </div>
      </div>
    </header>
  );
}
