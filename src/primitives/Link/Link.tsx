import type { AnchorHTMLAttributes, ReactNode } from 'react';

import interaction from '../shared/interaction.module.css';
import styles from './Link.module.css';

export interface PrimitiveLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export const PrimitiveLink = ({ children, className = '', ...rest }: PrimitiveLinkProps) => (
  <a className={`${styles.link} ${interaction.focusVisible} ${className}`} {...rest}>
    {children}
  </a>
);
