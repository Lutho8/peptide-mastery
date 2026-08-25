import { ArrowRight, ClipboardList, FlaskConical, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardSnapshot, JourneyEventName } from '@/hooks/useCustomerJourney';
import type { Json } from '@/integrations/supabase/types';

interface WorkspaceMomentumCardProps {
  snapshot: DashboardSnapshot;
  onWorkspace: () => void;
  onBloodwork: () => void;
  onInventory: () => void;
  onTrack: (event: JourneyEventName, context?: Record<string, Json>) => Promise<void>;
}

export function WorkspaceMomentumCard({ snapshot, onWorkspace, onBloodwork, onInventory, onTrack }: WorkspaceMomentumCardProps) {
  const lastEvent = snapshot.workspace.recent_events.find((event) => event.event_name !== 'dashboard_viewed');
  const labStatus = snapshot.workspace.latest_lab_report?.status;

  return (
    <Card className="border-accent/25 bg-gradient-to-br from-card via-card to-accent/5">
      <CardHeader className="pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Continue where you left off</p>
        <CardTitle className="text-lg">Your workspace at a glance</CardTitle>
        <p className="text-sm text-muted-foreground">{lastEvent ? `Last workspace activity: ${lastEvent.event_name.replaceAll('_', ' ')}.` : 'Your first saved action will appear here.'} The app records your work; it does not generate a treatment plan.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-background/70 p-3"><ClipboardList className="mb-2 h-4 w-4 text-primary" /><p className="text-xl font-bold">{snapshot.workspace.stack_items}</p><p className="text-xs text-muted-foreground">Plan items</p></div>
          <div className="rounded-xl border border-border bg-background/70 p-3"><FlaskConical className="mb-2 h-4 w-4 text-primary" /><p className="truncate text-sm font-bold capitalize">{labStatus?.replaceAll('_', ' ') ?? 'None'}</p><p className="text-xs text-muted-foreground">Latest lab</p></div>
          <div className="rounded-xl border border-border bg-background/70 p-3"><PackageSearch className="mb-2 h-4 w-4 text-primary" /><p className="text-xl font-bold">{snapshot.commerce.order_count}</p><p className="text-xs text-muted-foreground">Orders</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button className="min-h-11 justify-between" onClick={() => { void onTrack('workspace_entry', { entry: 'momentum_card' }); onWorkspace(); }}>Recorded plan <ArrowRight size={15} /></Button>
          <Button variant="outline" className="min-h-11" onClick={() => { void onTrack('next_action_started', { action: 'bloodwork' }); onBloodwork(); }}>Bloodwork</Button>
          <Button variant="outline" className="min-h-11" onClick={() => { void onTrack('next_action_started', { action: 'inventory' }); onInventory(); }}>Inventory</Button>
        </div>
      </CardContent>
    </Card>
  );
}
