import Icon from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  iconSrc?: string;
  variant?: ButtonVariant;
}

const Button = ({ text, onClick, iconSrc, variant = 'primary' }: ButtonProps) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`} onClick={onClick}>
      {iconSrc && variant !== 'tertiary' && <Icon src={iconSrc} alt="Icon" size={20} />}
      <span className={styles.text}>{text}</span>
    </button>
  );
};

export default Button;
