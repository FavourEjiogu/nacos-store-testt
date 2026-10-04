'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const nacosId = formData.get('nacosId') as string;
    const matricNumber = formData.get('matricNumber') as string;
    const department = formData.get('department') as string;
    const level = formData.get('level') as string;
    const phone = formData.get('phone') as string;
    const hostel = formData.get('hostel') as string;

    // Basic client-side validation
    if (!email || !password || !fullName || !nacosId || !matricNumber || !department || !level || !phone) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account.");
      }

      // 2. Update profile data (created by auth trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          nacos_id: nacosId,
          nacos_id_normalized: nacosId.trim().toUpperCase(),
          matric_number: matricNumber,
          department,
          level,
          phone,
          hostel_name_snapshot: hostel,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        // Log it or handle it, but for now we throw
        throw profileError;
      }

      // 3. Redirect to onboarding/verification page
      router.push('/onboarding');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold uppercase">Join NACOS 100</h1>
          <p className="text-text-muted">Register to get your 100 NACOS Coins.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-sm font-bold uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-4">
            <Input name="fullName" placeholder="Full Name" required />
            <Input name="email" type="email" placeholder="Email Address" required />
            <Input name="phone" type="tel" placeholder="Phone Number" required />
            <Input name="password" type="password" placeholder="Password" required minLength={8} />
          </div>

          <div className="pt-4 space-y-4 border-t border-border-main">
            <p className="text-xs font-bold uppercase text-text-faint">Academic Details</p>
            <Input name="nacosId" placeholder="NACOS ID" required />
            <Input name="matricNumber" placeholder="Matriculation Number" required />
            <Input name="department" placeholder="Department" required />
            <div className="grid grid-cols-2 gap-4">
              <Input name="level" placeholder="Level (e.g. 100, 200)" required />
              <Input name="hostel" placeholder="Hostel (Optional)" />
            </div>
          </div>

          <div className="pt-4 text-xs text-text-muted space-y-2">
            <p>
              By registering, you agree to our <Link href="/legal/terms" className="underline">Terms & Conditions</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Register & Get 100 Coins"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-text-muted hover:text-black transition-colors">
            Already have an account? <span className="font-bold underline">Login</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
