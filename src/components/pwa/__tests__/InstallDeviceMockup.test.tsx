import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstallDeviceMockup } from '@/components/pwa/InstallDeviceMockup';

describe('InstallDeviceMockup', () => {
  it('shows the Safari Home Screen flow for iOS', () => {
    render(<InstallDeviceMockup device="ios" />);

    expect(screen.getByLabelText('iPhone installation preview')).toBeInTheDocument();
    expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
    expect(screen.getByText('Safari · Add to Home Screen')).toBeInTheDocument();
  });

  it('shows the install prompt for Android', () => {
    render(<InstallDeviceMockup device="android" />);

    expect(screen.getByLabelText('Android installation preview')).toBeInTheDocument();
    expect(screen.getByText('Install Peptide SA?')).toBeInTheDocument();
    expect(screen.getByText('Chrome · Install app')).toBeInTheDocument();
  });
});
