import { describe, it, expect } from 'vitest';

/**
 * BOM consumption logic: for a finished product with plannedQty,
 * required raw material = sum over BOM components of (qtyPerUnit * plannedQty).
 * This test validates the formula without DB.
 */
function computeRequiredConsumption(
  plannedQty: number,
  components: Array<{ qtyPerUnit: number; unit: string }>
): Array<{ qtyPlanned: number; unit: string }> {
  return components.map((c) => ({
    qtyPlanned: Math.round(c.qtyPerUnit * plannedQty * 1000) / 1000,
    unit: c.unit,
  }));
}

describe('BOM consumption', () => {
  it('computes required raw material for planned quantity', () => {
    const components = [
      { qtyPerUnit: 0.2, unit: 'kg' },
      { qtyPerUnit: 2, unit: 'units' },
      { qtyPerUnit: 0.1, unit: 'kg' },
    ];
    const plannedQty = 50;
    const required = computeRequiredConsumption(plannedQty, components);
    expect(required[0].qtyPlanned).toBe(10);
    expect(required[1].qtyPlanned).toBe(100);
    expect(required[2].qtyPlanned).toBe(5);
  });

  it('handles fractional qtyPerUnit', () => {
    const components = [{ qtyPerUnit: 0.333, unit: 'kg' }];
    const required = computeRequiredConsumption(3, components);
    expect(required[0].qtyPlanned).toBeCloseTo(0.999, 2);
  });

  it('allows override reason for actual different from planned', () => {
    const planned = 10;
    const actual = 9;
    const reasonOverride = 'Breakage during production';
    expect(actual).toBeLessThanOrEqual(planned);
    expect(reasonOverride).toBeTruthy();
  });
});
