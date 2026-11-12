import { useEffect } from 'react';

/**
 * Raccourci clavier global : `handler` sur la touche `key`, seulement si la
 * vue est active (un écran masqué ne doit pas réagir au clavier).
 */
export function useWindowKey(
  key: string,
  handler: (() => void) | undefined,
  active = true,
) {
  useEffect(() => {
    if (!handler || !active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, active]);
}
