import type { ReactNode } from 'react';

import styles from './LiveRegion.module.css';

export type PrimitiveLivePoliteness = 'polite' | 'assertive' | 'off';

export interface PrimitiveLiveRegionProps {
  children: ReactNode;
  politeness?: PrimitiveLivePoliteness;
  atomic?: boolean;
  id?: string;
}

export const PrimitiveLiveRegion = ({
  children,
  politeness = 'polite',
  atomic = true,
  id,
}: PrimitiveLiveRegionProps) => (
  <div
    id={id}
    className={styles.liveRegion}
    aria-live={politeness}
    aria-atomic={atomic}
    role="status"
  >
    {children}
  </div>
);
