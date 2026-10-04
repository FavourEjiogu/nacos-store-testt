'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Info } from '@phosphor-icons/react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nacosId, setNacosId] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('nacos_id, verification_status')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.nacos_id) setNacosId(profile.nacos_id);
      if (profile?.verification_status === 'VERIFIED') setVerified(true);
    };
    loadProfile();
  }, []);

  const verifyAndContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalized = nacosId.trim().toUpperCase();
      if (!normalized) throw new Error('Enter your NACOS ID to continue.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again.');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nacos_id: nacosId.trim(), nacos_id_normalized: normalized })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: verifyError } = await supabase.rpc('verify_membership');
      if (verifyError) throw new Error('We could not verify that NACOS ID. Check the ID and try again.');

      setVerified(true);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Membership verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignAndGrantCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify membership
      const { error: verifyError } = await supabase.rpc('verify_membership');
      if (verifyError) {
        throw new Error(verifyError.message || "Failed to verify NACOS membership. Please check your ID.");
      }

      // 2. Find the active campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('status', ['SCHEDULED', 'LIVE'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (campaignError || !campaign) {
        router.push('/shop');
        return;
      }

      // 3. Call RPC to grant coins
      const { error: grantError } = await supabase.rpc('grant_initial_coins', {
        target_campaign_id: campaign.id
      });

      if (grantError) {
        throw grantError;
      }

      router.push('/shop');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to activate your wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-subtle">
      <div className="w-full max-w-lg bg-bg border-2 border-border-strong p-8 sm:p-12 space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-3xl font-display font-bold uppercase">Verify your NACOS ID</h1>
            <div className="h-20 w-20 mx-auto rounded-full bg-nacos-green-bright/20 flex items-center justify-center text-nacos-green-bright">
              <CheckCircle size={40} weight="fill" />
            </div>
            <p className="text-text-muted text-lg">Your NACOS ID is the key to your campaign access.</p>
            <p className="text-sm text-text-muted">Enter the ID issued to you by NACOS. We check it against the active membership record before anything is added to your wallet.</p>
            <input
              value={nacosId}
              onChange={(e) => setNacosId(e.target.value)}
              placeholder="e.g. NACOS/BHU/2026/001"
              autoComplete="off"
              className="h-12 w-full border-2 border-border-strong bg-white px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-nacos-green"
              aria-label="NACOS ID"
            />
            {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 text-left">{error}</div>}
            <Button className="w-full mt-4" size="lg" onClick={verifyAndContinue} disabled={loading || !nacosId.trim()}>
              {loading ? 'Verifying NACOS ID...' : verified ? 'Verified — Continue →' : 'Verify NACOS ID →'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-3xl font-display font-bold uppercase">How it works</h1>
            <div className="space-y-4 text-left border-l-2 border-nacos-green pl-6 py-2">
              <div>
                <p className="font-bold text-lg">1. 100 COINS</p>
                <p className="text-sm text-text-muted">You receive 100 promotional credits.</p>
              </div>
              <div>
                <p className="font-bold text-lg">2. YOUR CHOICE</p>
                <p className="text-sm text-text-muted">Spend them on merch, services, or food.</p>
              </div>
              <div>
                <p className="font-bold text-lg">3. 14 DAYS</p>
                <p className="text-sm text-text-muted">Build your cart before the timer ends.</p>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => setStep(3)} disabled={!verified}>
              Got it
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-3xl font-display font-bold uppercase">The Rules</h1>
            <div className="bg-bg-subtle p-6 text-left space-y-4 text-sm">
              <p className="flex items-start gap-3">
                <Info size={20} className="text-text-faint flex-shrink-0 mt-0.5" />
                <span>Your 100 coins are campaign credits. They aren't cash and cannot be withdrawn.</span>
              </p>
              <p className="flex items-start gap-3">
                <Info size={20} className="text-text-faint flex-shrink-0 mt-0.5" />
                <span>Choose what you want before the countdown ends. After that, carts are locked.</span>
              </p>
              <p className="flex items-start gap-3">
                <Info size={20} className="text-text-faint flex-shrink-0 mt-0.5" />
                <span>Any remaining balance not covered by coins can be paid via Paystack at checkout.</span>
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-bold bg-red-50 p-3">
                {error}
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg" 
              onClick={getCampaignAndGrantCoins}
              disabled={loading}
            >
              {loading ? "Activating Wallet..." : "Activate 100 Coins & Shop →"}
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}
