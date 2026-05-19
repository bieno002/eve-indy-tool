import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SdeSetupScreen } from './SdeSetupScreen.js';

function makeEveIndy(overrides: Partial<Window['eveIndy']> = {}): Window['eveIndy'] {
  return {
    sdeStatus: vi.fn(),
    sdeDownload: vi.fn().mockResolvedValue(undefined),
    onSdeProgress: vi.fn().mockReturnValue(vi.fn()),
    computeBuildables: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal('eveIndy', makeEveIndy());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SdeSetupScreen', () => {
  it('renders the download button', () => {
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /download sde/i })).toBeInTheDocument();
  });

  it('shows explanatory text about the SDE', () => {
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    expect(screen.getByText(/static data export/i)).toBeInTheDocument();
  });

  it('calls sdeDownload when button is clicked', async () => {
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /download sde/i }));
    await waitFor(() => expect(window.eveIndy.sdeDownload).toHaveBeenCalledOnce());
  });

  it('disables button while downloading', async () => {
    vi.stubGlobal('eveIndy', makeEveIndy({
      sdeDownload: vi.fn().mockReturnValue(new Promise(() => {})),
    }));
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /download sde/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled(),
    );
  });

  it('subscribes to onSdeProgress when downloading starts', async () => {
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(window.eveIndy.onSdeProgress).toHaveBeenCalled());
  });

  it('calls onComplete when done progress event arrives', async () => {
    const onComplete = vi.fn();
    let progressCallback: ((d: { percent: number; done: boolean }) => void) | undefined;
    vi.stubGlobal('eveIndy', makeEveIndy({
      onSdeProgress: vi.fn((cb) => {
        progressCallback = cb;
        return vi.fn();
      }),
    }));
    render(<SdeSetupScreen onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(progressCallback).toBeDefined());
    progressCallback!({ percent: 100, done: true });
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  });

  it('shows error message when progress event carries an error', async () => {
    let progressCallback: ((d: { percent: number; done: boolean; error?: string }) => void) | undefined;
    vi.stubGlobal('eveIndy', makeEveIndy({
      onSdeProgress: vi.fn((cb) => {
        progressCallback = cb;
        return vi.fn();
      }),
    }));
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(progressCallback).toBeDefined());
    progressCallback!({ percent: 0, done: true, error: 'network failure' });
    await waitFor(() => expect(screen.getByText(/network failure/i)).toBeInTheDocument());
  });

  it('shows retry button after a download error', async () => {
    let progressCallback: ((d: { percent: number; done: boolean; error?: string }) => void) | undefined;
    vi.stubGlobal('eveIndy', makeEveIndy({
      onSdeProgress: vi.fn((cb) => {
        progressCallback = cb;
        return vi.fn();
      }),
    }));
    render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(progressCallback).toBeDefined());
    progressCallback!({ percent: 0, done: true, error: 'network failure' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument(),
    );
  });

  it('unsubscribes from onSdeProgress on unmount', async () => {
    const unsub = vi.fn();
    vi.stubGlobal('eveIndy', makeEveIndy({
      onSdeProgress: vi.fn().mockReturnValue(unsub),
    }));
    const { unmount } = render(<SdeSetupScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(window.eveIndy.onSdeProgress).toHaveBeenCalled());
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
