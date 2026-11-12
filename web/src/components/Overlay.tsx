import { TabShortcut } from './TabShortcut';

interface OverlayProps {
  playing: boolean;
  /** Retour au dashboard ; absent pour un client du showroom (aucun accès). */
  onBack?: () => void;
}

/**
 * Invite de reprise et bouton de retour au dashboard.
 * Les éléments restent montés (masqués par l'opacité) : le navigateur
 * n'annule ainsi jamais `requestPointerLock()` lors du clic.
 */
export function Overlay({ playing, onBack }: OverlayProps) {
  return (
    <>
      <PausePrompt visible={!playing} withBack={Boolean(onBack)} />
      {onBack && (
        <TabShortcut
          label="Retour au dashboard"
          title="Appuyez sur Tab pour revenir au dashboard"
          onClick={onBack}
        />
      )}
    </>
  );
}

/** pointer-events-none : le clic sur le canvas relance la visite. */
function PausePrompt({
  visible,
  withBack,
}: {
  visible: boolean;
  withBack: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-ivory transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="rounded border border-ivory/72 bg-ink/70 px-6 pt-[0.4rem] pb-[0.5rem] text-sm tracking-[0.01em] backdrop-blur-sm">
        Cliquez pour reprendre la visite 3D
        {withBack ? ' · ou appuyez sur Tab pour le dashboard' : ''}
      </p>
    </div>
  );
}
