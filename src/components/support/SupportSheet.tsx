import { MessageCircle, Mail, Route, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WA_HREF = 'https://wa.me/27641344646?text=Hi%2C%20I%20need%20help%20with%20my%20Peptide%20South%20Africa%20account%20or%20pathway.';
const GUIDED_HREF = 'mailto:support@peptide-south-africa.com?subject=Guided%20Pathway%20Request%20%E2%80%94%20Peptide%20South%20Africa';
const EMAIL_HREF = 'mailto:support@peptide-south-africa.com?subject=Support%20%E2%80%94%20Peptide%20South%20Africa';
const SHOP_HREF = 'https://peptide-south-africa.com/?utm_source=psa_app&utm_medium=support&utm_campaign=shop';

interface Row {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
  accent: string;
}

const rows: Row[] = [
  {
    icon: <MessageCircle size={20} />,
    label: 'WhatsApp chat',
    sub: 'Account, order and pathway support',
    href: WA_HREF,
    accent: 'bg-[#25D366]/15 text-[#25D366]',
  },
  {
    icon: <Route size={20} />,
    label: 'Request the guided pathway',
    sub: 'We will route patient-specific questions appropriately',
    href: GUIDED_HREF,
    accent: 'bg-primary/15 text-primary',
  },
  {
    icon: <Mail size={20} />,
    label: 'Email support',
    sub: 'For account, billing or data questions',
    href: EMAIL_HREF,
    accent: 'bg-accent/20 text-accent-foreground',
  },
  {
    icon: <ShoppingBag size={20} />,
    label: 'Browse the research store',
    sub: 'Opens peptide-south-africa.com',
    href: SHOP_HREF,
    accent: 'bg-amber-500/15 text-amber-500',
  },
];

export function SupportSheet({ open, onOpenChange }: SupportSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>How can we help?</SheetTitle>
          <SheetDescription>
            Pick the fastest way to reach the Peptide South Africa team.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2 pb-4">
          {rows.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target={r.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 min-h-14 transition-all hover:border-primary/40 hover:bg-card/80 active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r.accent}`}>
                {r.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground leading-tight">{r.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{r.sub}</p>
              </div>
            </a>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
