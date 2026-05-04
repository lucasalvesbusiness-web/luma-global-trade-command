import { db } from '@/lib/db';

export type BuyerSignupInput = {
  email: string;
  name: string;
  companyLegalName: string;
  companyType:
    | 'IMPORTER'
    | 'DISTRIBUTOR'
    | 'WHOLESALER'
    | 'RETAIL'
    | 'INDUSTRY'
    | 'TRADER';
  countryIso2: string;
  taxId?: string;
  contactPhone?: string;
};

export type BuyerSignupResult =
  | { ok: true; userId: string; companyId: string; alreadyExisted: boolean }
  | {
      ok: false;
      reason: 'EMAIL_TAKEN_BY_STAFF' | 'EMAIL_TAKEN_BY_FIELD_OPERATOR' | 'INVALID_COUNTRY';
    };

export async function signupBuyer(
  input: BuyerSignupInput,
): Promise<BuyerSignupResult> {
  const country = await db.country.findUnique({
    where: { iso2: input.countryIso2.toUpperCase() },
  });
  if (!country) return { ok: false, reason: 'INVALID_COUNTRY' };

  const existing = await db.user.findUnique({
    where: { email: input.email },
    include: { staff: true, fieldOperator: true, buyer: { include: { company: true } } },
  });

  if (existing?.staff) {
    return { ok: false, reason: 'EMAIL_TAKEN_BY_STAFF' };
  }
  if (existing?.fieldOperator) {
    return { ok: false, reason: 'EMAIL_TAKEN_BY_FIELD_OPERATOR' };
  }

  if (existing?.buyer) {
    return {
      ok: true,
      userId: existing.id,
      companyId: existing.buyer.companyId,
      alreadyExisted: true,
    };
  }

  const result = await db.$transaction(async (tx) => {
    const user =
      existing ??
      (await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: 'BUYER',
        },
      }));

    if (existing && existing.role !== 'BUYER') {
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'BUYER', name: existing.name ?? input.name },
      });
    }

    const company = await tx.buyerCompany.create({
      data: {
        legalName: input.companyLegalName,
        type: input.companyType,
        countryIso2: input.countryIso2.toUpperCase(),
        taxId: input.taxId,
        contactPhone: input.contactPhone,
        approvalStatus: 'PENDING',
      },
    });

    await tx.buyer.create({
      data: { userId: user.id, companyId: company.id },
    });

    return { userId: user.id, companyId: company.id };
  });

  return { ok: true, ...result, alreadyExisted: false };
}
