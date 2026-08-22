import jsPDF from 'jspdf';
import type { BloodworkScanResult } from '@/components/bloodwork/BloodworkResults';

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function exportBloodworkProtocolPDF(result: BloodworkScanResult, filename = 'bloodwork-report.pdf') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('Peptide South Africa — Bloodwork Report', MARGIN, y);
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(
    `${result.scan_type === 'deep' ? 'Deep Decode' : 'Baseline Scan'} · ${result.biomarkers.length} extracted biomarkers`,
    MARGIN,
    y
  );
  y += 6;
  pdf.text(`Goals: ${result.goals.join(', ') || '—'}`, MARGIN, y);
  y += 8;
  pdf.setTextColor(0);

  // Biomarkers
  section(pdf, '01 — Biomarker Panel', () => y, (next) => (y = next));
  for (const bm of result.biomarkers) {
    ensure(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(bm.name, MARGIN, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${bm.value} ${bm.unit}`, PAGE_W - MARGIN - 50, y, { align: 'left' });
    pdf.text(bm.status.toUpperCase(), PAGE_W - MARGIN, y, { align: 'right' });
    y += 4;
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`Ref: ${bm.reference_range}`, MARGIN, y);
    pdf.setTextColor(0);
    y += 4;
  }

  // Insights
  if (result.insights.length) {
    section(pdf, '02 — Educational observations', () => y, (next) => (y = next));
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    result.insights.forEach((line, i) => {
      const text = `${i + 1}. ${line}`;
      const wrapped = pdf.splitTextToSize(text, CONTENT_W);
      ensure(wrapped.length * 5);
      pdf.text(wrapped, MARGIN, y);
      y += wrapped.length * 5 + 1;
    });
  }

  // Disclaimer
  pdf.addPage();
  y = MARGIN;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Disclaimer', MARGIN, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  wrap(
    pdf,
    'Medical disclaimer: This extraction is for educational and informational purposes only and may contain OCR or classification errors. It is not medical advice, diagnosis, treatment, a prescription, or a dosing guide. Your original laboratory report and its printed reference ranges remain the source of truth. Consult a qualified healthcare professional for interpretation and all treatment decisions.',
    () => y,
    (n) => (y = n)
  );
  y += 5;
  wrap(
    pdf,
    'Legal notice: This report is information only and does not guarantee accuracy, suitability, approval, legality, efficacy, compatibility, or safety. Do not start, stop, buy, or combine peptides, medicines, supplements, or diagnostic testing based on this report.',
    () => y,
    (n) => (y = n)
  );

  pdf.save(filename);
}

function section(pdf: jsPDF, title: string, getY: () => number, setY: (n: number) => void) {
  let y = getY();
  if (y + 12 > PAGE_H - MARGIN) {
    pdf.addPage();
    y = MARGIN;
  }
  y += 4;
  pdf.setDrawColor(180);
  pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, MARGIN, y);
  y += 6;
  setY(y);
}

function wrap(pdf: jsPDF, text: string, getY: () => number, setY: (n: number) => void) {
  let y = getY();
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(text, CONTENT_W);
  if (y + lines.length * 5 > PAGE_H - MARGIN) {
    pdf.addPage();
    y = MARGIN;
  }
  pdf.text(lines, MARGIN, y);
  y += lines.length * 5 + 1;
  setY(y);
}
