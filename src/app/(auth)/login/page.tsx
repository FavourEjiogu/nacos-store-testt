'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError("Please fill in both fields.");
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push('/shop');
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold uppercase">Welcome Back</h1>
          <p className="text-text-muted">Login to access your NACOS 100 wallet.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-sm font-bold uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input name="email" type="email" placeholder="Email Address" required />
          <Input name="password" type="password" placeholder="Password" required />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm space-y-2 flex flex-col">
          <Link href="/register" className="text-text-muted hover:text-black transition-colors">
            Don't have an account? <span className="font-bold underline">Register</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
