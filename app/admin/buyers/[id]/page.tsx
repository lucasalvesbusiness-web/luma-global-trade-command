import { AdminBuyerDetailClient } from '@/components/admin/AdminBuyerDetailClient';

export const metadata = { title: 'Comprador · Admin' };

export default async function AdminBuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminBuyerDetailClient id={id} />;
}
