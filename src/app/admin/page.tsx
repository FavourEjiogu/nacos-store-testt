// feat: secure admin dashboard with real RBAC check
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard | NACOS 100',
};

async function getAdminRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['SUPER_ADMIN', 'CATALOG_ADMIN', 'MEMBER_VERIFIER', 'FULFILLMENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'])
    .limit(1)
    .maybeSingle();
  return data?.role ?? null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  // Real RBAC check — authentication alone is not authorization
  const adminRole = await getAdminRole(supabase, userData.user.id);
  if (!adminRole) {
    redirect('/');
  }

  // Fetch summary stats — only runs if authorized
  const [
    { count: orderCount },
    { count: userCount },
    { count: productCount },
    { count: pendingVerifications },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'PENDING'),
  ]);

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, status, ends_at, initial_coin_grant')
    .in('status', ['LIVE', 'SCHEDULED', 'ENDING'])
    .order('ends_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight">Admin Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Role: <span className="font-bold text-black">{adminRole}</span></p>
        </div>
        <div className="text-right text-sm text-text-faint">
          <p>Logged in as</p>
          <p className="font-bold text-black">{userData.user.email}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orderCount ?? 0 },
          { label: 'Registered Students', value: userCount ?? 0 },
          { label: 'Published Products', value: productCount ?? 0 },
          { label: 'Pending Verification', value: pendingVerifications ?? 0, alert: (pendingVerifications ?? 0) > 0 },
        ].map((stat) => (
          <div key={stat.label} className={`border-2 p-5 ${stat.alert ? 'border-amber-400 bg-amber-50' : 'border-border-main bg-bg'}`}>
            <p className="text-text-faint font-bold uppercase tracking-widest text-xs mb-2">{stat.label}</p>
            <p className={`text-4xl font-bold tabular-nums ${stat.alert ? 'text-amber-600' : ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign Status */}
      {campaign && (
        <div className="mb-8 border-2 border-black p-6 bg-black text-white">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Active Campaign</p>
              <h2 className="text-2xl font-display font-bold">{campaign.name}</h2>
              <p className="text-sm opacity-70 mt-1">
                Status: <span className="font-bold uppercase">{campaign.status}</span> |{' '}
                Closes: <span className="font-bold">{new Date(campaign.ends_at).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/campaigns" className="inline-flex items-center px-4 py-2 bg-white text-black font-bold text-sm uppercase hover:bg-gray-100 transition-colors">
                Manage Campaign
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/products', label: 'Manage Catalog', desc: 'Add and edit products' },
          { href: '/admin/orders', label: 'Manage Orders', desc: 'View and fulfill orders' },
          { href: '/admin/members', label: 'Verify Members', desc: 'Approve NACOS registrations', restricted: ['SUPER_ADMIN', 'MEMBER_VERIFIER', 'SUPPORT_ADMIN'] },
        ].filter(item => !item.restricted || item.restricted.includes(adminRole)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-2 border-border-main p-5 hover:border-black hover:bg-bg-subtle transition-colors block group"
          >
            <p className="font-bold uppercase tracking-wide mb-1 group-hover:underline">{item.label}</p>
            <p className="text-sm text-text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
