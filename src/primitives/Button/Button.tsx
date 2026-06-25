import type { ButtonHTMLAttributes, ReactNode } from 'react';

import interaction from '../shared/interaction.module.css';
import styles from './Button.module.css';

export type PrimitiveButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface PrimitiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PrimitiveButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

export const PrimitiveButton = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: PrimitiveButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${interaction.focusVisible} ${interaction.motion} ${isLoading ? styles.loading : ''} ${className}`}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {children}
    </button>
  );
};
