import styles from './SliderInput.module.css';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helperText?: string;
  onChange: (value: number) => void;
}

const SliderInput = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'min',
  helperText,
  onChange,
}: SliderInputProps) => {
  return (
    <label className={styles.field}>
      <span className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {value} {unit}
        </span>
      </span>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {helperText && <span className={styles.helper}>{helperText}</span>}
    </label>
  );
};

export default SliderInput;
