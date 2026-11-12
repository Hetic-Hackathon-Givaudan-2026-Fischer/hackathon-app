import type { MouseEvent, ReactNode } from 'react';
import { useWindowKey } from '../../hooks/useWindowKey';

interface ModalProps {
  /** Fermeture par Échap ou clic sur le fond ; absente : non fermable ainsi. */
  onDismiss?: () => void;
  /** Vue masquée (ex. pendant la 3D) : Échap ne doit pas la fermer. */
  active?: boolean;
  placement: 'center' | 'end';
  label?: string;
  labelledBy?: string;
  className: string;
  children: ReactNode;
}

const PLACEMENTS = {
  center: 'items-center justify-center p-4',
  end: 'justify-end',
};

/** Fond + boîte de dialogue, communs au tiroir et aux dialogues. */
export function Modal(props: ModalProps) {
  const { onDismiss, active = true, placement, className, children } = props;
  useWindowKey('Escape', onDismiss, active);
  // mousedown sur le fond lui-même : glisser pour sélectionner du texte puis
  // relâcher sur le fond ne ferme pas la boîte
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget) onDismiss?.();
  };
  return (
    <div
      onMouseDown={onBackdrop}
      className={`fixed inset-0 z-50 flex bg-[#111111]/45 backdrop-blur-[1px] ${PLACEMENTS[placement]}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.label}
        aria-labelledby={props.labelledBy}
        className={className}
      >
        {children}
      </div>
    </div>
  );
}
