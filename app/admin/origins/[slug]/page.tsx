import { AdminOriginDetailClient } from '@/components/admin/AdminOriginDetailClient';

export const metadata = { title: 'Fazenda · Admin' };

export default async function AdminOriginDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminOriginDetailClient slug={slug} />;
}
