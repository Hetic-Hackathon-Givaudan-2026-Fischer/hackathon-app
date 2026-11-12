interface TabShortcutProps {
  /** Action affichée à droite de la touche (ex. « Retour au showroom »). */
  label: string;
  title: string;
  onClick: () => void;
  /**
   * Ancré au coin de l'écran (magasin 3D). Dans le dashboard, le bouton
   * reste dans le flux pour ne pas masquer la barre latérale ni le tableau.
   */
  floating?: boolean;
}

/**
 * Bascule dashboard ↔ magasin. Même bouton dans les deux vues.
 */
export function TabShortcut({
  label,
  title,
  onClick,
  floating = true,
}: TabShortcutProps) {
  const placement = floating ? 'fixed bottom-8 left-8 z-20' : 'relative';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`pointer-events-auto ${placement} flex cursor-pointer items-center gap-5 rounded-xl border border-[#E5E7EB]/25 border-l-[6px] border-l-[#008075] bg-[#111111]/95 py-4 pr-7 pl-5 text-left text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#008075]`}
    >
      <span className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-[#008075] px-4 py-2.5 text-lg font-semibold tracking-wider text-white">
        Tab ⇥
      </span>
      <span className="flex flex-col leading-tight">
        <strong className="text-xl font-medium text-white">{label}</strong>
        <small className="text-sm text-[#E6F2F1]/85">Appuyer sur Tab</small>
      </span>
    </button>
  );
}
