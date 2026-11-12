import { useCallback, useState } from 'react';
import { useTrendFilters } from '../../hooks/useTrendFilters';
import { useFamilies, useSummary } from '../../hooks/useTrendsApi';
import { TrendDrawer } from './drawer/TrendDrawer';
import { FallbackBanner } from './FallbackBanner';
import { KpiCards, TopGrowing } from './KpiCards';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ShowroomLinkDialog } from './ShowroomLinkDialog';
import { TrendsPanel } from './TrendsPanel';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from './ui';

// Police du prototype « CRM » : Inter, sinon la police système
const DASHBOARD_FONT = "'Inter', system-ui, -apple-system, sans-serif";

interface DashboardProps {
  /** Faux pendant la 3D : le dashboard reste monté mais ne réagit plus au clavier. */
  active: boolean;
  onEnter3D: () => void;
}

/** Dashboard interne : KPI, liste des arômes, fiche et liens showroom. */
export function Dashboard({ active, onEnter3D }: DashboardProps) {
  const summary = useSummary();
  const families = useFamilies().data?.items ?? [];
  const filters = useTrendFilters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const origin = summary.data?.origin;

  return (
    <div
      className="fixed inset-0 z-30 flex overflow-hidden bg-[#FAFAFA] text-[#111111]"
      style={{ fontFamily: DASHBOARD_FONT }}
    >
      <Sidebar origin={origin} onEnter3D={onEnter3D} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          search={filters.filters.search}
          onSearch={(search) => filters.update({ search })}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <PageHeader
              onEnter3D={onEnter3D}
              onShareLink={() => setLinkDialog(true)}
            />
            <FallbackBanner
              origin={origin}
              dataDate={summary.data?.data_date}
            />
            <KpiCards summary={summary} />
            <TopGrowing summary={summary.data} onSelect={setSelectedId} />
            <TrendsPanel
              filters={filters}
              families={families}
              summary={summary.data}
              onSelect={setSelectedId}
            />
          </div>
        </main>
      </div>
      {selectedId && (
        <TrendDrawer
          key={selectedId}
          trendId={selectedId}
          active={active}
          onClose={closeDrawer}
          onEnter3D={onEnter3D}
        />
      )}
      {linkDialog && (
        <ShowroomLinkDialog
          families={families}
          onClose={() => setLinkDialog(false)}
        />
      )}
    </div>
  );
}

interface PageHeaderProps {
  onEnter3D: () => void;
  onShareLink: () => void;
}

function PageHeader({ onEnter3D, onShareLink }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-[24px] leading-[1.3] font-semibold">
        Tendances d'arômes
      </h1>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={onEnter3D} className={BUTTON_SECONDARY}>
          Ouvrir la vue immersive
        </button>
        <button type="button" onClick={onShareLink} className={BUTTON_PRIMARY}>
          Générer un lien showroom
        </button>
      </div>
    </div>
  );
}
