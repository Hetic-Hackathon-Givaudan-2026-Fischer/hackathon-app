import { useState } from 'react';
import { toApiError, type ApiError } from '../api/client';

export type Submission<T> =
  | { state: 'idle' | 'sending' }
  | { state: 'done'; result: T }
  | { state: 'failed'; error: ApiError };

/** Envoi d'un formulaire vers l'API : état idle → sending → done | failed. */
export function useSubmission<A extends unknown[], T>(
  send: (...args: A) => Promise<T>,
) {
  const [submission, setSubmission] = useState<Submission<T>>({
    state: 'idle',
  });

  /** Rend le résultat, ou `undefined` en cas d'échec (déjà dans `submission`). */
  async function submit(...args: A): Promise<T | undefined> {
    setSubmission({ state: 'sending' });
    try {
      const result = await send(...args);
      setSubmission({ state: 'done', result });
      return result;
    } catch (error) {
      setSubmission({ state: 'failed', error: toApiError(error) });
      return undefined;
    }
  }

  return { submission, submit };
}
