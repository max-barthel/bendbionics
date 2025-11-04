import { getTendonColor, getTendonColorClasses } from '@/utils/tendonColors';
import { describe, expect, it } from 'vitest';

describe('tendonColors', () => {
  describe('getTendonColor', () => {
    it('returns correct color for valid tendon ID', () => {
      expect(getTendonColor('1')).toBe('#ef4444'); // Red
      expect(getTendonColor('2')).toBe('#3b82f6'); // Blue
      expect(getTendonColor('3')).toBe('#10b981'); // Emerald
      expect(getTendonColor('4')).toBe('#f59e0b'); // Amber
    });

    it('handles invalid tendon ID', () => {
      expect(getTendonColor('invalid')).toBe('#6b7280'); // Gray fallback
    });

    it('handles large tendon ID', () => {
      expect(getTendonColor('100')).toBe('#f59e0b'); // Cycles through colors
    });

    it('cycles through colors for large indices', () => {
      expect(getTendonColor('13')).toBe('#ef4444'); // Back to red (13 % 12 = 1, but 0-based)
      expect(getTendonColor('14')).toBe('#3b82f6'); // Blue
      expect(getTendonColor('15')).toBe('#10b981'); // Emerald
    });
  });

  describe('getTendonColorClasses', () => {
    it('returns correct Tailwind classes for valid tendon ID', () => {
      const classes1 = getTendonColorClasses('1');
      expect(classes1).toEqual({
        bg: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-600',
      });

      const classes2 = getTendonColorClasses('2');
      expect(classes2).toEqual({
        bg: 'bg-blue-500',
        border: 'border-blue-500',
        text: 'text-blue-600',
      });
    });

    it('handles invalid tendon ID', () => {
      const classes = getTendonColorClasses('invalid');
      expect(classes).toEqual({
        bg: 'bg-gray-400',
        border: 'border-gray-400',
        text: 'text-gray-600',
      });
    });

    it('cycles through color classes for large indices', () => {
      const classes13 = getTendonColorClasses('13');
      expect(classes13).toEqual({
        bg: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-600',
      });
    });

    it('returns all color variants', () => {
      const classes = getTendonColorClasses('1');
      expect(classes).toHaveProperty('bg');
      expect(classes).toHaveProperty('border');
      expect(classes).toHaveProperty('text');
    });
  });
});
