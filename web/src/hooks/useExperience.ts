import { useEffect, useState, type RefObject } from 'react';
import { ensureBrandFont } from '../brand';
import { createExperience, type Experience } from '../engine/experience';

export interface ExperienceState {
  /** Visite en cours (souris verrouillée). */
  playing: boolean;
  /** Tablette levée : fiche de la rubrique en lecture. */
  reading: boolean;
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let experience: Experience | null = null;
    let cancelled = false;
    void ensureBrandFont().then(() => {
      if (cancelled) return;
      experience = createExperience(container, {
        onPlayingChange: setPlaying,
        onReadingChange: setReading,
      });
    });
    return () => {
      cancelled = true;
      experience?.dispose();
    };
  }, [containerRef]);

  return { playing, reading };
}
