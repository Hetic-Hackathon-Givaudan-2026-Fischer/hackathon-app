import { FIELD } from './ui';

interface TopbarProps {
  search: string;
  onSearch: (search: string) => void;
}

export function Topbar({ search, onSearch }: TopbarProps) {
  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 lg:px-8">
      <nav
        aria-label="Fil d'Ariane"
        className="hidden items-center gap-2 text-[14px] text-[#71717A] sm:flex"
      >
        <span>Flavours</span>
        <span>/</span>
        <span className="font-medium text-[#18181B]">Tendances d'arômes</span>
      </nav>
      <div className="relative w-full sm:w-[340px]">
        <input
          type="search"
          value={search}
          maxLength={100}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rechercher un arôme (nom ou identifiant)…"
          aria-label="Rechercher un arôme"
          className={`${FIELD} w-full pr-9`}
        />
        <svg
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#71717A]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16.2" y2="16.2" />
        </svg>
      </div>
    </header>
  );
}
