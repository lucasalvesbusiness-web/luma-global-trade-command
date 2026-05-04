/**
 * Vercel Blob storage helper para fotos de campo.
 *
 * Em prod: usa o store padrão do projeto (BLOB_READ_WRITE_TOKEN injetado pelo Vercel).
 * Em dev: precisa setar BLOB_READ_WRITE_TOKEN no .env (gere em vercel.com/dashboard
 * → Storage → Blob → .env.local snippet) ou desativar uploads localmente.
 *
 * Acesso: Vercel Blob `public` significa CDN-readable mas paths são tornados
 * imprevisíveis via `addRandomSuffix: true`. A camada de exibição ainda gateia
 * por `FieldPhoto.approvedForBuyerView` antes de servir o URL ao buyer.
 */

import { put, del, type PutBlobResult } from '@vercel/blob';

export const FIELD_PHOTO_PATH_PREFIX = 'field-photos';

export type UploadFieldPhotoInput = {
  originSlug: string;
  fieldPlotId: string;
  filename: string;
  body: Blob | ArrayBuffer | Buffer | ReadableStream;
  contentType: string;
};

export async function uploadFieldPhoto(
  input: UploadFieldPhotoInput,
): Promise<PutBlobResult> {
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${FIELD_PHOTO_PATH_PREFIX}/${input.originSlug}/${input.fieldPlotId}/${safeName}`;
  return put(path, input.body, {
    access: 'public',
    contentType: input.contentType,
    addRandomSuffix: true,
  });
}

export async function deleteFieldPhoto(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    console.warn('[blob] falha ao deletar', url, err);
  }
}

/**
 * Devolve a URL exibível de uma foto. Hoje: passa direto, já que os paths são
 * unguessable + a aprovação por admin é o gate efetivo. Quando migrarmos para
 * Vercel Blob privado (paid), substituir por getDownloadUrl() com expiração.
 */
export function getDisplayUrl(publicUrl: string): string {
  return publicUrl;
}
