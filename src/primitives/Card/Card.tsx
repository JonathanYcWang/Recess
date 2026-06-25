import type { ReactNode } from 'react';

import styles from './Card.module.css';

export interface PrimitiveCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const PrimitiveCard = ({ title, children, className = '' }: PrimitiveCardProps) => (
  <section className={`${styles.card} ${className}`}>
    {title ? <h3 className={styles.title}>{title}</h3> : null}
    <div className={styles.body}>{children}</div>
  </section>
);
