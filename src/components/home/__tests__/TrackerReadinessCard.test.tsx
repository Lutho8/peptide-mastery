import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrackerReadinessCard } from '@/components/home/TrackerReadinessCard';

function renderCard(overrides: Partial<React.ComponentProps<typeof TrackerReadinessCard>> = {}) {
  const props: React.ComponentProps<typeof TrackerReadinessCard> = {
    recordedItems: 0,
    entryCount: 0,
    enabledReminders: 0,
    inventoryItems: 0,
    onWorkspace: vi.fn(),
    onDailyLog: vi.fn(),
    onReminders: vi.fn(),
    onInventory: vi.fn(),
    ...overrides,
  };
  render(<TrackerReadinessCard {...props} />);
  return props;
}

describe('first-week tracker readiness', () => {
  it('gives a new user one clear next action', () => {
    const props = renderCard();

    expect(screen.getByText('0/4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue setup: record an existing plan/i }));
    expect(props.onWorkspace).toHaveBeenCalledOnce();
  });

  it('recognises returning users whose core cross-device setup is complete', () => {
    renderCard({ recordedItems: 2, entryCount: 12, enabledReminders: 1, inventoryItems: 3 });

    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByText(/your core tracker is ready/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue setup/i })).not.toBeInTheDocument();
  });
});
