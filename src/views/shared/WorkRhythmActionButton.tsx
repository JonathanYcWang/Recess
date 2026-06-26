import { PrimitiveButton, type PrimitiveButtonVariant } from '@/primitives';
import Icon from '@/components/Icon/Icon';
import buttonStyles from '@/components/Button/Button.module.css';

type WorkRhythmActionButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface WorkRhythmActionButtonProps {
  text: string;
  onClick?: () => void;
  iconSrc?: string;
  variant?: WorkRhythmActionButtonVariant;
  className?: string;
  disabled?: boolean;
}

const primitiveVariantByLegacyVariant: Record<
  WorkRhythmActionButtonVariant,
  PrimitiveButtonVariant
> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'ghost',
};

const WorkRhythmActionButton = ({
  text,
  onClick,
  iconSrc,
  variant = 'primary',
  className = '',
  disabled = false,
}: WorkRhythmActionButtonProps) => {
  const primitiveVariant = primitiveVariantByLegacyVariant[variant];
  const buttonClassName = `${buttonStyles.button} ${buttonStyles[variant]} ${className} ${disabled ? buttonStyles.disabled : ''}`;

  return (
    <PrimitiveButton
      variant={primitiveVariant}
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {iconSrc && variant !== 'tertiary' ? <Icon src={iconSrc} alt="Icon" size={20} /> : null}
      <span className={buttonStyles.text}>{text}</span>
    </PrimitiveButton>
  );
};

export default WorkRhythmActionButton;
