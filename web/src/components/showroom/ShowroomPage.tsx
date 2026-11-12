import { useCallback, useMemo } from 'react';
import type { ApiError } from '../../api/client';
import type { ShowroomRead } from '../../api/types';
import type { ScannedProduct } from '../../engine/experience';
import { useShowroom } from '../../hooks/useTrendsApi';
import { buildScanCard, fromShowroom } from '../../immersive/scanCard';
import { shelfStock } from '../../immersive/shelfStock';
import { formatDate } from '../../lib/format';
import { ImmersiveView } from '../immersive/ImmersiveView';

/**
 * Showroom client (ADR 0010) : la vue immersive seule, sans dashboard ni
 * rapport. Une seule route appelée : GET /showroom/{jeton}.
 */
export function ShowroomPage({ token }: { token: string | null }) {
  if (token === null) return <ShowroomMessage {...UNKNOWN_LINK} />;
  return <ShowroomLoader token={token} />;
}

function ShowroomLoader({ token }: { token: string }) {
  const showroom = useShowroom(token);
  if (showroom.error) return <ShowroomError error={showroom.error} />;
  if (!showroom.data) return <ShowroomMessage title="Ouverture du showroom…" />;
  return <ShowroomScene view={showroom.data} />;
}

function ShowroomScene({ view }: { view: ShowroomRead }) {
  const scanData = useMemo(() => fromShowroom(view), [view]);
  const stock = useMemo(() => shelfStock(scanData.trends), [scanData]);
  const describe = useCallback(
    (product: ScannedProduct) => buildScanCard(product, { data: scanData }),
    [scanData],
  );
  return (
    <ImmersiveView describe={describe} stock={stock}>
      <p className="pointer-events-none fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink/75 px-4 py-1.5 text-[12px] text-ivory backdrop-blur-sm">
        Showroom · {view.client_label} · lien valable jusqu'au{' '}
        {formatDate(view.expires_at)}
      </p>
    </ImmersiveView>
  );
}

interface Message {
  title: string;
  detail?: string;
}

const UNKNOWN_LINK: Message = {
  title: 'Lien inconnu',
  detail:
    'Vérifiez l’adresse reçue, ou demandez un nouveau lien à votre contact Givaudan.',
};

const ERROR_MESSAGES: Record<number, Message> = {
  404: UNKNOWN_LINK,
  410: {
    title: 'Lien expiré',
    detail:
      'Ce lien a expiré ou a été révoqué. Demandez un nouveau lien à votre contact Givaudan.',
  },
};

function ShowroomError({ error }: { error: ApiError }) {
  const message = ERROR_MESSAGES[error.status] ?? {
    title: 'Showroom indisponible',
    detail: 'Réessayez dans quelques instants.',
  };
  return <ShowroomMessage {...message} />;
}

function ShowroomMessage({ title, detail }: Message) {
  return (
    <main className="bg-plum-haze flex size-full flex-col items-center justify-center gap-3 p-8 text-center text-ivory">
      <p className="text-[0.78rem] font-medium tracking-[0.22em] text-ivory/78 uppercase">
        Givaudan Flavor Trends Experience
      </p>
      <h1 className="text-[clamp(1.4rem,2.6vw,2.2rem)] font-medium">{title}</h1>
      {detail && (
        <p className="max-w-md text-[0.95rem] text-ivory/88">{detail}</p>
      )}
    </main>
  );
}
