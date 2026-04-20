import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('p-2', false && 'hidden', 'text-luma-ink')).toBe('p-2 text-luma-ink');
  });

  it('lets later tailwind classes win over earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
