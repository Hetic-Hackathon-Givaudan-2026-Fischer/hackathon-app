const MOVE_HELP =
  'ZQSD / WASD pour marcher · souris pour regarder · clic pour scanner (moins de 3 m) · Échap pour sortir';

interface OverlayProps {
  playing: boolean;
  /** Visite déjà commencée une fois : l'accueil laisse place à l'invite de reprise. */
  started: boolean;
  onStart: () => void;
  /** Retour au dashboard ; absent pour un client du showroom (aucun accès). */
  onBack?: () => void;
}

/** Halos prune décoratifs, en coin haut-droit et bas-gauche. */
function Glows() {
  return (
    <>
      <span
        aria-hidden
        className="bg-plum-glow-top pointer-events-none absolute -top-[12vmax] -right-[8vmax] h-[46vmax] w-[62vmax] -rotate-18 rounded-full blur-[2px]"
      />
      <span
        aria-hidden
        className="bg-plum-glow-bottom pointer-events-none absolute -bottom-[10vmax] -left-[12vmax] h-[36vmax] w-[48vmax] rotate-12 rounded-full blur-[2px]"
      />
    </>
  );
}

/**
 * Accueil de la visite, invite de reprise et bouton de retour au dashboard.
 * Les éléments restent montés (masqués par l'opacité) : le navigateur
 * n'annule ainsi jamais `requestPointerLock()` lors du clic.
 */
export function Overlay({ playing, started, onStart, onBack }: OverlayProps) {
  return (
    <>
      <Welcome
        visible={!started && !playing}
        onStart={onStart}
        onBack={onBack}
      />
      <PausePrompt visible={started && !playing} withBack={Boolean(onBack)} />
      {onBack && <BackButton visible={started} onBack={onBack} />}
    </>
  );
}

function fade(visible: boolean): string {
  return visible
    ? 'pointer-events-auto opacity-100'
    : 'pointer-events-none opacity-0';
}

interface WelcomeProps {
  visible: boolean;
  onStart: () => void;
  onBack?: () => void;
}

function Welcome({ visible, onStart, onBack }: WelcomeProps) {
  return (
    <div
      className={`bg-plum-haze absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-8 text-center text-ivory transition-opacity duration-350 ${fade(visible)}`}
    >
      <Glows />
      <p className="relative text-[0.78rem] leading-[normal] font-medium tracking-[0.22em] text-ivory/78 uppercase">
        G.F.T.E.
      </p>
      <h1 className="relative mt-[0.55rem] max-w-[min(20em,92vw)] text-[clamp(1.45rem,2.7vw,2.35rem)] leading-[1.18] font-medium tracking-[-0.02em]">
        Givaudan Flavor Trends Experience
      </h1>
      <span className="relative mt-[1.15rem] h-px w-18 bg-mauve" />
      <p className="text-shadow-scene relative mt-[0.9rem] max-w-88 text-[1.05rem] leading-[1.45] text-ivory/92">
        Le goût, composé avec précision.
      </p>
      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onStart}
          className="cursor-pointer rounded border border-ivory/72 bg-ivory/10 px-6 py-2.5 text-sm font-medium tracking-[0.01em] text-ivory backdrop-blur-sm transition hover:bg-ivory/20"
        >
          Entrer dans le magasin
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-[6px] border border-[#008075] bg-[#008075] px-6 py-2.5 text-sm font-medium tracking-[0.01em] text-white shadow-sm transition hover:bg-[#006960]"
          >
            Retour au dashboard
          </button>
        )}
      </div>
      <p className="text-shadow-scene relative mt-[1.15rem] max-w-md text-[0.78rem] leading-normal text-ivory/88">
        {onBack ? `${MOVE_HELP} · Tab pour le dashboard` : MOVE_HELP}
      </p>
    </div>
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

function BackButton({
  visible,
  onBack,
}: {
  visible: boolean;
  onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      title="Appuyez sur Tab pour revenir au dashboard"
      className={`fixed bottom-6 left-6 z-20 flex cursor-pointer items-center gap-3 rounded-[8px] border border-[#E5E7EB]/25 border-l-4 border-l-[#008075] bg-[#111111]/95 py-2.5 pr-4 pl-3 text-left text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#008075] ${fade(visible)}`}
    >
      <span className="inline-flex items-center justify-center rounded-[6px] border border-white/25 bg-[#008075] px-2.5 py-1.5 text-xs font-semibold tracking-wider text-white">
        Tab ⇥
      </span>
      <span className="flex flex-col leading-tight">
        <strong className="text-sm font-medium text-white">
          Retour au dashboard
        </strong>
        <small className="text-[11px] text-[#E6F2F1]/85">Appuyer sur Tab</small>
      </span>
    </button>
  );
}
