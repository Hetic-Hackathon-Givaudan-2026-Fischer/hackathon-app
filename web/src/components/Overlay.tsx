const CONTROLS_HELP =
  'ZQSD / WASD pour marcher · souris pour regarder · clic pour scanner (moins de 3 m) · reclic pour ranger la tablette · Échap pour sortir';

interface OverlayProps {
  hidden: boolean;
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

/** Écran d'accueil : titre, invitation à cliquer et aide des commandes. */
export function Overlay({ hidden }: OverlayProps) {
  return (
    <div
      className={`bg-plum-haze absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-8 text-center text-ivory transition-opacity duration-350 ${hidden ? 'opacity-0' : 'opacity-100'}`}
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
      <p className="relative mt-8 rounded border leading-[normal] border-ivory/72 px-6 pt-[0.4rem] pb-[0.5rem] text-sm tracking-[0.01em]">
        Cliquez pour entrer
      </p>
      <p className="text-shadow-scene relative mt-[1.15rem] max-w-md text-[0.78rem] leading-normal text-ivory/88">
        {CONTROLS_HELP}
      </p>
    </div>
  );
}
