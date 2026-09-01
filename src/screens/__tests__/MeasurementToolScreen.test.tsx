import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MeasurementToolScreen } from '@/screens/MeasurementToolScreen';

const verifiedPreset = {
  id: 'verified-bpc',
  name: 'Verified BPC setup',
  peptideId: 'bpc-157',
  vialSize: '10',
  bacWater: '2',
  targetDose: '1',
  targetUnit: 'mg' as const,
  syringeType: 'u40' as const,
  vialUnitType: 'mg' as const,
  scheduleMode: 'twice-weekly' as const,
  scheduleDetails: 'Mon & Thu',
  barrelCapacityMl: '1',
  guidanceMode: 'beginner' as const,
  createdAt: '2026-08-28T00:00:00.000Z',
};

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) })) },
}));
vi.mock('@/services/storage', () => ({
  getCalculatorSettings: () => ({
    syringeType: 'u40',
    experienceLevel: 'beginner',
    lastVialSize: '',
    lastBacWater: '',
    lastTargetDose: '',
    lastSelectedPeptide: 'bpc-157',
    savedAt: '',
  }),
  getActiveStack: () => [],
  getDosagePresets: () => [verifiedPreset],
  saveCalculatorSettings: vi.fn(),
  saveDosagePreset: vi.fn(),
  deleteDosagePreset: vi.fn(),
}));

describe('MeasurementToolScreen', () => {
  beforeEach(() => localStorage.clear());

  it('restores a guided plan workflow and keeps user modes separate from the maths', async () => {
    render(<MeasurementToolScreen />);

    expect(screen.getByText('Dose & Reconstitution Calculator')).toBeInTheDocument();
    expect(screen.getByText('New to reconstitution? Start here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dose Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask PepSA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confessions' })).toBeInTheDocument();
    expect(screen.getByText('Select a compound or recorded plan')).toBeInTheDocument();
    expect(screen.getByText('Enter vial, diluent and dose values')).toBeInTheDocument();
    expect(screen.getByText('Record the schedule')).toBeInTheDocument();
    expect(screen.getByText('Match the physical syringe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Advanced/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Biohacker/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Verified BPC setup' }));

    expect(screen.getAllByText('8 units').length).toBeGreaterThan(0);
    expect(screen.getByText(/1 mg ÷ 5 mg\/mL = 0.2 mL × 40 units\/mL/)).toBeInTheDocument();
    expect(screen.getByText(/Mon & Thu/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Biohacker/i }));
    expect(screen.getAllByText('8 units').length).toBeGreaterThan(0);
    expect(screen.getByText('Performance goals never alter the amount or syringe position.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ask PepSA' }));
    expect(await screen.findByText('Ask PepSA')).toBeInTheDocument();
    expect(await screen.findByText('Straight answers. No science degree needed.')).toBeInTheDocument();
    expect(screen.getByText('Compound or health topic')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Is there a peptide for thyroid issues? I have Hashimoto’s.' })).toBeInTheDocument();
    expect(screen.getByText(/not a recommendation for you/i)).toBeInTheDocument();
  });

  it('warns when mg and mcg may have been mixed up', () => {
    render(<MeasurementToolScreen />);

    fireEvent.change(screen.getByLabelText('Total amount shown on vial or COA'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Prescribed or recorded dose'), { target: { value: '10' } });

    expect(screen.getAllByText(/larger than the total amount in the vial/i).length).toBeGreaterThan(0);
  });
});
