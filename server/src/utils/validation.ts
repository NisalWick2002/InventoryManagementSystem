import { z } from 'zod';

export const UNIT_VALUES = [
  'kg',
  'g',
  'l',
  'ml',
  'units',
  'pcs',
  'pack',
  'box',
] as const;

export const unitSchema = z.enum(UNIT_VALUES);

export const skuSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[A-Za-z0-9_-]+$/, 'SKU must be alphanumeric with - or _');

export const nameSchema = z.string().min(2).max(120);

export const optionalNoteSchema = z.string().max(500).optional();
