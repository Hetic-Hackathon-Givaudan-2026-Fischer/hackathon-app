// Client typé de notre API (ADR 0012) : seul endroit du front qui touche au réseau.
// Les chemins (`/api/v1/...`) passent par le proxy Vite vers l'API FastAPI.
import createClient from 'openapi-fetch';
import type { paths } from './schema';

const REQUEST_ID_HEADER = 'X-Request-ID';

export const api = createClient<paths>();

/** Erreur de notre API : `detail` vient d'`ErrorRead` ; statut 0 = injoignable. */
export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;

  constructor(status: number, detail: string, requestId: string | null) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

/** Toute erreur levée par un appel, ramenée à une `ApiError`. */
export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError(0, 'Erreur inattendue', null);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** `detail` d'`ErrorRead` (texte) ou d'une erreur de validation (liste). */
function detailOf(error: unknown, status: number): string {
  const detail = (error as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  return Array.isArray(detail) ? 'Paramètres invalides' : `Erreur ${status}`;
}

interface Outcome<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Données d'un appel `api.GET/POST`, ou `ApiError` : jamais de résultat ambigu. */
export async function unwrap<T>(call: Promise<Outcome<T>>): Promise<T> {
  let outcome: Outcome<T>;
  try {
    outcome = await call;
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError(0, 'API injoignable', null);
  }
  const { data, error, response } = outcome;
  if (response.ok && data !== undefined) return data;
  const requestId = response.headers.get(REQUEST_ID_HEADER);
  throw new ApiError(
    response.status,
    detailOf(error, response.status),
    requestId,
  );
}
