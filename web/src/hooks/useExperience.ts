import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { ensureBrandFont } from '../brand';
import {
  createExperience,
  type Experience,
  type ScanCard,
  type ScannedProduct,
  type ShelfStock,
} from '../engine/experience';

export type DescribeProduct = (product: ScannedProduct) => ScanCard;

export interface ExperienceState {
  /** Visite en cours (souris verrouillée). */
  playing: boolean;
  /** Tablette levée : fiche de l'arôme en lecture. */
  reading: boolean;
  /** Démarre / reprend la visite 3D (verrouille la souris). */
  enter: () => void;
  /** Quitte la visite 3D (déverrouille la souris). */
  exit: () => void;
}

/**
 * Monte le moteur 3D dans `containerRef` une fois la police chargée (les
 * textures canvas en dépendent), et le libère au démontage. `describe` donne
 * la fiche de l'arôme scanné : toujours la dernière version, même si les
 * données arrivent après la création du moteur. `stock` pose ces arômes
 * sur les produits du type qui leur correspond.
 */
export function useExperience(
  containerRef: RefObject<HTMLElement | null>,
  describe: DescribeProduct,
  stock: ShelfStock,
): ExperienceState {
  const [playing, setPlaying] = useState(false);
  const [reading, setReading] = useState(false);
  const experienceRef = useRef<Experience | null>(null);
  const describeRef = useRef(describe);
  const stockRef = useRef(stock);

  // Nouvelles données : la fiche déjà affichée (ex. « Chargement… ») se met à jour
  useEffect(() => {
    describeRef.current = describe;
    experienceRef.current?.refreshCard();
  }, [describe]);

  useEffect(() => {
    stockRef.current = stock;
    experienceRef.current?.stock(stock);
  }, [stock]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    void ensureBrandFont().then(() => {
      if (cancelled) return;
      const experience = createExperience(container, {
        onPlayingChange: setPlaying,
        onReadingChange: setReading,
        describeProduct: (product) => describeRef.current(product),
      });
      experience.stock(stockRef.current);
      experienceRef.current = experience;
    });
    return () => {
      cancelled = true;
      experienceRef.current?.dispose();
      experienceRef.current = null;
    };
  }, [containerRef]);

  const enter = useCallback(() => {
    experienceRef.current?.enter();
  }, []);

  const exit = useCallback(() => {
    experienceRef.current?.exit();
  }, []);

  return { playing, reading, enter, exit };
}
