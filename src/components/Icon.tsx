import React from 'react';
import styles from './Icon.module.css';

interface IconProps {
  src: string;
  alt?: string;
  size?: number;
  onClick?: () => void;
  onError?: () => void;
}

/**
 * Flexible Icon component that can display any SVG icon.
 */
const Icon: React.FC<IconProps> = ({ src, alt = '', size = 24, onClick, onError }) => {
  return (
    <div className={styles.icon} style={{ width: size, height: size }} onClick={onClick}>
      <img alt={alt} className={styles.image} src={src} onError={onError} />
    </div>
  );
};

export default Icon;
