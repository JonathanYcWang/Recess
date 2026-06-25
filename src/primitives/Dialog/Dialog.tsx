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
}

export const PrimitiveDialog = ({
  isOpen,
  title,
  description,
  children,
  onOpenChange,
  variant = 'default',
  'aria-label': ariaLabel,
}: PrimitiveDialogProps) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable
    className={styles.overlay}
  >
    <Modal className={styles.modal}>
      <Dialog
        className={`${styles.dialog} ${variant === 'unframed' ? styles.unframed : ''} ${interaction.focusVisible}`}
        aria-label={title ? undefined : ariaLabel}
      >
        {title ? (
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
        ) : null}
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.content}>{children}</div>
      </Dialog>
    </Modal>
  </ModalOverlay>
);
