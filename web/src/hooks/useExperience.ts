import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { ensureBrandFont } from '../brand';
import { createExperience, type Experience } from '../engine/experience';

export interface ExperienceState {
  /** Visite en cours (souris verrouillée). */
  playing: boolean;
  /** Tablette levée : fiche de la rubrique en lecture. */
  reading: boolean;
  /** Démarre / reprend la visite 3D (verrouille la souris). */
  enter: () => void;
  /** Quitte la visite 3D (déverrouille la souris). */
  exit: () => void;
}

/**
 * Monte le moteur 3D dans `containerRef` une fois la police chargée (les
 * textures canvas en dépendent), et le libère au démontage.
 */
export function useExperience(
  containerRef: RefObject<HTMLElement | null>,
): ExperienceState {
  const [playing, setPlaying] = useState(false);
  const [reading, setReading] = useState(false);
  const experienceRef = useRef<Experience | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    void ensureBrandFont().then(() => {
      if (cancelled) return;
      experienceRef.current = createExperience(container, {
        onPlayingChange: setPlaying,
        onReadingChange: setReading,
      });
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
