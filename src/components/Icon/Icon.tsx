import styles from './Icon.module.css';
import { toPressableDivProps } from '@/utils/pressable';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

interface IconProps {
  src: string;
  alt?: string;
  size?: IconSize | number;
  onClick?: () => void;
  onError?: () => void;
}

/**
 * Flexible Icon component that can display any SVG icon.
 */
const Icon = ({ src, alt = '', size = 'md', onClick, onError }: IconProps) => {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  return (
    <div
      className={styles.icon}
      style={{ width: iconSize, height: iconSize }}
      {...(onClick ? toPressableDivProps(onClick) : {})}
    >
      <img alt={alt} className={styles.image} src={src} onError={onError} />
    </div>
  );
};

export default Icon;
