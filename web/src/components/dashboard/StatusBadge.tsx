// Statut Data/IA d'un arôme, ou « non calculé » en repli CSV (aucun modèle).

interface Tone {
  bg: string;
  text: string;
}

const NEUTRAL: Tone = { bg: '#F4F4F5', text: '#52525B' };

// Couleurs sémantiques de la charte. Les libellés viennent de Data/IA, en
// français : seul un mot-clé connu colore le badge, sinon il reste neutre
const TONES: ReadonlyArray<[keyword: string, tone: Tone]> = [
  ['buzz', { bg: '#FFFBEB', text: '#B45309' }],
  ['baisse', { bg: '#FBEFEB', text: '#B4532F' }],
  ['saisonn', { bg: '#EFF6FF', text: '#1D4ED8' }],
  ['hausse', { bg: '#E6F2F1', text: '#008075' }],
  ['durable', { bg: '#ECFDF5', text: '#047857' }],
];

function toneOf(status: string): Tone {
  const lower = status.toLowerCase();
  return TONES.find(([keyword]) => lower.includes(keyword))?.[1] ?? NEUTRAL;
}

export function StatusBadge({ status }: { status: string | null }) {
  if (status === null) {
    return (
      <span
        title="Repli CSV : aucun modèle appliqué"
        className="inline-flex rounded-full border border-dashed border-[#D4D4D8] px-2 py-0.5 text-[11px] text-[#71717A]"
      >
        Statut non calculé
      </span>
    );
  }
  const tone = toneOf(status);
  return (
    <span
      style={{ backgroundColor: tone.bg, color: tone.text }}
      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
    >
      {status}
    </span>
  );
}
