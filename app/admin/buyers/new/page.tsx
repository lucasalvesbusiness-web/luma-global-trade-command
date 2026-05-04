import { db } from '@/lib/db';

import { AdminBuyerCreateClient } from '@/components/admin/AdminBuyerCreateClient';

export const metadata = { title: 'Novo comprador · Admin' };

export default async function AdminBuyerCreatePage() {
  const countries = await db.country.findMany({
    orderBy: { name: 'asc' },
    select: { iso2: true, name: true },
  });
  return <AdminBuyerCreateClient countries={countries} />;
}
