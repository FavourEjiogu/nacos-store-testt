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
            <h1 className="text-3xl font-display font-bold uppercase">Welcome to NACOS 100</h1>
            <div className="h-24 w-24 mx-auto rounded-full bg-nacos-green-bright/20 flex items-center justify-center text-nacos-green-bright">
              <CheckCircle size={48} weight="fill" />
            </div>
            <p className="text-text-muted text-lg">Your identity is being verified.</p>
            <p className="text-sm">We'll verify your NACOS ID before activating your 100 coins. For now, you can proceed to the campaign.</p>
            <Button className="w-full mt-4" size="lg" onClick={() => setStep(2)}>
              Next &rarr;
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
            <Button className="w-full" size="lg" onClick={() => setStep(3)}>
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
              {loading ? "Activating Wallet..." : "Start Shopping →"}
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}
