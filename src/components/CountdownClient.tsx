'use client';
import { useState, useEffect } from 'react';

export default function CountdownClient({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const distance = end - now;
      
      if (distance < 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };
    
    tick(); // initial call
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!timeLeft) return <div className="text-4xl font-bold blur-sm animate-pulse">00D 00H 00M 00S</div>;

  return (
    <div className="text-4xl sm:text-5xl font-display font-bold tabular-nums text-black/90">
      {timeLeft.d}D {String(timeLeft.h).padStart(2, '0')}H {String(timeLeft.m).padStart(2, '0')}M {String(timeLeft.s).padStart(2, '0')}S
    </div>
  );
}
