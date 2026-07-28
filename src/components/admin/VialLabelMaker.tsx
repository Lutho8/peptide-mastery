import { useState, useRef } from 'react';
import { Tag, Printer, Copy, Check, Plus, Trash2, Palette, Layout, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { peptides } from '@/data/peptides';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { logAudit } from '@/lib/auditLog';

interface VialLabel {
  id: string;
  peptideName: string;
  coaAmount: string;
  bacWater: string;
  concentration: string;
  dosePerInjection: string;
  doseUnit: string;
  units: string;
  cc: string;
  reconDate: string;
  expiryDate: string;
  batchNumber: string;
  notes: string;
  showPurity: boolean;
  purity: string;
}

type LabelLayout = 'compact' | 'standard' | 'large';
type LabelColorTheme = 'clinical' | 'ocean' | 'emerald' | 'midnight' | 'rose' | 'amber';

const colorThemes: Record<LabelColorTheme, {
  label: string;
  border: string;
  header: string;
  bg: string;
  accent: string;
  accentBg: string;
  printBorder: string;
  printHeader: string;
  printBg: string;
  printAccent: string;
  printAccentBg: string;
}> = {
  clinical: {
    label: 'Clinical White',
    border: 'border-border',
    header: 'bg-card',
    bg: 'bg-card',
    accent: 'text-primary',
    accentBg: 'bg-primary/10',
    printBorder: '#1a1a2e',
    printHeader: '#f0f0f5',
    printBg: '#ffffff',
    printAccent: '#6366f1',
    printAccentBg: '#eef2ff',
  },
  ocean: {
    label: 'Ocean Blue',
    border: 'border-blue-400/50',
    header: 'bg-blue-500/10',
    bg: 'bg-card',
    accent: 'text-blue-500',
    accentBg: 'bg-blue-500/10',
    printBorder: '#1e40af',
    printHeader: '#dbeafe',
    printBg: '#ffffff',
    printAccent: '#2563eb',
    printAccentBg: '#eff6ff',
  },
  emerald: {
    label: 'Medical Green',
    border: 'border-emerald-400/50',
    header: 'bg-emerald-500/10',
    bg: 'bg-card',
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10',
    printBorder: '#065f46',
    printHeader: '#d1fae5',
    printBg: '#ffffff',
    printAccent: '#059669',
    printAccentBg: '#ecfdf5',
  },
  midnight: {
    label: 'Midnight',
    border: 'border-slate-500/50',
    header: 'bg-slate-800/50',
    bg: 'bg-slate-900/20',
    accent: 'text-slate-300',
    accentBg: 'bg-slate-500/10',
    printBorder: '#1e293b',
    printHeader: '#1e293b',
    printBg: '#f8fafc',
    printAccent: '#475569',
    printAccentBg: '#f1f5f9',
  },
  rose: {
    label: 'Rose',
    border: 'border-rose-400/50',
    header: 'bg-rose-500/10',
    bg: 'bg-card',
    accent: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    printBorder: '#9f1239',
    printHeader: '#ffe4e6',
    printBg: '#ffffff',
    printAccent: '#e11d48',
    printAccentBg: '#fff1f2',
  },
  amber: {
    label: 'Warm Amber',
    border: 'border-amber-400/50',
    header: 'bg-amber-500/10',
    bg: 'bg-card',
    accent: 'text-amber-500',
    accentBg: 'bg-amber-500/10',
    printBorder: '#92400e',
    printHeader: '#fef3c7',
    printBg: '#ffffff',
    printAccent: '#d97706',
    printAccentBg: '#fffbeb',
  },
};

const layoutSizes: Record<LabelLayout, { label: string; width: string; qrSize: number; textSize: string; printWidth: string; printFontBase: string }> = {
  compact: { label: 'Compact', width: 'max-w-[240px]', qrSize: 52, textSize: 'text-[10px]', printWidth: '240px', printFontBase: '9px' },
  standard: { label: 'Standard', width: 'max-w-[320px]', qrSize: 72, textSize: 'text-xs', printWidth: '300px', printFontBase: '11px' },
  large: { label: 'Large', width: 'max-w-[400px]', qrSize: 88, textSize: 'text-sm', printWidth: '380px', printFontBase: '12px' },
};

function buildQrData(label: VialLabel): string {
  return [
    label.peptideName,
    `${label.coaAmount}mg/${label.bacWater}mL`,
    `${label.concentration}mg/mL`,
    `Dose:${label.dosePerInjection}${label.doseUnit}`,
    `Draw:${label.units}u`,
    `Recon:${label.reconDate}`,
    `Exp:${label.expiryDate}`,
    label.batchNumber ? `Batch:${label.batchNumber}` : '',
  ].filter(Boolean).join('\n');
}

export default function VialLabelMaker() {
  const [labels, setLabels] = useState<VialLabel[]>([]);
  const [selectedPeptide, setSelectedPeptide] = useState('');
  const [coaAmount, setCoaAmount] = useState('');
  const [bacWater, setBacWater] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState('mcg');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showPurity, setShowPurity] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [colorTheme, setColorTheme] = useState<LabelColorTheme>('clinical');
  const [layout, setLayout] = useState<LabelLayout>('standard');
  const printRef = useRef<HTMLDivElement>(null);

  const theme = colorThemes[colorTheme];
  const size = layoutSizes[layout];

  const selectedPeptideData = selectedPeptide ? peptides.find(p => p.id === selectedPeptide) : null;
  const peptideName = selectedPeptideData?.shortName || '';

  // Auto-fill COA amount from peptide data
  const handlePeptideSelect = (peptideId: string) => {
    setSelectedPeptide(peptideId);
    const pep = peptides.find(p => p.id === peptideId);
    if (pep?.janoshikCOA?.[0]) {
      const amount = pep.janoshikCOA[0].measuredAmount.replace(/[^\d.]/g, '');
      setCoaAmount(amount);
    }
  };

  const handleAddLabel = () => {
    const coa = parseFloat(coaAmount);
    const bac = parseFloat(bacWater);
    const dose = parseFloat(doseAmount);

    if (!peptideName || !coa || !bac || !dose) {
      toast.error('Please fill in all fields');
      return;
    }

    const concentrationMgMl = coa / bac;
    const doseMg = doseUnit === 'mg' ? dose : dose / 1000;
    const volumeMl = doseMg / concentrationMgMl;
    const unitsToDraw = Math.round(volumeMl * 100 * 10) / 10;

    const reconDate = format(new Date(), 'yyyy-MM-dd');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const expiryDate = format(expiry, 'yyyy-MM-dd');

    const purityStr = selectedPeptideData?.janoshikPurity ? `${selectedPeptideData.janoshikPurity}%` : '';

    const label: VialLabel = {
      id: crypto.randomUUID(),
      peptideName,
      coaAmount: String(coa),
      bacWater: String(bac),
      concentration: concentrationMgMl.toFixed(2),
      dosePerInjection: String(dose),
      doseUnit,
      units: String(unitsToDraw),
      cc: volumeMl.toFixed(2),
      reconDate,
      expiryDate,
      batchNumber,
      notes,
      showPurity,
      purity: purityStr,
    };

    setLabels(prev => [...prev, label]);
    void logAudit({
      action: 'admin.label_generate',
      entityType: 'vial_label',
      entityId: selectedPeptide,
      metadata: {
        peptideName,
        coaAmount: coa,
        bacWater: bac,
        dose,
        doseUnit,
        concentration: concentrationMgMl,
      },
    });
    toast.success(`Label created for ${peptideName}`);
  };

  const handleRemoveLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  const handleCopyLabel = async (label: VialLabel) => {
    const text = `PEPTIDE SOUTH AFRICA | ${label.peptideName}\n${label.coaAmount}mg COA / ${label.bacWater}mL BAC\nConc: ${label.concentration}mg/mL\nDose: ${label.dosePerInjection}${label.doseUnit} = ${label.units}u (${label.cc}cc)\nRecon: ${label.reconDate} | Exp: ${label.expiryDate}${label.batchNumber ? `\nBatch: ${label.batchNumber}` : ''}${label.purity && label.showPurity ? `\nPurity: ${label.purity}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label.id);
      toast.success('Label copied!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handlePrint = () => {
    if (labels.length === 0) {
      toast.error('No labels to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // HTML-escape all user-controlled fields before interpolating into the print document
    // to prevent XSS via fields like batchNumber and notes.
    const esc = (s: string | number | undefined | null): string =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const qrPx = size.qrSize;
    const labelsHtml = labels.map(label => {
      const qrData = encodeURIComponent(buildQrData(label));
      return `
      <div class="label" style="border: 2.5px solid ${theme.printBorder}; border-radius: 10px; width: ${size.printWidth}; font-family: 'SF Pro Display', -apple-system, 'Segoe UI', sans-serif; font-size: ${size.printFontBase}; page-break-inside: avoid; margin: 8px; background: ${theme.printBg}; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: ${theme.printHeader}; border-bottom: 2px solid ${theme.printBorder};">
          <div style="display: flex; align-items: center; gap: 6px;">
            <img src="/logo-animated.png" style="width: 22px; height: 22px;" />
            <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; color: ${theme.printBorder};">PEPTIDE SOUTH AFRICA</span>
          </div>
          <span style="font-size: 8px; color: ${theme.printAccent}; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Research Only</span>
        </div>
        <!-- Body -->
        <div style="padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: ${layout === 'large' ? '20px' : layout === 'compact' ? '15px' : '18px'}; font-weight: 800; color: ${theme.printBorder}; margin-bottom: 6px; letter-spacing: -0.3px;">${esc(label.peptideName)}</div>
              ${label.purity && label.showPurity ? `<div style="display: inline-block; background: ${theme.printAccentBg}; color: ${theme.printAccent}; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-bottom: 6px; border: 1px solid ${theme.printAccent}22;">${esc(label.purity)} PURITY</div>` : ''}
              <table style="width: 100%; font-size: ${size.printFontBase}; border-collapse: collapse;">
                <tr><td style="color: #888; padding: 1px 0; width: 70px;">COA Mass</td><td style="font-weight: 600;">${esc(label.coaAmount)} mg</td></tr>
                <tr><td style="color: #888; padding: 1px 0;">BAC Water</td><td style="font-weight: 600;">${esc(label.bacWater)} mL</td></tr>
                <tr><td style="color: #888; padding: 1px 0;">Conc.</td><td style="font-weight: 600;">${esc(label.concentration)} mg/mL</td></tr>
                <tr style="border-top: 1px dashed #ddd;"><td style="color: #888; padding: 3px 0 1px;">Dose</td><td style="font-weight: 700; color: ${theme.printAccent};">${esc(label.dosePerInjection)} ${esc(label.doseUnit)} → ${esc(label.units)}u (${esc(label.cc)}cc)</td></tr>
              </table>
            </div>
            <div style="margin-left: 4px; flex-shrink: 0; text-align: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrPx * 2}x${qrPx * 2}&data=${qrData}&ecc=M" width="${qrPx}" height="${qrPx}" style="border-radius: 4px;" />
              <div style="font-size: 7px; color: #aaa; margin-top: 2px;">SCAN</div>
            </div>
          </div>
          ${label.notes ? `<div style="margin-top: 6px; padding: 4px 8px; background: #f8f8f8; border-radius: 4px; font-size: 9px; color: #666; border-left: 2px solid ${theme.printAccent};">${esc(label.notes)}</div>` : ''}
        </div>
        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; background: ${theme.printHeader}; border-top: 1px solid #e5e5e5; font-size: 9px; color: #888;">
          <span>Recon: <strong>${esc(label.reconDate)}</strong></span>
          <span>Exp: <strong style="color: #c00;">${esc(label.expiryDate)}</strong></span>
          ${label.batchNumber ? `<span>Batch: <strong>${esc(label.batchNumber)}</strong></span>` : ''}
        </div>
      </div>
    `;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Vial Labels — Peptide South Africa</title>
      <style>@media print { body { margin: 0; } .label { break-inside: avoid; } }</style>
    </head><body style="display: flex; flex-wrap: wrap; padding: 16px; gap: 10px; background: #fff;">${labelsHtml}<script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Professional Vial Label Maker
          </CardTitle>
          <CardDescription>Create pharmaceutical-grade labels with Peptide South Africa branding, QR codes, and reconstitution details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Peptide / COA / BAC inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Peptide</Label>
              <Select value={selectedPeptide} onValueChange={handlePeptideSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select peptide..." />
                </SelectTrigger>
                <SelectContent>
                  {peptides.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.shortName} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>COA Amount (mg)</Label>
              <Input type="number" value={coaAmount} onChange={e => setCoaAmount(e.target.value)} placeholder="e.g. 12" className="mt-1" min="0" step="0.01" />
            </div>
            <div>
              <Label>BAC Water (mL)</Label>
              <Input type="number" value={bacWater} onChange={e => setBacWater(e.target.value)} placeholder="e.g. 1.2" className="mt-1" min="0" step="0.1" />
            </div>
          </div>

          {/* Dose / Unit / Batch */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Dose per Injection</Label>
              <Input type="number" value={doseAmount} onChange={e => setDoseAmount(e.target.value)} placeholder="e.g. 500" className="mt-1" min="0" />
            </div>
            <div>
              <Label>Dose Unit</Label>
              <Select value={doseUnit} onValueChange={setDoseUnit}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcg">mcg</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="IU">IU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batch # (optional)</Label>
              <Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="e.g. PSA-2026-001" className="mt-1" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={showPurity} onCheckedChange={setShowPurity} id="show-purity" />
                <Label htmlFor="show-purity" className="text-xs">Show Purity</Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Label Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Store 2-8°C, protect from light" className="mt-1 h-16" />
          </div>

          <Button onClick={handleAddLabel} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            Create Label
          </Button>

          {/* Customization */}
          <div className="border-t border-border pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Customization</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Color Theme
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(colorThemes) as LabelColorTheme[]).map(key => (
                    <button
                      key={key}
                      onClick={() => setColorTheme(key)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                        colorTheme === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {colorThemes[key].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Layout className="w-3.5 h-3.5" />
                  Label Size
                </Label>
                <div className="flex gap-2">
                  {(Object.keys(layoutSizes) as LabelLayout[]).map(key => (
                    <button
                      key={key}
                      onClick={() => setLayout(key)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                        layout === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {layoutSizes[key].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Labels */}
      {labels.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Labels ({labels.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setLabels([])}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button onClick={handlePrint} size="sm">
                  <Printer className="w-4 h-4 mr-1" />
                  Print All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={printRef} className="flex flex-wrap gap-4">
              {labels.map(label => (
                <div
                  key={label.id}
                  className={cn(
                    "border-2 rounded-xl overflow-hidden font-sans relative group w-full",
                    size.width,
                    size.textSize,
                    theme.border,
                    theme.bg,
                  )}
                >
                  {/* Header */}
                  <div className={cn(
                    "flex items-center justify-between px-3 py-2 border-b border-border",
                    theme.header,
                  )}>
                    <div className="flex items-center gap-2">
                      <img src="/logo-animated.png" className="w-5 h-5" alt="PSA" />
                      <span className={cn("font-bold text-xs tracking-wide", theme.accent)}>PEPTIDE SOUTH AFRICA</span>
                    </div>
                    <span className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase">Research Only</span>
                  </div>

                  {/* Body */}
                  <div className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-extrabold text-foreground mb-1 tracking-tight", layout === 'large' ? 'text-xl' : 'text-lg')}>
                          {label.peptideName}
                        </div>
                        {label.purity && label.showPurity && (
                          <span className={cn("inline-block px-2 py-0.5 rounded text-[9px] font-bold mb-2 border", theme.accentBg, theme.accent, theme.border)}>
                            {label.purity} PURITY
                          </span>
                        )}
                        <div className="space-y-0.5 text-muted-foreground">
                          <div className="flex justify-between"><span className="text-muted-foreground/70">COA Mass</span><span className="font-semibold text-foreground">{label.coaAmount} mg</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground/70">BAC Water</span><span className="font-semibold text-foreground">{label.bacWater} mL</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground/70">Conc.</span><span className="font-semibold text-foreground">{label.concentration} mg/mL</span></div>
                          <div className="flex justify-between border-t border-dashed border-border pt-1 mt-1">
                            <span className="text-muted-foreground/70">Dose</span>
                            <span className={cn("font-bold", theme.accent)}>{label.dosePerInjection} {label.doseUnit} → {label.units}u ({label.cc}cc)</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 shrink-0 text-center">
                        <QRCodeSVG
                          value={buildQrData(label)}
                          size={size.qrSize}
                          level="M"
                          bgColor="transparent"
                          fgColor="currentColor"
                          className="text-foreground"
                        />
                        <div className="text-[7px] text-muted-foreground mt-0.5">SCAN</div>
                      </div>
                    </div>
                    {label.notes && (
                      <div className={cn("mt-2 px-2 py-1 rounded text-[9px] text-muted-foreground border-l-2", theme.border, theme.accentBg)}>
                        {label.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={cn("flex justify-between items-center px-3 py-1.5 border-t border-border text-[9px] text-muted-foreground", theme.header)}>
                    <span>Recon: <strong className="text-foreground">{label.reconDate}</strong></span>
                    <span>Exp: <strong className="text-destructive">{label.expiryDate}</strong></span>
                    {label.batchNumber && <span>Batch: <strong className="text-foreground">{label.batchNumber}</strong></span>}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-8 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopyLabel(label)} className="p-1 rounded bg-muted hover:bg-accent transition-colors">
                      {copied === label.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleRemoveLabel(label.id)} className="p-1 rounded bg-muted hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
