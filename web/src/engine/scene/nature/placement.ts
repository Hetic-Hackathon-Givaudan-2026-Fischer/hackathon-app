// Zones interdites à la végétation : le magasin et ses abords.
import { coversMarket } from '../market';

/** Vrai si le point tombe sur le magasin ou trop près (marge large). */
export function onMarket(x: number, z: number): boolean {
  return coversMarket(x, z, 2.8);
}

/** Vrai si le point est sous le plancher du magasin (marge serrée). */
export function underFloor(x: number, z: number): boolean {
  return coversMarket(x, z, 1.15);
}
