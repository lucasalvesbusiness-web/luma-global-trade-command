/**
 * Mapeamento produto → fotos + vídeo. Assets servidos por /public/media/.
 *
 * Curadoria pela Luma — só entram aqui imagens aprovadas pela operação.
 * Para um eventual pipeline de aprovação formal, este arquivo vira fonte
 * inicial de `FieldPhoto.approvedForBuyerView = true`.
 */

export type ProductMedia = {
  photos: string[]; // caminhos em /public/media/photos/
  video?: string; // caminho em /public/media/videos/
  altBasePtBr: string;
  altBaseEn: string;
};

const BASE_PHOTOS = '/media/photos';
const BASE_VIDEOS = '/media/videos';

export const productMedia: Record<string, ProductMedia> = {
  mango: {
    photos: [
      `${BASE_PHOTOS}/manga-tree-1.jpg`,
      `${BASE_PHOTOS}/manga-harvest.jpg`,
      `${BASE_PHOTOS}/manga-packing.jpg`,
    ],
    altBasePtBr: 'Manga do Vale do São Francisco',
    altBaseEn: 'Mango from the São Francisco Valley',
  },
  grape: {
    photos: [
      `${BASE_PHOTOS}/grape-harvest-1.jpg`,
      `${BASE_PHOTOS}/grape-harvest-2.jpg`,
    ],
    altBasePtBr: 'Uva de mesa do Vale',
    altBaseEn: 'Vale table grape',
  },
  banana: {
    photos: [],
    video: `${BASE_VIDEOS}/banana-field.mp4`,
    altBasePtBr: 'Banana do Vale',
    altBaseEn: 'Vale banana',
  },
  'fruit-pulp': {
    photos: [
      `${BASE_PHOTOS}/guava-1.jpg`,
      `${BASE_PHOTOS}/guava-2.jpg`,
      `${BASE_PHOTOS}/manga-harvest.jpg`,
    ],
    altBasePtBr: 'Polpa de fruta Luma',
    altBaseEn: 'Luma fruit pulp',
  },
  acai: {
    photos: [],
    altBasePtBr: 'Açaí congelado Luma',
    altBaseEn: 'Luma frozen açaí',
  },
  'cassava-flour': {
    photos: [`${BASE_PHOTOS}/cassava-root.jpg`],
    altBasePtBr: 'Raiz de mandioca — matéria-prima da farinha',
    altBaseEn: 'Cassava root — source of flour',
  },
  'cassava-starch': {
    photos: [`${BASE_PHOTOS}/cassava-root.jpg`],
    altBasePtBr: 'Raiz de mandioca — matéria-prima do amido',
    altBaseEn: 'Cassava root — source of starch',
  },
};

/** Hero shots por origem — reforçam a realidade operacional do Vale. */
export const originHeroMedia: Record<string, string[]> = {
  'fazenda-luma-vale-norte': [
    `${BASE_PHOTOS}/manga-tree-1.jpg`,
    `${BASE_PHOTOS}/melon-1.jpg`,
  ],
  'fazenda-luma-rio-claro': [
    `${BASE_PHOTOS}/manga-tree-2.jpg`,
    `${BASE_PHOTOS}/papaya-green.jpg`,
  ],
  'parceiro-sertao-verde': [
    `${BASE_PHOTOS}/melon-field.jpg`,
    `${BASE_PHOTOS}/papaya-ripe.jpg`,
  ],
  'unidade-agroindustrial-luma': [
    `${BASE_PHOTOS}/manga-packing.jpg`,
    `${BASE_PHOTOS}/cassava-root.jpg`,
  ],
};

export function getProductMedia(slug: string): ProductMedia | undefined {
  return productMedia[slug];
}
