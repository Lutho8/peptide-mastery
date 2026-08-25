import { useEffect, useRef } from 'react';
import { CalendarClock, CheckCircle2, ExternalLink, PackageCheck, ShoppingBag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomerJourney, OrderDashboard, JourneyEventName } from '@/hooks/useCustomerJourney';
import type { Json } from '@/integrations/supabase/types';
import { getStoreCategoryHref, getStoreProductHref, type StoreCategory } from '@/lib/storeLinks';

interface OrderJourneyCardProps {
  journey: CustomerJourney | null | undefined;
  commerce: OrderDashboard;
  onTrack: (event: JourneyEventName, context?: Record<string, Json>) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order received',
  paid: 'Payment confirmed',
  processing: 'Preparing order',
  pending_pick: 'Queued for picking',
  picked: 'Items picked',
  packed: 'Packing complete',
  ready_for_collection: 'Ready for PostNet',
  dispatched: 'Dispatched',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const CATEGORY_LINKS: Array<{ category: StoreCategory; label: string }> = [
  { category: 'weight-loss', label: 'Weight-loss pathway' },
  { category: 'longevity', label: 'Longevity research' },
  { category: 'recovery', label: 'Recovery research' },
  { category: 'skin-hair', label: 'Skin & hair research' },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll('_', ' ');
}

export function OrderJourneyCard({ journey, commerce, onTrack }: OrderJourneyCardProps) {
  const order = commerce.latest_order;
  const shipment = commerce.latest_shipment;
  const reminder = commerce.next_reorder;
  const trackedOrder = useRef<string | null>(null);

  useEffect(() => {
    if (!order || trackedOrder.current === order.id) return;
    trackedOrder.current = order.id;
    void onTrack('order_status_viewed', { order_ref: order.public_ref, status: shipment?.status ?? order.status });
  }, [onTrack, order, shipment?.status]);

  if (!order && !journey?.experience_mode) return null;

  if (!order) {
    if (journey?.pathway === 'guided') {
      return (
        <Card className="border-primary/15">
          <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>Your guided-support request is the next step. Product selection is intentionally kept out of this dashboard until that pathway is complete.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <Badge variant="outline" className="mb-2 w-fit border-primary/30 text-primary">Verified store routes</Badge>
          <CardTitle className="text-lg">Continue by research category</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">These links open the matching store category. They are navigation shortcuts—not a product, dose or treatment recommendation.</p>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {CATEGORY_LINKS.map(({ category, label }) => (
            <Button key={category} variant="outline" className="min-h-11 justify-between" asChild>
              <a
                href={getStoreCategoryHref(category, `category_${category}`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void onTrack('order_cta_clicked', { category, placement: 'order_journey' }); }}
              >{label}<ExternalLink size={15} /></a>
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }

  const effectiveStatus = shipment?.status ?? order.status;
  const serviceLabel = shipment?.service === 'postnet_to_postnet' ? 'PostNet to PostNet' : shipment?.service === 'postnet_to_door' ? 'PostNet to Door' : shipment?.service;
  const reorderDue = reminder ? new Date(reminder.due_at).getTime() <= Date.now() : false;

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Order {order.public_ref}</Badge>
            <CardTitle className="flex items-center gap-2 text-lg"><PackageCheck className="h-5 w-5 text-primary" />{statusLabel(effectiveStatus)}</CardTitle>
          </div>
          <p className="text-sm font-semibold text-foreground">{order.currency} {order.total.toFixed(2)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="block text-xs text-muted-foreground">Ordered</span>{formatDate(order.created_at)}</span></div>
          <div className="flex gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="block text-xs text-muted-foreground">Delivery</span>{serviceLabel ?? order.shipping_method ?? 'Pending allocation'}</span></div>
          <div className="flex gap-2"><PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="block text-xs text-muted-foreground">Tracking</span>{shipment?.tracking_number ?? 'Added after dispatch'}</span></div>
        </div>

        {shipment?.postnet_branch_name && <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">Collection branch: <span className="font-medium text-foreground">{shipment.postnet_branch_name}</span></p>}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
          {shipment?.tracking_number && (
            <Button variant="outline" className="min-h-11" asChild>
              <a href="https://www.postnet.co.za/tracking" target="_blank" rel="noopener noreferrer">Track with PostNet <ExternalLink className="ml-2" size={15} /></a>
            </Button>
          )}
          {reminder ? (
            <Button className="min-h-11" disabled={!reorderDue} asChild={reorderDue}>
              {reorderDue ? (
                <a
                  href={getStoreProductHref(reminder.product_slug, 'reorder_due')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { void onTrack('reorder_cta_clicked', { source_order_id: reminder.source_order_id, product_slug: reminder.product_slug }); }}
                ><ShoppingBag className="mr-2" size={16} />Reorder from verified store</a>
              ) : <span>Reorder available {formatDate(reminder.due_at)}</span>}
            </Button>
          ) : (
            <Button variant="outline" className="min-h-11" asChild>
              <a
                href={getStoreCategoryHref('all', 'existing_customer_store')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void onTrack('order_cta_clicked', { placement: 'existing_customer' }); }}
              >Open verified store <ExternalLink className="ml-2" size={15} /></a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
