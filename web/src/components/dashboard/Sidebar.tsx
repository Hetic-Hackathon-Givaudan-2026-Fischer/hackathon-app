import type { DataAiState, Origin } from '../../api/types';
import { useHealth } from '../../hooks/useTrendsApi';
import { ORIGIN_LABELS } from '../../lib/format';

const DATA_AI_LABELS: Record<DataAiState, string> = {
  up: 'API Data/IA connectée',
  down: 'API Data/IA injoignable',
  non_configuree: 'API Data/IA non configurée',
};

interface SidebarProps {
  origin: Origin | undefined;
  onEnter3D: () => void;
}

export function Sidebar({ origin, onEnter3D }: SidebarProps) {
  return (
    <aside
      aria-label="Navigation principale"
      className="flex w-[72px] shrink-0 flex-col justify-between bg-[#111111] text-white lg:w-[256px]"
    >
      <div>
        <Brand />
        <nav className="flex flex-col gap-1 px-3 pt-6">
          <NavItem active label="Tendances & signaux" icon={HOME_ICON} />
          <NavItem
            label="Showroom digital"
            icon={STORE_ICON}
            onClick={onEnter3D}
          />
        </nav>
      </div>
      <SourceStatus origin={origin} />
    </aside>
  );
}

function Brand() {
  return (
    <div className="flex h-[64px] items-center gap-3 border-b border-white/10 px-4 lg:px-6">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#008075] text-[15px] font-semibold">
        G
      </span>
      <div className="hidden flex-col lg:flex">
        <span className="text-[15px] leading-tight font-semibold">
          GIVAUDAN
        </span>
        <span className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
          Flavour trends
        </span>
      </div>
    </div>
  );
}

interface NavItemProps {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ label, icon, active = false, onClick }: NavItemProps) {
  const tone = active
    ? 'bg-[#008075] text-white'
    : 'text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-[6px] px-3 text-[14px] font-medium transition ${tone}`}
    >
      <svg
        className="size-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d={icon} />
      </svg>
      <span className="hidden truncate lg:inline">{label}</span>
    </button>
  );
}

function servedLabel(origin: Origin | undefined): string {
  if (origin === undefined) return 'Origine des données : en attente.';
  return `Données servies : ${ORIGIN_LABELS[origin]}.`;
}

/** État réel de la source : `/health` (Data/IA) et origine des données servies. */
function SourceStatus({ origin }: { origin: Origin | undefined }) {
  const { data: health, error } = useHealth();
  const dataAi = health ? DATA_AI_LABELS[health.data_ai] : 'Vérification…';
  const fallback = origin === 'csv_fallback';
  return (
    <div className="hidden border-t border-white/10 p-4 lg:block">
      <div className="rounded-[8px] bg-[#1F1F1F] p-3">
        <div className="flex items-center gap-2 text-[12px] font-medium">
          <span
            className={`size-2 rounded-full ${error ? 'bg-[#B91C1C]' : fallback ? 'bg-[#C29B38]' : 'bg-[#008075]'}`}
          />
          <span className="truncate">{error ? 'API injoignable' : dataAi}</span>
        </div>
        <p className="mt-1 text-[11px] leading-[1.4] text-[#71717A]">
          {servedLabel(origin)}
        </p>
      </div>
    </div>
  );
}

const HOME_ICON =
  'M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z';
const STORE_ICON =
  'M3 9l1.5-5h15L21 9M3 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8';
