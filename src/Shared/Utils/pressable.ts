import type { HTMLAttributes, KeyboardEvent } from 'react';

type PressableDivProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onClick' | 'onKeyDown' | 'role' | 'tabIndex'
>;

export const toPressableDivProps = (onPress: () => void): PressableDivProps => ({
  role: 'button',
  tabIndex: 0,
  onClick: onPress,
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  },
});
