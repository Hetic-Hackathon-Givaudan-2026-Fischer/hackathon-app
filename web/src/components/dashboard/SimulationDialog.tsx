import { useState, type FormEvent } from 'react';
import { simulate } from '../../api/endpoints';
import type { SimulationCreate, SimulationRead } from '../../api/types';
import { useSubmission, type Submission } from '../../hooks/useSubmission';
import { formatShare } from '../../lib/format';
import { Modal } from './Modal';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, EYEBROW, FIELD } from './ui';

type Variable = keyof SimulationCreate;
type Values = Partial<Record<Variable, string>>;

// Variables du modèle V2 ; champ vide : valeur type de l'API (cas de référence)
const VARIABLES: ReadonlyArray<[Variable, label: string, hint: string]> = [
  ['growth_13w', 'Croissance 13 semaines', '0,45 = +45 %'],
  ['growth_52w', 'Croissance sur un an', 'vs la même période l’an dernier'],
  ['volatility_26w', 'Volatilité 26 semaines', 'écart-type / moyenne'],
  ['spike_ratio', 'Ratio de pic', 'pic 13 sem. / moyenne 26 sem.'],
  ['acceleration', 'Accélération', 'moyenne 4 sem. / moyenne 13 sem.'],
  ['popularity_vs_anchor', 'Popularité vs vanille', 'niveau de recherche'],
  ['market_products_log', 'Produits en rayon', 'log(1 + nombre de produits)'],
];

const VERDICT_TONES: Record<SimulationRead['verdict'], string> = {
  durable: 'bg-[#ECFDF5] text-[#047857]',
  incertain: 'bg-[#F4F4F5] text-[#3F3F46]',
  'buzz probable': 'bg-[#FFFBEB] text-[#B45309]',
};

/** Champs remplis seulement : l'API complète les autres. */
function toBody(values: Values): SimulationCreate {
  const filled = Object.entries(values).filter(([, value]) => value?.trim());
  return Object.fromEntries(
    filled.map(([key, value]) => [key, Number(value)]),
  ) as SimulationCreate;
}

/** POST /simulate : probabilité V2 qu'une hausse d'arôme dure un an. */
export function SimulationDialog({ onClose }: { onClose: () => void }) {
  const { submission, submit } = useSubmission(simulate);
  const [values, setValues] = useState<Values>({});

  function send(event: FormEvent) {
    event.preventDefault();
    void submit(toBody(values));
  }

  return (
    <Modal
      placement="center"
      onDismiss={onClose}
      labelledBy="simulation-title"
      className={`${CARD} max-h-full w-[560px] max-w-full overflow-y-auto p-6`}
    >
      <span className={`${EYEBROW} text-[#008075]`}>Modèle V2 · Data/IA</span>
      <h2 id="simulation-title" className="mt-1 text-[18px] font-medium">
        Simuler un arôme en hausse
      </h2>
      <form onSubmit={send} className="mt-4 space-y-4">
        <VariableFields
          values={values}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
        <SimulationOutcome submission={submission} />
        <div className="flex justify-end gap-2.5 border-t border-[#E5E7EB] pt-4">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Fermer
          </button>
          <button
            type="submit"
            disabled={submission.state === 'sending'}
            className={BUTTON_PRIMARY}
          >
            {submission.state === 'sending' ? 'Calcul…' : 'Calculer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface VariableFieldsProps {
  values: Values;
  onChange: (patch: Values) => void;
}

function VariableFields({ values, onChange }: VariableFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {VARIABLES.map(([key, label, hint]) => (
        <label
          key={key}
          className="block text-[12px] font-medium text-[#3F3F46]"
        >
          {label}
          <input
            type="number"
            step="any"
            value={values[key] ?? ''}
            onChange={(event) => onChange({ [key]: event.target.value })}
            placeholder="Valeur type"
            className={`${FIELD} mt-1.5 w-full`}
          />
          <span className="mt-1 block text-[11px] font-normal text-[#71717A]">
            {hint}
          </span>
        </label>
      ))}
    </div>
  );
}

function SimulationOutcome({
  submission,
}: {
  submission: Submission<SimulationRead>;
}) {
  if (submission.state === 'failed') {
    const detail =
      submission.error.status === 503
        ? 'Modèle indisponible : l’API Data/IA ne répond pas.'
        : submission.error.message;
    return (
      <p role="alert" className="text-[12px] text-[#B91C1C]">
        Échec : {detail}
      </p>
    );
  }
  if (submission.state !== 'done') return null;
  const { probability, verdict, note } = submission.result;
  return (
    <div role="status" className="rounded-[8px] bg-[#FAFAFA] p-4">
      <div className="flex items-center gap-3">
        <span className="text-[24px] font-semibold tabular-nums">
          {formatShare(probability)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${VERDICT_TONES[verdict]}`}
        >
          {verdict}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-[#71717A]">
        Probabilité que la hausse dure un an. {note}
      </p>
    </div>
  );
}
