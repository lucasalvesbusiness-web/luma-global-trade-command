import * as THREE from 'three';

import type { LatLng } from '@/lib/canvas/types';

/**
 * Converte latitude/longitude (graus) para um ponto 3D na superfície de uma
 * esfera de raio `radius`, com o mesmo sistema de coordenadas usado pelo
 * <Globe /> (eixo Y = norte; longitude 0 olha para +Z).
 */
export function latLngToVector3(
  { lat, lng }: LatLng,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Retorna o ângulo (em radianos) de auto-rotação da câmera para centralizar
 * uma dada longitude. Usado para alinhar o globo ao país selecionado antes
 * da transição para o Brasil.
 */
export function longitudeToYaw(lng: number): number {
  return -lng * (Math.PI / 180);
}
