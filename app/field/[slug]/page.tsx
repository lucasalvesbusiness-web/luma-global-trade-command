import { FieldDashboardClient } from '@/components/field/FieldDashboardClient';

export const metadata = { title: 'Minha fazenda · Field' };

export default async function FieldDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FieldDashboardClient slug={slug} />;
}
