import { describe, it, expect } from 'vitest';

/**
 * Smoke/utility test: format helpers used across the app.
 */
function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

describe('format utilities', () => {
  it('formatDate returns - for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('formatDate formats ISO string', () => {
    const s = '2025-02-06T12:00:00.000Z';
    expect(formatDate(s)).toMatch(/\d/);
  });

  it('formatDateTime returns - for undefined', () => {
    expect(formatDateTime(undefined)).toBe('-');
  });

  it('formatDateTime formats ISO string', () => {
    const s = '2025-02-06T12:00:00.000Z';
    expect(formatDateTime(s)).toMatch(/\d/);
  });
});
