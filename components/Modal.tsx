import React, { useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider dialog, for tables. */
  wide?: boolean;
  /** Close when the dark background is clicked. Turn off for forms whose input would be lost. */
  closeOnBackdrop?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, wide = false, closeOnBackdrop = true }: ModalProps) {
  // Only a click that both starts and ends on the backdrop closes the dialog, so selecting
  // text in a field and releasing the mouse outside the box doesn't throw the form away.
  const pressedOnBackdrop = useRef(false);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => {
        if (closeOnBackdrop && pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
        pressedOnBackdrop.current = false;
      }}
    >
      <div className={`modal-container ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} title="Close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
