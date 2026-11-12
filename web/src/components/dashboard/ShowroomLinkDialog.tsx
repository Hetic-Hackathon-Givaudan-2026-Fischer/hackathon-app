import { useState, type FormEvent } from 'react';
import { createShowroomLink } from '../../api/endpoints';
import type {
  FamilyRead,
  ShowroomLinkCreate,
  ShowroomLinkCreatedRead,
} from '../../api/types';
import { useSubmission, type Submission } from '../../hooks/useSubmission';
import { familyLabel, formatDate } from '../../lib/format';
import { Modal } from './Modal';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, EYEBROW, FIELD } from './ui';

// Durées proposées ; vide : SHOWROOM_LINK_TTL_HOURS de l'API (720 h au plus)
const DURATIONS: Array<[hours: string, label: string]> = [
  ['', 'Durée par défaut de l’API'],
  ['24', '24 heures'],
  ['72', '3 jours'],
  ['168', '7 jours'],
  ['720', '30 jours'],
];

interface ShowroomLinkDialogProps {
  families: FamilyRead[];
  onClose: () => void;
}

/** POST /showroom/links : l'URL n'est montrée qu'une fois (ADR 0010). */
export function ShowroomLinkDialog({
  families,
  onClose,
}: ShowroomLinkDialogProps) {
  const { submission, submit } = useSubmission(createShowroomLink);
  // Lien en cours de création ou créé : seul « Terminé » ferme, pour ne
  // jamais perdre une URL qui ne sera plus affichée
  const dismissable =
    submission.state === 'idle' || submission.state === 'failed';
  return (
    <Modal
      placement="center"
      onDismiss={dismissable ? onClose : undefined}
      labelledBy="showroom-link-title"
      className={`${CARD} max-h-full w-[520px] max-w-full overflow-y-auto p-6`}
    >
      <span className={`${EYEBROW} text-[#008075]`}>Vue immersive client</span>
      <h2 id="showroom-link-title" className="mt-1 text-[18px] font-medium">
        Générer un lien showroom
      </h2>
      {submission.state === 'done' ? (
        <CreatedLink link={submission.result} onClose={onClose} />
      ) : (
        <LinkForm
          families={families}
          submission={submission}
          onSubmit={submit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}

interface LinkFormProps {
  families: FamilyRead[];
  submission: Submission<ShowroomLinkCreatedRead>;
  onSubmit: (body: ShowroomLinkCreate) => Promise<unknown>;
  onCancel: () => void;
}

function LinkForm({ families, submission, onSubmit, onCancel }: LinkFormProps) {
  const [clientLabel, setClientLabel] = useState('');
  const [hours, setHours] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const sending = submission.state === 'sending';

  function send(event: FormEvent) {
    event.preventDefault();
    void onSubmit({
      client_label: clientLabel.trim(),
      families: scope,
      ttl_hours: hours ? Number(hours) : null,
    });
  }

  const toggle = (family: string) =>
    setScope((prev) =>
      prev.includes(family)
        ? prev.filter((f) => f !== family)
        : [...prev, family],
    );

  return (
    <form onSubmit={send} className="mt-4 space-y-4">
      <label className="block text-[12px] font-medium text-[#3F3F46]">
        Client
        <input
          required
          maxLength={200}
          value={clientLabel}
          onChange={(event) => setClientLabel(event.target.value)}
          placeholder="Ex. : Nestlé — équipe desserts"
          className={`${FIELD} mt-1.5 w-full`}
        />
      </label>
      <label className="block text-[12px] font-medium text-[#3F3F46]">
        Durée de validité
        <select
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          className={`${FIELD} mt-1.5 w-full cursor-pointer`}
        >
          {DURATIONS.map(([value, label]) => (
            <option key={value || 'default'} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-[12px] font-medium text-[#3F3F46]">
          Familles visibles (aucune cochée : toutes)
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[13px] sm:grid-cols-3">
          {families.map(({ family }) => (
            <label
              key={family}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                checked={scope.includes(family)}
                onChange={() => toggle(family)}
                className="accent-[#008075]"
              />
              {familyLabel(family)}
            </label>
          ))}
        </div>
      </fieldset>
      {submission.state === 'failed' && (
        <p role="alert" className="text-[12px] text-[#B91C1C]">
          Échec : {submission.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2.5 border-t border-[#E5E7EB] pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className={BUTTON_SECONDARY}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={sending || !clientLabel.trim()}
          className={BUTTON_PRIMARY}
        >
          {sending ? 'Génération…' : 'Générer le lien'}
        </button>
      </div>
    </form>
  );
}

interface CreatedLinkProps {
  link: ShowroomLinkCreatedRead;
  onClose: () => void;
}

function CreatedLink({ link, onClose }: CreatedLinkProps) {
  const [copied, setCopied] = useState(false);
  // Presse-papiers absent hors contexte sécurisé (HTTP depuis une IP) :
  // l'URL reste sélectionnable dans le champ
  const copy = () =>
    navigator.clipboard?.writeText(link.url).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  return (
    <div className="mt-4 space-y-3 text-[13px]">
      <p className="text-[#3F3F46]">
        Lien pour <strong>{link.client_label}</strong>, valable jusqu’au{' '}
        {formatDate(link.expires_at)}.
      </p>
      <input
        readOnly
        value={link.url}
        onFocus={(event) => event.target.select()}
        aria-label="URL du lien showroom"
        className={`${FIELD} w-full font-mono text-[12px]`}
      />
      <p className="rounded-[6px] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]">
        Ce lien ne sera plus affiché : copiez-le maintenant. En cas de perte,
        générez-en un autre.
      </p>
      <div className="flex flex-wrap justify-end gap-2.5">
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          className={BUTTON_SECONDARY}
        >
          Ouvrir
        </a>
        {navigator.clipboard && (
          <button type="button" onClick={copy} className={BUTTON_SECONDARY}>
            {copied ? 'Copié ✓' : 'Copier'}
          </button>
        )}
        <button type="button" onClick={onClose} className={BUTTON_PRIMARY}>
          Terminé
        </button>
      </div>
    </div>
  );
}
