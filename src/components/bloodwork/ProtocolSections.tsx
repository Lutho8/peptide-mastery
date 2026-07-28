import { Plus, Check } from 'lucide-react';
import { StackPeptideCard, StackPeptide } from './StackPeptideCard';
import { AdherenceChecklist } from './AdherenceChecklist';
import { useProtocolAdherence } from '@/hooks/useProtocolAdherence';
import { useStackCart, slugify } from './StackCartContext';

export interface SupplementItem {
  name: string;
  dose?: string;
  what_it_is?: string;
  why_it_matters?: string;
  how_to_take?: string;
}

export interface NutritionItem {
  title: string;
  what_it_looks_like?: string;
  why_adopt?: string;
  examples?: string;
}

export interface NumberedItem {
  title: string;
  body?: string;
}

export interface RetestItem {
  marker: string;
  when?: string;
  why?: string;
}

export interface Protocol {
  stack_summary?: string;
  stack?: StackPeptide[];
  supplements?: SupplementItem[];
  nutrition?: NutritionItem[];
  exercise?: NumberedItem[];
  stress?: NumberedItem[];
  environment?: NumberedItem[];
  retest?: RetestItem[];
}

interface Props {
  protocol: Protocol;
  goals: string[];
  labReportId: string | null;
}

export function ProtocolSections({ protocol, goals: _goals, labReportId }: Props) {
  const adherence = useProtocolAdherence(labReportId);
  const { addMany, has } = useStackCart();

  const allStackItems = (protocol.stack ?? []).map((p) => ({
    name: p.name,
    slug: p.slug || slugify(p.name),
  }));
  const allInCart = allStackItems.length > 0 && allStackItems.every((i) => has(i.slug));

  const handleAddAll = () => {
    addMany(allStackItems);
  };

  const supplementItems = (protocol.supplements ?? []).map((s) => ({
    title: s.name,
    meta: s.dose,
    body: [s.what_it_is, s.why_it_matters, s.how_to_take].filter(Boolean).join(' · '),
  }));
  const nutritionItems = (protocol.nutrition ?? []).map((n) => ({
    title: n.title,
    body: [n.what_it_looks_like, n.why_adopt, n.examples].filter(Boolean).join(' · '),
  }));
  const exerciseItems = protocol.exercise ?? [];
  const stressItems = protocol.stress ?? [];

  return (
    <div className="space-y-12">
      {/* PEPTIDE STACK */}
      {protocol.stack && protocol.stack.length > 0 && (
        <ProtocolBlock num="04" title="Peptide stack">
          {protocol.stack_summary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{protocol.stack_summary}</p>
          )}
          <button
            type="button"
            onClick={handleAddAll}
            disabled={allInCart}
            className="group w-full flex items-center justify-between gap-3 mb-5 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-4 hover:border-primary transition-all disabled:opacity-80 disabled:cursor-default text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              {allInCart ? <Check size={18} className="text-green-500 shrink-0" /> : <Plus size={18} className="text-primary shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {allInCart ? 'All peptides in your stack' : 'Add all to stack'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Review at the cart, then buy on peptide-south-africa.com/shop
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono tabular-nums text-primary shrink-0">
              {allStackItems.length} item{allStackItems.length === 1 ? '' : 's'}
            </span>
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {protocol.stack.map((p, i) => (
              <StackPeptideCard key={`${p.name}-${i}`} peptide={p} index={i} />
            ))}
          </div>
        </ProtocolBlock>
      )}

      {/* SUPPLEMENTS */}
      {supplementItems.length > 0 && (
        <ProtocolBlock num="05" title="Supplements — track adherence">
          <AdherenceChecklist
            section="supplements"
            items={supplementItems}
            isDone={adherence.isDone}
            toggle={adherence.toggle}
            resetSection={adherence.resetSection}
            progress={adherence.sectionProgress('supplements', supplementItems.length)}
          />
        </ProtocolBlock>
      )}

      {/* NUTRITION */}
      {nutritionItems.length > 0 && (
        <ProtocolBlock num="06" title="Nutrition — track adherence">
          <AdherenceChecklist
            section="nutrition"
            items={nutritionItems}
            isDone={adherence.isDone}
            toggle={adherence.toggle}
            resetSection={adherence.resetSection}
            progress={adherence.sectionProgress('nutrition', nutritionItems.length)}
          />
        </ProtocolBlock>
      )}

      {/* EXERCISE */}
      {exerciseItems.length > 0 && (
        <ProtocolBlock num="07" title="Exercise — track adherence">
          <AdherenceChecklist
            section="exercise"
            items={exerciseItems}
            isDone={adherence.isDone}
            toggle={adherence.toggle}
            resetSection={adherence.resetSection}
            progress={adherence.sectionProgress('exercise', exerciseItems.length)}
          />
        </ProtocolBlock>
      )}

      {/* STRESS */}
      {stressItems.length > 0 && (
        <ProtocolBlock num="08" title="Stress — track adherence">
          <AdherenceChecklist
            section="stress"
            items={stressItems}
            isDone={adherence.isDone}
            toggle={adherence.toggle}
            resetSection={adherence.resetSection}
            progress={adherence.sectionProgress('stress', stressItems.length)}
          />
        </ProtocolBlock>
      )}

      {/* ENVIRONMENT (read-only — no adherence) */}
      {protocol.environment && protocol.environment.length > 0 && (
        <NumberedBlock num="09" title="Environment" items={protocol.environment} />
      )}

      {/* RETEST */}
      {protocol.retest && protocol.retest.length > 0 && (
        <ProtocolBlock num="10" title="Diagnostics — retest">
          <ul className="space-y-3">
            {protocol.retest.map((r, i) => (
              <li key={i} className="rounded-lg border border-border/50 bg-card/30 p-3">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm font-semibold text-foreground">{r.marker}</span>
                  {r.when && (
                    <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {r.when}
                    </span>
                  )}
                </div>
                {r.why && <p className="text-xs text-muted-foreground">{r.why}</p>}
              </li>
            ))}
          </ul>
        </ProtocolBlock>
      )}
    </div>
  );
}

function ProtocolBlock({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/50">
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{num} —</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NumberedBlock({ num, title, items }: { num: string; title: string; items: NumberedItem[] }) {
  if (!items.length) return null;
  return (
    <ProtocolBlock num={num} title={title}>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="border-l-2 border-primary/40 pl-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
            </div>
            {item.body && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.body}</p>}
          </li>
        ))}
      </ol>
    </ProtocolBlock>
  );
}
