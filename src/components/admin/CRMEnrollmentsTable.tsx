import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Download, Mail, RefreshCw, Search, Star, Target, UserCheck, Users } from 'lucide-react';

type LeadStatus = 'new' | 'nurturing' | 'qualified' | 'converted';

interface Lead {
  id: string; email: string; first_name: string | null; last_name: string | null;
  phone: string | null; source: string; plan_interest: 'free' | 'premium' | 'undecided';
  lead_status: LeadStatus; lead_score: number; last_activity_at: string;
  created_at: string; activity_count: number;
}

interface CRMResponse {
  leads: Lead[];
  stats: { total: number; qualified: number; converted: number; premium: number };
}

const EMPTY_STATS = { total: 0, qualified: 0, converted: 0, premium: 0 };
const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-secondary text-secondary-foreground',
  nurturing: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  qualified: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  converted: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
};

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function CRMEnrollmentsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadCRM = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<CRMResponse>('crm-admin', { body: { action: 'overview' } });
      if (error) throw error;
      setLeads(data?.leads ?? []);
      setStats(data?.stats ?? EMPTY_STATS);
    } catch (error) {
      console.error('Failed to load CRM:', error);
      toast.error('Could not load CRM data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCRM(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => `${lead.first_name ?? ''} ${lead.last_name ?? ''} ${lead.email} ${lead.source} ${lead.lead_status}`.toLowerCase().includes(needle));
  }, [leads, query]);

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    const previous = leads;
    setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, lead_status: status } : lead));
    const { error } = await supabase.functions.invoke('crm-admin', { body: { action: 'update_status', leadId, status } });
    if (error) {
      setLeads(previous);
      toast.error('Status update failed');
    } else {
      toast.success('Lead status updated');
      void loadCRM();
    }
  };

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Phone', 'Source', 'Plan', 'Status', 'Score', 'Activities', 'Last activity'];
    const rows = filtered.map((lead) => [
      `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(), lead.email, lead.phone,
      lead.source, lead.plan_interest, lead.lead_status, lead.lead_score,
      lead.activity_count, lead.last_activity_at,
    ].map(csvCell).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `peptide-sa-crm-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'All leads', value: stats.total, icon: Users },
          { label: 'Qualified', value: stats.qualified, icon: Target },
          { label: 'Premium interest', value: stats.premium, icon: Star },
          { label: 'Converted', value: stats.converted, icon: UserCheck },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader>
            <CardContent><Icon className="h-4 w-4 text-accent" /></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle>First-party CRM</CardTitle><CardDescription>Leads and customer intent stored securely in Peptide South Africa’s Supabase project.</CardDescription></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="min-h-11 gap-2" onClick={() => void loadCRM()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
            <Button variant="outline" size="sm" className="min-h-11 gap-2" onClick={exportCSV} disabled={!filtered.length}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, source or status" className="min-h-11 pl-9" /></div>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Source</TableHead><TableHead>Intent</TableHead><TableHead>Score</TableHead><TableHead>Activity</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading CRM…</TableCell></TableRow>
                  : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No matching leads yet.</TableCell></TableRow>
                    : filtered.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="min-w-[230px]"><p className="font-medium">{`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || 'Unnamed lead'}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</p></TableCell>
                        <TableCell><span className="text-sm">{lead.source}</span></TableCell>
                        <TableCell><Badge variant={lead.plan_interest === 'premium' ? 'default' : 'secondary'}>{lead.plan_interest}</Badge></TableCell>
                        <TableCell><span className="font-semibold">{lead.lead_score}</span><span className="text-muted-foreground">/100</span></TableCell>
                        <TableCell><p className="text-sm">{lead.activity_count} events</p><p className="text-xs text-muted-foreground">{format(new Date(lead.last_activity_at), 'd MMM yyyy, HH:mm')}</p></TableCell>
                        <TableCell>
                          <select aria-label={`Status for ${lead.email}`} value={lead.lead_status} onChange={(event) => void updateStatus(lead.id, event.target.value as LeadStatus)} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${STATUS_STYLES[lead.lead_status]}`}>
                            <option value="new">New</option><option value="nurturing">Nurturing</option><option value="qualified">Qualified</option><option value="converted">Converted</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
