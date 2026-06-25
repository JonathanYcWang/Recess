import type { ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';

import interaction from '../shared/interaction.module.css';
import styles from './Dialog.module.css';

export interface PrimitiveDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onOpenChange: (isOpen: boolean) => void;
}

export const PrimitiveDialog = ({
  isOpen,
  title,
  description,
  children,
  onOpenChange,
}: PrimitiveDialogProps) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable
    className={styles.overlay}
  >
    <Modal className={styles.modal}>
      <Dialog className={`${styles.dialog} ${interaction.focusVisible}`}>
        <Heading slot="title" className={styles.title}>
          {title}
        </Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.content}>{children}</div>
      </Dialog>
    </Modal>
  </ModalOverlay>
);
