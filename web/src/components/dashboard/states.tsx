// États de chargement, d'erreur et vide, communs aux blocs du dashboard.
import type { ReactNode } from 'react';
import type { ApiError } from '../../api/client';
import { BUTTON_SECONDARY } from './ui';

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-8 text-[13px] text-[#71717A]"
    >
      <span className="size-3 animate-spin rounded-full border-2 border-[#008075] border-t-transparent" />
      {label}
    </div>
  );
}

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 p-8 text-center text-[13px]"
    >
      <p className="font-medium text-[#B91C1C]">{error.message}</p>
      {error.requestId && (
        <p className="text-[12px] text-[#71717A]">
          Référence support : <code>{error.requestId}</code>
        </p>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className={BUTTON_SECONDARY}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="p-8 text-center text-[13px] text-[#71717A]">{children}</p>
  );
}
