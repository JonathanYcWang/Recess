import type { ReactNode } from 'react';

export interface Segment {
  label: string;
  isJackpot?: boolean;
  icon: ReactNode;
}
