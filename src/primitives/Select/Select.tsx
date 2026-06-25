import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  type Key,
} from 'react-aria-components';

import fieldStyles from '../shared/field.module.css';
import interaction from '../shared/interaction.module.css';
import styles from './Select.module.css';

export interface PrimitiveSelectOption {
  id: string;
  label: string;
  value: string;
}

export interface PrimitiveSelectProps {
  label: string;
  options: PrimitiveSelectOption[];
  selectedKey?: Key | null;
  defaultSelectedKey?: Key;
  description?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
  onSelectionChange?: (key: Key | null) => void;
  id?: string;
}

export const PrimitiveSelect = ({
  label,
  options,
  selectedKey,
  defaultSelectedKey,
  description,
  errorMessage,
  isDisabled,
  isRequired,
  isInvalid,
  placeholder = 'Select an option',
  onSelectionChange,
  id,
}: PrimitiveSelectProps) => {
  const showError = isInvalid && errorMessage;

  return (
    <Select
      id={id}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      isDisabled={isDisabled}
      isRequired={isRequired}
      isInvalid={isInvalid}
      onSelectionChange={onSelectionChange}
      className={fieldStyles.field}
      placeholder={placeholder}
    >
      <Label className={fieldStyles.label}>
        {label}
        {isRequired ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <Button className={`${styles.trigger} ${fieldStyles.input} ${interaction.focusVisible}`}>
        <SelectValue />
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </Button>
      {showError ? <FieldError className={fieldStyles.error}>{errorMessage}</FieldError> : null}
      <Popover className={styles.popover}>
        <ListBox className={styles.listbox}>
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.label}
              className={styles.option}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
};
