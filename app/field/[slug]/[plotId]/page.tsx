import { FieldPlotSubmitClient } from '@/components/field/FieldPlotSubmitClient';

export const metadata = { title: 'Submeter fotos · Field' };

export default async function FieldPlotPage({
  params,
}: {
  params: Promise<{ slug: string; plotId: string }>;
}) {
  const { slug, plotId } = await params;
  return <FieldPlotSubmitClient slug={slug} plotId={plotId} />;
}
