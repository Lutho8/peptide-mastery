import { useCallback, useEffect, useState } from 'react';
import { BarChart3, RefreshCw, Repeat2, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FunnelSnapshot {
  days: number;
  dashboard_users: number;
  returning_dashboard_users: number;
  experience_selected_users: number;
  pathway_selected_users: number;
  guided_support_users: number;
  store_click_users: number;
  reorder_click_users: number;
  ordering_customers: number;
  orders: number;
  repeat_customers: number;
  journey_mix: { new_to_peptides: number; experienced: number; guided: number; research: number };
}

function percentage(value: number, base: number) {
  return base > 0 ? `${Math.round((value / base) * 100)}%` : '—';
}

export default function CustomerValueFunnel() {
  const [days, setDays] = useState('30');
  const [snapshot, setSnapshot] = useState<FunnelSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_customer_value_funnel', { _days: Number(days) });
    if (error) {
      toast.error('Customer-value analytics could not be loaded');
    } else {
      setSnapshot(data as unknown as FunnelSnapshot);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const steps = snapshot ? [
    ['Dashboard visitors', snapshot.dashboard_users, 'Entry'],
    ['Experience selected', snapshot.experience_selected_users, percentage(snapshot.experience_selected_users, snapshot.dashboard_users)],
    ['Pathway selected', snapshot.pathway_selected_users, percentage(snapshot.pathway_selected_users, snapshot.experience_selected_users)],
    ['Store click', snapshot.store_click_users, percentage(snapshot.store_click_users, snapshot.pathway_selected_users)],
    ['Ordering customers', snapshot.ordering_customers, percentage(snapshot.ordering_customers, snapshot.store_click_users)],
  ] as const : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold">Customer value & retention</h2><p className="mt-1 text-sm text-muted-foreground">First-party app events and synced orders—no affiliate-click assumptions.</p></div>
        <div className="flex gap-2"><Select value={days} onValueChange={setDays}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="30">30 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => { void load(); }} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4"><Users className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{snapshot?.dashboard_users ?? 0}</p><p className="text-xs text-muted-foreground">Dashboard users</p></CardContent></Card>
        <Card><CardContent className="p-4"><Repeat2 className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{percentage(snapshot?.returning_dashboard_users ?? 0, snapshot?.dashboard_users ?? 0)}</p><p className="text-xs text-muted-foreground">Return rate</p></CardContent></Card>
        <Card><CardContent className="p-4"><ShoppingCart className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{snapshot?.orders ?? 0}</p><p className="text-xs text-muted-foreground">Orders in window</p></CardContent></Card>
        <Card><CardContent className="p-4"><BarChart3 className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{snapshot?.repeat_customers ?? 0}</p><p className="text-xs text-muted-foreground">Repeat customers</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Conversion funnel</CardTitle><CardDescription>Each rate uses the immediately preceding step. A store click is intent, not a clinical or purchase recommendation.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {steps.map(([label, value, rate], index) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-border p-3"><span className="text-sm font-medium">{index + 1}. {label}</span><span className="font-bold">{value}</span><span className="w-14 text-right text-xs text-muted-foreground">{rate}</span></div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Journey mix</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {Object.entries(snapshot?.journey_mix ?? {}).map(([label, value]) => <div key={label} className="rounded-xl bg-muted/60 p-3"><p className="text-xs capitalize text-muted-foreground">{label.replaceAll('_', ' ')}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
