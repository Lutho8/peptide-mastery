import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PackageCheck, Plus, RefreshCw, Send, Trash2, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CHECKLIST = [
  ['items_verified', 'Items match the order'],
  ['batch_verified', 'Batch and expiry verified'],
  ['insulation_added', 'Insulated liner added'],
  ['cold_pack_added', 'Cold pack added without direct vial contact'],
  ['tamper_seal_applied', 'Tamper-evident seal applied'],
  ['insert_added', 'Correct insert added'],
  ['final_check', 'Final pack and label check complete'],
] as const;

type ChecklistKey = typeof CHECKLIST[number][0];
type ChecklistState = Record<ChecklistKey, boolean>;

interface Allocation {
  id?: string;
  product_slug: string;
  variant_label: string;
  lot_number: string;
  expires_at: string;
  quantity: number;
}

interface Shipment {
  id: string;
  web_order_id: string | null;
  order_ref: string;
  status: string;
  service: string;
  postnet_branch_name: string | null;
  courier: string | null;
  tracking_number: string | null;
  packing_checklist: Partial<ChecklistState>;
  tamper_seal_number: string | null;
  packing_notes: string | null;
  created_at: string;
  updated_at: string;
  shipment_batch_allocations: Allocation[];
  orders: { customer_name: string | null; customer_email: string | null } | null;
}

interface UnallocatedOrder {
  id: string;
  public_ref: string;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  created_at: string;
}

interface Overview {
  shipments: Shipment[];
  unallocated_orders: UnallocatedOrder[];
  stats: { queued: number; packing: number; ready: number; dispatched: number };
}

const EMPTY_CHECKLIST: ChecklistState = {
  items_verified: false,
  batch_verified: false,
  insulation_added: false,
  cold_pack_added: false,
  tamper_seal_applied: false,
  insert_added: false,
  final_check: false,
};

const emptyAllocation = (): Allocation => ({
  product_slug: '', variant_label: '', lot_number: '', expires_at: '', quantity: 1,
});

function serviceLabel(service: string) {
  return service.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FulfilmentQueue() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newService, setNewService] = useState('postnet_to_door');
  const [branchName, setBranchName] = useState('');
  const [checklist, setChecklist] = useState<ChecklistState>(EMPTY_CHECKLIST);
  const [sealNumber, setSealNumber] = useState('');
  const [packingNotes, setPackingNotes] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([emptyAllocation()]);
  const [trackingNumber, setTrackingNumber] = useState('');

  const selected = useMemo(() => overview?.shipments.find((shipment) => shipment.id === selectedId) ?? null, [overview, selectedId]);

  const invoke = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    const { data, error } = await supabase.functions.invoke<T>('fulfilment-admin', { body });
    if (error) throw error;
    const response = data as T & { error?: string };
    if (response?.error) throw new Error(response.error);
    return data as T;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Overview>({ action: 'overview' });
      setOverview(data);
      setSelectedId((current) => current && data.shipments.some((shipment) => shipment.id === current) ? current : data.shipments[0]?.id ?? null);
    } catch (error) {
      console.error('Fulfilment queue load failed', error);
      toast.error('Fulfilment queue could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    setChecklist({ ...EMPTY_CHECKLIST, ...selected.packing_checklist });
    setSealNumber(selected.tamper_seal_number ?? '');
    setPackingNotes(selected.packing_notes ?? '');
    setAllocations(selected.shipment_batch_allocations.length
      ? selected.shipment_batch_allocations.map((item) => ({ ...item, variant_label: item.variant_label ?? '', expires_at: item.expires_at ?? '' }))
      : [emptyAllocation()]);
    setTrackingNumber(selected.tracking_number ?? '');
  }, [selected]);

  async function runAction(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    try {
      await invoke<{ ok: true }>(body);
      toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  async function createShipment(orderId: string) {
    await runAction({ action: 'create_shipment', order_id: orderId, service: newService, postnet_branch_name: branchName }, 'Shipment added to the packing queue');
  }

  const allChecksComplete = Object.values(checklist).every(Boolean);
  const allocationComplete = allocations.length > 0 && allocations.every((item) => item.product_slug.trim() && item.lot_number.trim() && item.quantity > 0);
  const canRelease = allChecksComplete && allocationComplete && sealNumber.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">In-house PostNet fulfilment</h2>
          <p className="mt-1 text-sm text-muted-foreground">One Supabase queue from paid order to batch-verified, tamper-sealed PostNet handoff.</p>
        </div>
        <Button variant="outline" onClick={() => { void load(); }} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(overview?.stats ?? { queued: 0, packing: 0, ready: 0, dispatched: 0 }).map(([label, value]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs capitalize text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>
        ))}
      </div>

      {(overview?.unallocated_orders.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Paid orders awaiting fulfilment</CardTitle><CardDescription>Create one shipment record; it stays connected to the original order.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <Select value={newService} onValueChange={setNewService}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="postnet_to_door">PostNet to Door</SelectItem>
                  <SelectItem value="postnet_to_postnet">PostNet to PostNet</SelectItem>
                  <SelectItem value="cape_town_local">Cape Town local</SelectItem>
                  <SelectItem value="paxi_accessories">PAXI — accessories only</SelectItem>
                </SelectContent>
              </Select>
              <Input value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="PostNet collection branch (if applicable)" />
            </div>
            {overview?.unallocated_orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold">{order.public_ref}</p><p className="text-sm text-muted-foreground">{order.customer_name || order.customer_email || 'Customer'} · {order.status}</p></div>
                <Button onClick={() => { void createShipment(order.id); }} disabled={saving}><Plus className="mr-2 h-4 w-4" />Create shipment</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader><CardTitle className="text-lg">Packing queue</CardTitle><CardDescription>Select a shipment to continue its controlled workflow.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading queue…</p>}
            {!loading && overview?.shipments.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No shipments in the queue.</p>}
            {overview?.shipments.map((shipment) => (
              <button key={shipment.id} type="button" onClick={() => setSelectedId(shipment.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === shipment.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <div className="flex items-start justify-between gap-2"><span className="font-semibold">{shipment.order_ref}</span><Badge variant="outline">{shipment.status.replaceAll('_', ' ')}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{shipment.orders?.customer_name || shipment.orders?.customer_email || 'Customer'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{serviceLabel(shipment.service)}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-lg">Pack {selected.order_ref}</CardTitle><CardDescription>{serviceLabel(selected.service)}{selected.postnet_branch_name ? ` · ${selected.postnet_branch_name}` : ''}</CardDescription></div><Badge>{selected.status.replaceAll('_', ' ')}</Badge></div>
            </CardHeader>
            <CardContent className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-semibold">Release checklist</legend>
                {CHECKLIST.map(([key, label]) => (
                  <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                    <input type="checkbox" checked={checklist[key]} onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))} className="h-5 w-5 accent-primary" />
                    {label}
                  </label>
                ))}
              </fieldset>

              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label>Batch allocations</Label><Button variant="ghost" size="sm" onClick={() => setAllocations((current) => [...current, emptyAllocation()])}><Plus className="mr-1 h-4 w-4" />Add item</Button></div>
                {allocations.map((allocation, index) => (
                  <div key={allocation.id ?? index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                    <Input aria-label="Product slug" placeholder="Product slug" value={allocation.product_slug} onChange={(event) => setAllocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, product_slug: event.target.value } : item))} />
                    <Input aria-label="Variant" placeholder="Variant (optional)" value={allocation.variant_label} onChange={(event) => setAllocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, variant_label: event.target.value } : item))} />
                    <Input aria-label="Lot number" placeholder="Lot number" value={allocation.lot_number} onChange={(event) => setAllocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, lot_number: event.target.value } : item))} />
                    <div className="flex gap-2"><Input aria-label="Expiry date" type="date" value={allocation.expires_at} onChange={(event) => setAllocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, expires_at: event.target.value } : item))} /><Button variant="ghost" size="icon" aria-label="Remove allocation" disabled={allocations.length === 1} onClick={() => setAllocations((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="seal-number">Tamper seal number</Label><Input id="seal-number" value={sealNumber} onChange={(event) => setSealNumber(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="packing-notes">Internal packing note</Label><Input id="packing-notes" value={packingNotes} onChange={(event) => setPackingNotes(event.target.value)} maxLength={1000} /></div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" disabled={saving || !allocationComplete} onClick={() => { void runAction({ action: 'save_packing', shipment_id: selected.id, checklist, tamper_seal_number: sealNumber, packing_notes: packingNotes, allocations }, 'Packing record saved'); }}><PackageCheck className="mr-2 h-4 w-4" />Save packing</Button>
                <Button disabled={saving || selected.status !== 'packed' || !canRelease} onClick={() => { void runAction({ action: 'mark_ready', shipment_id: selected.id }, 'Shipment is ready for collection'); }}><CheckCircle2 className="mr-2 h-4 w-4" />Mark PostNet-ready</Button>
              </div>

              {selected.status === 'ready_for_collection' && (
                <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <Label htmlFor="tracking-number">PostNet tracking number</Label>
                  <div className="flex flex-col gap-2 sm:flex-row"><Input id="tracking-number" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Enter after handoff" /><Button disabled={saving || !trackingNumber.trim()} onClick={() => { void runAction({ action: 'dispatch', shipment_id: selected.id, tracking_number: trackingNumber, courier: 'PostNet' }, 'Shipment marked dispatched'); }}><Send className="mr-2 h-4 w-4" />Dispatch</Button></div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="flex min-h-56 items-center justify-center text-sm text-muted-foreground"><Truck className="mr-2 h-5 w-5" />Select a shipment to pack</CardContent></Card>
        )}
      </div>
    </div>
  );
}
