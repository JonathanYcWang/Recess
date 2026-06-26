import type { ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';

import interaction from '../shared/interaction.module.css';
import styles from './Dialog.module.css';

export interface PrimitiveDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  onOpenChange: (isOpen: boolean) => void;
  variant?: 'default' | 'unframed';
  'aria-label'?: string;
  overlayClassName?: string;
  modalClassName?: string;
  dialogClassName?: string;
  contentClassName?: string;
}

export const PrimitiveDialog = ({
  isOpen,
  title,
  description,
  children,
  onOpenChange,
  variant = 'default',
  'aria-label': ariaLabel,
  overlayClassName = '',
  modalClassName = '',
  dialogClassName = '',
  contentClassName = '',
}: PrimitiveDialogProps) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable
    className={`${styles.overlay} ${overlayClassName}`}
  >
    <Modal className={`${styles.modal} ${modalClassName}`}>
      <Dialog
        className={`${styles.dialog} ${variant === 'unframed' ? styles.unframed : ''} ${interaction.focusVisible} ${dialogClassName}`}
        aria-label={title ? undefined : ariaLabel}
      >
        {title ? (
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
        ) : null}
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={`${styles.content} ${contentClassName}`}>{children}</div>
      </Dialog>
    </Modal>
  </ModalOverlay>
);
