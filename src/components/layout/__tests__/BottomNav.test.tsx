import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from '@/components/layout/BottomNav';

describe('BottomNav', () => {
  it('exposes Ask PepSA as the centre dashboard action', () => {
    const onAskPepSA = vi.fn();
    const onTabChange = vi.fn();

    render(
      <BottomNav
        activeTab="home"
        activeMeasurementSection="measure"
        onAskPepSA={onAskPepSA}
        onTabChange={onTabChange}
      />,
    );

    const labels = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    expect(labels).toEqual(['Home', 'Workspace', 'Ask PepSA', 'Daily Log', 'Progress']);

    fireEvent.click(screen.getByRole('button', { name: 'Ask PepSA' }));
    expect(onAskPepSA).toHaveBeenCalledOnce();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('marks Ask PepSA active only when its assistant section is open', () => {
    const { rerender } = render(
      <BottomNav
        activeTab="measurement"
        activeMeasurementSection="ask"
        onAskPepSA={vi.fn()}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ask PepSA' })).toHaveAttribute('aria-current', 'page');

    rerender(
      <BottomNav
        activeTab="measurement"
        activeMeasurementSection="measure"
        onAskPepSA={vi.fn()}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ask PepSA' })).not.toHaveAttribute('aria-current');
  });
});
