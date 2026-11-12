import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { isAbortError, toApiError, type ApiError } from '../api/client';

type Loader<T> = (signal: AbortSignal) => Promise<T>;

/** Une requête : `key` identifie les données (une nouvelle clé relance). */
export interface ApiRequest<T> {
  key: string;
  load: Loader<T>;
}

interface Settled<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

export interface Resource<T> {
  /** Dernières données reçues, gardées pendant le chargement suivant. */
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Charge une ressource de l'API ; `null` : rien à charger. La requête
 * précédente est annulée dès que la clé change ou que le composant disparaît.
 */
export function useApiResource<T>(request: ApiRequest<T> | null): Resource<T> {
  const [settled, setSettled] = useState<Settled<T>>();
  const [attempt, setAttempt] = useState(0);
  const runLoad = useEffectEvent((signal: AbortSignal) =>
    request?.load(signal),
  );
  const key = request ? `${request.key}#${attempt}` : null;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    runLoad(controller.signal)?.then(
      // Garde : un chargeur qui ignorerait le signal n'écrase pas la clé suivante
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setSettled({ key, error: toApiError(error) });
      },
    );
    return () => controller.abort();
  }, [key]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const current = settled?.key === key;
  return {
    data: settled?.data,
    error: current ? settled?.error : undefined,
    loading: key !== null && !current,
    reload,
  };
}
