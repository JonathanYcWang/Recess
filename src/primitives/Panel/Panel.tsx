import type { ReactNode } from 'react';

import styles from './Panel.module.css';

export interface PrimitivePanelProps {
  title?: string;
  children: ReactNode;
  /** Landmark label when title is omitted */
  'aria-label'?: string;
  className?: string;
}

export const PrimitivePanel = ({
  title,
  children,
  'aria-label': ariaLabel,
  className = '',
}: PrimitivePanelProps) => (
  <section className={`${styles.panel} ${className}`} aria-label={title ? undefined : ariaLabel}>
    {title ? <h2 className={styles.title}>{title}</h2> : null}
    <div className={styles.body}>{children}</div>
  </section>
);
