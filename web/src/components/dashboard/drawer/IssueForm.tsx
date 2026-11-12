import { useState, type FormEvent } from 'react';
import { reportIssue } from '../../../api/endpoints';
import {
  ISSUE_MESSAGE_MAX_LENGTH,
  type DataIssueRead,
} from '../../../api/types';
import { useSubmission, type Submission } from '../../../hooks/useSubmission';
import { BUTTON_PRIMARY, FIELD } from '../ui';

interface IssueFormProps {
  trendId: string;
  trendName: string;
}

/** POST /report/issues : le `request_id` renvoyé est montré pour le support. */
export function IssueForm({ trendId, trendName }: IssueFormProps) {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const { submission, submit } = useSubmission(reportIssue);

  async function send(event: FormEvent) {
    event.preventDefault();
    const issue = await submit({
      trend_id: trendId,
      message,
      contact: contact.trim() || null,
    });
    if (issue) setMessage('');
  }

  return (
    <section className="rounded-[8px] border border-[#E5E7EB] p-4">
      <h3 className="text-[15px] font-medium">
        Signaler un problème de données
      </h3>
      <form onSubmit={(event) => void send(event)} className="mt-3 space-y-2">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          maxLength={ISSUE_MESSAGE_MAX_LENGTH}
          rows={3}
          aria-label="Description du problème"
          placeholder={`Ex. : les vues Wikipédia de « ${trendName} » semblent fausses.`}
          className={`${FIELD} h-auto w-full py-2`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            aria-label="E-mail de contact (facultatif)"
            placeholder="E-mail de contact (facultatif)"
            className={`${FIELD} flex-1`}
          />
          <button
            type="submit"
            disabled={submission.state === 'sending' || !message.trim()}
            className={BUTTON_PRIMARY}
          >
            {submission.state === 'sending' ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </form>
      <SubmissionResult submission={submission} />
    </section>
  );
}

function SubmissionResult({
  submission,
}: {
  submission: Submission<DataIssueRead>;
}) {
  if (submission.state === 'done') {
    const { id, request_id } = submission.result;
    return (
      <p role="status" className="mt-2 text-[12px] text-[#047857]">
        Signalement n° {id} enregistré. Référence support :{' '}
        <code>{request_id}</code>
      </p>
    );
  }
  if (submission.state !== 'failed') return null;
  const { error } = submission;
  return (
    <p role="alert" className="mt-2 text-[12px] text-[#B91C1C]">
      Échec : {error.message}
      {error.requestId && (
        <>
          {' '}
          (référence <code>{error.requestId}</code>)
        </>
      )}
    </p>
  );
}
