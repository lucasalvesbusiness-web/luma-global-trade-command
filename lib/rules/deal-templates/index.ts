import { z } from 'zod';

import type { DealTemplate } from '@/lib/types/enums';

import { oneOffScopeSchema } from './one-off';
import { recurringScopeSchema } from './recurring';
import { productSupplyScopeSchema } from './product-supply';

export { oneOffScopeSchema, recurringScopeSchema, productSupplyScopeSchema };

export const dealScopeSchemaByTemplate: Record<DealTemplate, z.ZodTypeAny> = {
  ONE_OFF: oneOffScopeSchema,
  RECURRING: recurringScopeSchema,
  PRODUCT_SUPPLY: productSupplyScopeSchema,
};

export function parseScope(template: DealTemplate, payload: unknown) {
  return dealScopeSchemaByTemplate[template].parse(payload);
}
