import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DoseCalculatorLaunchCard } from '@/components/home/DoseCalculatorLaunchCard';

describe('DoseCalculatorLaunchCard', () => {
  it('keeps the calculator prominent and routes both primary actions', () => {
    const onOpenCalculator = vi.fn();
    const onAskPepSA = vi.fn();

    render(
      <DoseCalculatorLaunchCard
        onOpenCalculator={onOpenCalculator}
        onAskPepSA={onAskPepSA}
      />,
    );

    expect(screen.getByText('Dose & Reconstitution Calculator')).toBeInTheDocument();
    expect(screen.getByText(/beginner walkthrough or advanced tracking view/i)).toBeInTheDocument();
    expect(screen.getByText(/does not choose a compound, personal dose, diluent or treatment plan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open calculator/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ask PepSA first/i }));

    expect(onOpenCalculator).toHaveBeenCalledTimes(1);
    expect(onAskPepSA).toHaveBeenCalledTimes(1);
  });
});
