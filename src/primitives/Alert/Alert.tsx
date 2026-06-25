import type { ReactNode } from 'react';

import styles from './Alert.module.css';

export type PrimitiveAlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface PrimitiveAlertProps {
  variant?: PrimitiveAlertVariant;
  title?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
}

export const PrimitiveAlert = ({
  variant = 'info',
  title,
  children,
  role = 'alert',
}: PrimitiveAlertProps) => (
  <div className={`${styles.alert} ${styles[variant]}`} role={role}>
    {title ? <p className={styles.title}>{title}</p> : null}
    <div className={styles.body}>{children}</div>
  </div>
);
