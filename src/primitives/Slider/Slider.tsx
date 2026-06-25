import { Label, Slider, SliderOutput, SliderThumb, SliderTrack } from 'react-aria-components';

import fieldStyles from '../shared/field.module.css';
import interaction from '../shared/interaction.module.css';
import styles from './Slider.module.css';

export interface PrimitiveSliderProps {
  label: string;
  value?: number;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  isDisabled?: boolean;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  id?: string;
}

export const PrimitiveSlider = ({
  label,
  value,
  defaultValue,
  minValue = 0,
  maxValue = 100,
  step = 1,
  formatOptions,
  isDisabled,
  onChange,
  onChangeEnd,
  id,
}: PrimitiveSliderProps) => (
  <Slider
    id={id}
    value={value}
    defaultValue={defaultValue}
    minValue={minValue}
    maxValue={maxValue}
    step={step}
    formatOptions={formatOptions}
    isDisabled={isDisabled}
    onChange={onChange}
    onChangeEnd={onChangeEnd}
    className={fieldStyles.field}
  >
    <div className={styles.header}>
      <Label className={fieldStyles.label}>{label}</Label>
      <SliderOutput className={styles.output} />
    </div>
    <SliderTrack className={styles.track}>
      {({ state }) => (
        <>
          <div className={styles.fill} style={{ width: `${state.getThumbPercent(0) * 100}%` }} />
          <SliderThumb className={`${styles.thumb} ${interaction.focusVisible}`} />
        </>
      )}
    </SliderTrack>
  </Slider>
);
